/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {ConstantPool} from '@angular/compiler';
import {ImportGenerator} from '../../../src/ngtsc/translator';
import {AstObject} from '../ast/ast_value';
import {FatalLinkerError} from '../fatal_linker_error';
import {LinkerImportGenerator} from '../linker_import_generator';
import {ConstantScope, GetConstantScope} from './constant_pool_scope';

import {LinkerEnvironment} from './linker_environment';
import {PartialLinkerSelector} from './partial_linkers/partial_linker_selector';

/**
 * This class is responsible for linking all the partial declarations found in a single file.
 */
export class FileLinker<TStatement, TExpression> {
  private linkerSelector = new PartialLinkerSelector<TStatement, TExpression>();
  private scopes = new Map<ConstantScope<TStatement>, EmitScope<TExpression>>();

  constructor(
      private linkerEnvironment: LinkerEnvironment<TStatement, TExpression>,
      private sourceUrl: string, readonly code: string) {}

  /**
   * Return true if the given callee name matches a partial declaration that can be linked.
   */
  isPartialDeclaration(calleeName: string): boolean {
    return this.linkerSelector.supportsDeclaration(calleeName);
  }

  /**
   * Link the metadata extracted from the args of a call to a partial declaration function.
   */
  linkPartialDeclaration(
      declarationFn: string, args: TExpression[],
      getConstantScope: GetConstantScope<TStatement, TExpression>): TExpression {
    if (args.length !== 1) {
      throw new Error(
          `Invalid function call: It should have only a single object literal argument, but contained ${
              args.length}.`);
    }

    const metaObj = AstObject.parse(args[0], this.linkerEnvironment.host);
    const ngImport = metaObj.getNode('ngImport');
    const emitScope = this.getEmitScope(ngImport, getConstantScope);

    const version = getVersion(metaObj);
    const linker = this.linkerSelector.getLinker(declarationFn, version);
    const definition = linker.linkPartialDeclaration(
        this.linkerEnvironment, this.sourceUrl, this.code, emitScope.pool, metaObj);

    return emitScope.transform(definition);
  }

  finalize(): void {
    for (const [constantScope, emitScope] of this.scopes.entries()) {
      const statements = emitScope.pool.statements.map(
          statement => this.linkerEnvironment.translator.translateStatement(
              statement, emitScope.importGenerator));
      constantScope.insert(statements);
    }
  }

  private getEmitScope(
      ngImport: TExpression,
      getConstantScope: GetConstantScope<TStatement, TExpression>): EmitScope<TExpression> {
    const constantScope = getConstantScope(ngImport);
    if (constantScope === null) {
      return new IifeEmitScope(ngImport, this.linkerEnvironment);
    }
    if (!this.scopes.has(constantScope)) {
      this.scopes.set(constantScope, new EmitScope(ngImport));
    }
    return this.scopes.get(constantScope)!;
  }
}

class EmitScope<TExpression> {
  readonly pool = new ConstantPool();
  readonly importGenerator: ImportGenerator<TExpression>;

  constructor(ngImport: TExpression) {
    this.importGenerator = new LinkerImportGenerator(ngImport);
  }

  transform(definition: TExpression): TExpression {
    return definition;
  }
}

class IifeEmitScope<TStatement, TExpression> extends EmitScope<TExpression> {
  constructor(
      ngImport: TExpression,
      private readonly linkerEnvironment: LinkerEnvironment<TStatement, TExpression>) {
    super(ngImport);
  }

  transform(definition: TExpression): TExpression {
    const {translator, factory} = this.linkerEnvironment;
    const constantStatements = this.pool.statements.map(
        statement => translator.translateStatement(statement, this.importGenerator));

    const body =
        factory.createBlock([...constantStatements, factory.createReturnStatement(definition)]);
    const fn = factory.createFunctionExpression(/* name */ null, /* args */[], body);
    return factory.createCallExpression(fn, /* args */[], /* pure */ false);
  }
}

/**
 * Extract the `version` number from the `metaObj`.
 */
function getVersion<TExpression>(metaObj: AstObject<TExpression>): number {
  try {
    return metaObj.getNumber('version');
  } catch (e) {
    throw new FatalLinkerError(metaObj.expression, `Invalid declaration property: ${e.message}`);
  }
}
