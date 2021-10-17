/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import ts from 'typescript';

import {getImportSpecifier, replaceImport} from '../../utils/typescript/imports';
import {closestNode} from '../../utils/typescript/nodes';

import {isReferenceToImport} from '../../utils/typescript/symbol';

export interface AwaitedFunction {
  originalFunctionName: string;
  newFunctionName: string;
  moduleName: string;
}

const MIGRATE_TO_ASYNC_FUNCTIONS: AwaitedFunction[] = [
  {originalFunctionName: 'tick', newFunctionName: 'tickClock', moduleName: '@angular/core/testing'},
  {
    originalFunctionName: 'flushMicrotasks',
    newFunctionName: 'flushMicrotasksAsync',
    moduleName: '@angular/core/testing'
  },
];

/**
 * Represents a function that contains calls that have to be migrated to become awaited, requiring
 * that the function itself becomes async.
 */
export interface ToBecomeAsync {
  function: ts.ArrowFunction|ts.FunctionExpression|ts.FunctionDeclaration;
  calls: CallToMigrate[];
}

/**
 * Represents a call expression that needs to be migrated to become awaited.
 */
export interface CallToMigrate {
  callExpression: FreeCallExpression;
  fn: AwaitedFunction;
}

/**
 * Represents an import specifier within an import group for a function that needs to be migrated.
 */
export interface ImportsToMigrate {
  importSpecifier: ts.ImportSpecifier;
  namedImport: ts.NamedImports;
  fn: AwaitedFunction;
}

export function findImports(sourceFile: ts.SourceFile): ImportsToMigrate[] {
  const migrations: ImportsToMigrate[] = [];
  for (const asyncFunction of MIGRATE_TO_ASYNC_FUNCTIONS) {
    if (!sourceFile.text.includes(asyncFunction.originalFunctionName)) {
      continue;
    }
    const importSpecifier = getImportSpecifier(
        sourceFile, asyncFunction.moduleName, asyncFunction.originalFunctionName);
    if (importSpecifier === null) {
      continue;
    }
    const namedImport = closestNode<ts.NamedImports>(importSpecifier, ts.SyntaxKind.NamedImports);
    if (namedImport === null) {
      continue;
    }
    migrations.push({importSpecifier, namedImport, fn: asyncFunction});
  }
  return migrations;
}

export function combineImportRewrites(imports: ImportsToMigrate[]) {
  const rewrittenImports = new Map<ts.NamedImports, ts.NamedImports>();
  for (const imp of imports) {
    const rewrittenImport = rewrittenImports.has(imp.namedImport) ?
        rewrittenImports.get(imp.namedImport)! :
        imp.namedImport;
    const updatedImport =
        replaceImport(rewrittenImport, imp.fn.originalFunctionName, imp.fn.newFunctionName);
    rewrittenImports.set(imp.namedImport, updatedImport);
  }
  return rewrittenImports;
}

export function findToBecomeAwaitedCallExpressions(
    sourceFile: ts.SourceFile, typeChecker: ts.TypeChecker, importMigrations: ImportsToMigrate[]) {
  const results: ToBecomeAsync[] = [];

  let currentScope: ToBecomeAsync|null = null;
  ts.forEachChild(sourceFile, function visitNode(node: ts.Node) {
    let priorScope = currentScope;
    if (ts.isFunctionExpression(node) || ts.isArrowFunction(node) ||
        ts.isFunctionDeclaration(node)) {
      currentScope = {function: node, calls: []};
    }

    const migration = findApplicableMigration(typeChecker, node, importMigrations);
    if (migration !== null && currentScope !== null) {
      currentScope.calls.push(migration);
    }

    ts.forEachChild(node, visitNode);

    if (currentScope !== null && node === currentScope.function) {
      if (currentScope.calls.length > 0) {
        results.push(currentScope);
      }

      currentScope = priorScope;
    }
  });

  return results;
}

export function isAsync(fnDecl: ts.FunctionLikeDeclaration): boolean {
  return fnDecl.modifiers !== undefined &&
      fnDecl.modifiers.some(mod => mod.kind === ts.SyntaxKind.AsyncKeyword);
}

function findApplicableMigration(
    typeChecker: ts.TypeChecker, node: ts.Node,
    importMigrations: ImportsToMigrate[]): CallToMigrate|null {
  if (!isFreeCallExpression(node)) {
    return null;
  }
  for (const migration of importMigrations) {
    if (node.expression.text === migration.fn.originalFunctionName &&
        isReferenceToImport(typeChecker, node.expression, migration.importSpecifier)) {
      return {callExpression: node, fn: migration.fn};
    }
  }
  return null;
}

export function shouldWrapInParenthesis(callExpr: FreeCallExpression): boolean {
  const parent = callExpr.parent;
  if (parent === undefined) {
    return false;
  }

  return !ts.isExpressionStatement(parent) && !ts.isParenthesizedExpression(parent);
}

type FreeCallExpression = ts.CallExpression&{expression: ts.Identifier};

function isFreeCallExpression(node: ts.Node): node is FreeCallExpression {
  return ts.isCallExpression(node) && ts.isIdentifier(node.expression);
}
