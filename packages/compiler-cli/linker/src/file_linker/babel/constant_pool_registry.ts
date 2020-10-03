/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {ConstantPool} from '@angular/compiler';
import {NodePath, Scope} from '@babel/traverse';
import * as t from '@babel/types';

import {assert} from '../../ast/utils';
import {FatalLinkerError} from '../../fatal_linker_error';
import {LinkerImportGenerator} from '../../linker_import_generator';
import {Translator} from '../translator';

/**
 * A registry that tracks `ngImport` and `ConstantPool` values by the lexical scope of the binding
 * of the `ngImport` expression.
 */
export class ConstantPoolRegistry {
  private registryMap = new Map<Scope, {ngImport: NodePath<t.Expression>, pool: ConstantPool}>();

  constructor(private translator: Translator<t.Statement, t.Expression>) {}

  /**
   * Get, or create and register, a `ConstantPool` for the scope of the given `ngImport`
   * expression`.
   *
   * For any `ngImport` expression, we identify the lexical scope of its binding (i.e. where it was
   * declared). There is a `ConstantPool` associated with each lexical scope, which is returned.
   *
   * It is assumed that all `ngImport` expressions within a single file are compatible and
   * interchangeable, so the registry only tracks the first `ngImport` expression for which we
   * request a `ConstantPool`.
   *
   * @param ngImport The `ngImport` expression for which we need a `ConstantPool`.
   */
  getConstantPoolFor(ngImport: NodePath<t.Expression>): ConstantPool {
    const scope = getScopeFor(ngImport);
    if (!this.registryMap.has(scope)) {
      this.registryMap.set(scope, {ngImport, pool: new ConstantPool()});
    }
    return this.registryMap.get(scope)!.pool;
  }

  /**
   * Iterate through all the `ConstantPool`s in the registry, translating and inserting the
   * statements from each into the appropriate point in the code.
   */
  insertStatements(): void {
    for (const [binding, {ngImport, pool}] of this.registryMap.entries()) {
      const importGenerator = new LinkerImportGenerator<t.Expression>(ngImport.node);
      const statements = pool.statements.map(
          statement => this.translator.translateStatement(statement, importGenerator));
      const insertionFn = getInsertionFn(binding);
      insertionFn(statements);
    }
  }
}

/**
 * Get the lexical scope of the binding of the given `expression`.
 *
 * @param expression An expression that is either an identifier (e.g. `foo`) or a simple member
 *     expression chain (e.g. `foo.bar.qux`). If neither then an error is thrown.
 * @returns The lexical scope for the binding of the identifier on the far LHS of the `expression`
 *     (e.g. `foo` in both examples above).
 */
function getScopeFor(expression: NodePath<t.Expression>): Scope {
  // If the expression is of the form `a.b.c` then we want to get the far LHS (e.g. `a`).
  let bindingExpression = expression;
  while (bindingExpression.isMemberExpression()) {
    bindingExpression = bindingExpression.get('object');
  }
  // We only support expressions that can be reduced to a identifier that has a binding.
  assert(
      expression.node, t.isIdentifier,
      '`ngImport` to be an identifier or a simple member access with an identifier on the far LHS.');
  const binding = expression.scope.getBinding(expression.node.name);
  if (binding === undefined) {
    throw new FatalLinkerError(
        expression.node,
        'Invalid `ngImport` property. No variable binding can be found for this expression.');
  }
  return binding.scope;
}

/**
 * Get a function that can insert statements into the given lexical `scope`.
 *
 * The insertion point is:
 *
 * - at the top of a function body
 * - after the last import statement in a top level file
 *
 * @param scope The lexical scope into which we want to insert statements.
 */
function getInsertionFn(scope: Scope): (nodes: t.Statement[]) => void {
  const path = scope.path;

  // If the scope corresponds to a function then insert at the start of the function body.
  if (path.isFunctionParent()) {
    const body = path.get('body');
    return nodes => body.unshiftContainer('body', nodes);
  }

  // If the scope corresponds to a file (`t.Program`) then insert after the last import statement
  // (or at the top of the file if there are no imports).
  if (path.isProgram()) {
    const body = path.get('body');
    const importStatements = body.filter(statement => statement.isImportDeclaration());
    if (importStatements.length === 0) {
      return nodes => path.unshiftContainer('body', nodes);
    } else {
      return nodes => importStatements[importStatements.length - 1].insertAfter(nodes);
    }
  }

  // Don't know what kind of container this is...
  throw new FatalLinkerError(
      path.node,
      'Unsupported binding location. It was not possible to identify where to insert constant pool statements based on this binding expression.');
}
