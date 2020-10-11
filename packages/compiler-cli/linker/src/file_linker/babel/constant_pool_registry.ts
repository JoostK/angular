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

export class ConstantScopeRegistry {
  private registryMap = new Map<Scope, ConstantScope<t.Statement>|null>();

  forScope(declarationScope: Scope): GetConstantScope<t.Statement, t.Expression> {
    return ngImport => {
      const scope = getScopeFor(ngImport, declarationScope);
      if (scope === null) {
        return null;
      }
      if (!this.registryMap.has(scope)) {
        const constantScope = createConstantScope(scope);
        this.registryMap.set(scope, constantScope);
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
  constructor(private fn: NodePath<t.FunctionParent>) {}

  insert(statements: t.Statement[]): void {
    const body = this.fn.get('body');
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
function getScopeFor(expression: t.Expression, declarationScope: Scope): Scope|null {
  // If the expression is of the form `a.b.c` then we want to get the far LHS (e.g. `a`).
  let bindingExpression = expression;
  while (t.isMemberExpression(bindingExpression)) {
    bindingExpression = bindingExpression.object;
  }

  if (!t.isIdentifier(expression)) {
    return null;
  }
  const binding = declarationScope.getBinding(expression.name);
  if (binding === undefined) {
    return null;
  }
  return binding.scope;
}

function createConstantScope(scope: Scope): ConstantScope<t.Statement>|null {
  const path = scope.path;

  if (path.isFunctionParent()) {
    return new FunctionScope(path);
  } else if (path.isProgram()) {
    return new ProgramScope(path);
  } else {
    return null;
  }
}
