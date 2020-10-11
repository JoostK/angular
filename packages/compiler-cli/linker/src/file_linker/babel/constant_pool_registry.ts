/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {Scope} from '@babel/traverse';
import * as t from '@babel/types';

import {assert} from '../../ast/utils';
import {FatalLinkerError} from '../../fatal_linker_error';
import {ConstantScope, GetConstantScope} from '../constant_pool_scope';

export class ConstantPoolRegistry {
  private registryMap = new Map<Scope, ConstantScope<t.Statement>>();

  forScope(scope: Scope): GetConstantScope<t.Statement, t.Expression> {
    return ngImport => {
      const scope = getScopeFor(ngImport, scope);
      if (!this.registryMap.has(scope)) {
        this.registryMap.set(scope, new DynamicScope(scope));
      }
      return this.registryMap.get(scope)!;
    };
  }
}

class DynamicScope implements ConstantScope<t.Statement> {
  constructor(private scope: Scope) {}

  insert(statements: t.Statement[]): void {
    const insertionFn = getInsertionFn(this.scope);
    insertionFn(statements);
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
function getScopeFor(expression: t.Expression, currentScope: Scope): Scope {
  // If the expression is of the form `a.b.c` then we want to get the far LHS (e.g. `a`).
  let bindingExpression = expression;
  while (t.isMemberExpression(bindingExpression)) {
    bindingExpression = bindingExpression.object;
  }

  // We only support expressions that can be reduced to a identifier that has a binding.
  assert(
      expression, t.isIdentifier,
      '`ngImport` to be an identifier or a simple member access with an identifier on the far LHS.');
  const binding = currentScope.getBinding(expression.name);
  if (binding === undefined) {
    throw new FatalLinkerError(
        expression,
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
