/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {NodePath, Scope} from '@babel/traverse';
import * as t from '@babel/types';

import {ConstantScope, GetConstantScope} from '../constant_pool_scope';

export class ConstantPoolRegistry {
  private registryMap = new Map<Scope, ConstantScope<t.Statement>|null>();

  forScope(scope: Scope): GetConstantScope<t.Statement, t.Expression> {
    return ngImport => {
      const scope = getScopeFor(ngImport, scope);
      if (scope === null) {
        return null;
      }
      if (!this.registryMap.has(scope)) {
        const insertionScope = getInsertionScope(scope);
        this.registryMap.set(scope, insertionScope);
      }
      return this.registryMap.get(scope)!;
    };
  }
}

class ProgramScope implements ConstantScope<t.Statement> {
  constructor(private program: NodePath<t.Program>) {}

  insert(statements: t.Statement[]): void {
    const body = this.program.get('body');
    const importStatements = body.filter(statement => statement.isImportDeclaration());
    if (importStatements.length === 0) {
      this.program.unshiftContainer('body', statements);
    } else {
      importStatements[importStatements.length - 1].insertAfter(statements);
    }
  }
}

class FunctionScope implements ConstantScope<t.Statement> {
  constructor(private function: NodePath<t.FunctionParent>) {}

  insert(statements: t.Statement[]): void {
    const body = this.function.get('body');
    body.unshiftContainer('body', statements);
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
function getScopeFor(expression: t.Expression, currentScope: Scope): Scope|null {
  // If the expression is of the form `a.b.c` then we want to get the far LHS (e.g. `a`).
  let bindingExpression = expression;
  while (t.isMemberExpression(bindingExpression)) {
    bindingExpression = bindingExpression.object;
  }

  if (!t.isIdentifier(expression)) {
    return null;
  }
  const binding = currentScope.getBinding(expression.name);
  if (binding === undefined) {
    return null;
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
function getInsertionScope(scope: Scope): ConstantScope<t.Statement>|null {
  const path = scope.path;

  // If the scope corresponds to a function then insert at the start of the function body.
  if (path.isFunctionParent()) {
    return new FunctionScope(path);
  }

  // If the scope corresponds to a file (`t.Program`) then insert after the last import statement
  // (or at the top of the file if there are no imports).
  if (path.isProgram()) {
    return new ProgramScope(path);
  }

  // Don't know what kind of container this is...
  return null;
}
