/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {ConstantPool} from '@angular/compiler';
import * as o from '@angular/compiler/src/output/output_ast';
import {AstObject} from '../ast/ast_value';
import {LinkerImportGenerator} from '../linker_import_generator';
import {ConstantScope, GetConstantScope} from './constant_pool_scope';

import {LinkerEnvironment} from './linker_environment';
import {PartialLinkerSelector} from './partial_linkers/partial_linker_selector';

/**
 * This class is responsible for linking all the partial declarations found in a single file.
 */
export class FileLinker<TStatement, TExpression> {
  private linkerSelector = new PartialLinkerSelector<TStatement, TExpression>();
  private scopes = new Map<ConstantScope<TStatement>, EmitScope<TStatement, TExpression>>();

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

    const version = metaObj.getNumber('version');
    const linker = this.linkerSelector.getLinker(declarationFn, version);
    const definition = linker.linkPartialDeclaration(
        this.linkerEnvironment, this.sourceUrl, this.code, emitScope.constantPool, metaObj);

    return emitScope.translate(definition);
  }

  finalize(): void {
    for (const [constantScope, emitScope] of this.scopes.entries()) {
      const statements = emitScope.getConstantStatements();
      constantScope.insert(statements);
    }
  }

  private getEmitScope(
      ngImport: TExpression, getConstantScope: GetConstantScope<TStatement, TExpression>):
      EmitScope<TStatement, TExpression> {
    const constantScope = getConstantScope(ngImport);
    if (constantScope === null) {
      return new IifeEmitScope(ngImport, this.linkerEnvironment);
    }
    if (!this.scopes.has(constantScope)) {
      this.scopes.set(constantScope, new EmitScope(ngImport, this.linkerEnvironment));
    }
    return this.scopes.get(constantScope)!;
  }
}

class EmitScope<TStatement, TExpression> {
  readonly constantPool = new ConstantPool();

  constructor(
      protected readonly ngImport: TExpression,
      protected readonly linkerEnvironment: LinkerEnvironment<TStatement, TExpression>) {}

  translate(definition: o.Expression): TExpression {
    return this.linkerEnvironment.translator.translateExpression(
        definition, new LinkerImportGenerator(this.ngImport));
  }

  getConstantStatements(): TStatement[] {
    const {translator} = this.linkerEnvironment;
    const importGenerator = new LinkerImportGenerator(this.ngImport);
    return this.constantPool.statements.map(
        statement => translator.translateStatement(statement, importGenerator));
  }
}

class IifeEmitScope<TStatement, TExpression> extends EmitScope<TStatement, TExpression> {
  translate(definition: o.Expression): TExpression {
    const {factory} = this.linkerEnvironment;
    const constantStatements = this.getConstantStatements();

    const returnStatement = factory.createReturnStatement(super.translate(definition));
    const body = factory.createBlock([...constantStatements, returnStatement]);
    const fn = factory.createFunctionExpression(/* name */ null, /* args */[], body);
    return factory.createCallExpression(fn, /* args */[], /* pure */ false);
  }
}
