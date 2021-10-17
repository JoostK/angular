/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Rule, SchematicsException, Tree} from '@angular-devkit/schematics';
import {relative} from 'path';
import ts from 'typescript';

import {getProjectTsConfigPaths} from '../../utils/project_tsconfig_paths';
import {canMigrateFile, createMigrationProgram} from '../../utils/typescript/compiler_host';
import {combineImportRewrites, findImports, findToBecomeAwaitedCallExpressions, isAsync, shouldWrapInParenthesis} from './helpers';

export default function(): Rule {
  return async (tree: Tree) => {
    const {buildPaths, testPaths} = await getProjectTsConfigPaths(tree);
    const basePath = process.cwd();
    const allPaths = [...buildPaths, ...testPaths];

    if (!allPaths.length) {
      throw new SchematicsException(
          'Could not find any tsconfig file. Cannot migrate fakeAsync to become asynchronous.');
    }

    for (const tsconfigPath of allPaths) {
      runAsyncFakeAsyncMigration(tree, tsconfigPath, basePath);
    }
  };
}

function runAsyncFakeAsyncMigration(tree: Tree, tsconfigPath: string, basePath: string) {
  const {program} = createMigrationProgram(tree, tsconfigPath, basePath);
  const typeChecker = program.getTypeChecker();
  const printer = ts.createPrinter();
  const sourceFiles =
      program.getSourceFiles().filter(sourceFile => canMigrateFile(basePath, sourceFile, program));

  for (const sourceFile of sourceFiles) {
    const imports = findImports(sourceFile);
    if (imports.length === 0) {
      continue;
    }

    const update = tree.beginUpdate(relative(basePath, sourceFile.fileName));

    // Update import specifiers.
    const rewrittenImports = combineImportRewrites(imports);
    for (const [originalImport, rewrittenImport] of rewrittenImports) {
      update.remove(originalImport.getStart(), originalImport.getWidth());
      update.insertRight(
          originalImport.getStart(),
          printer.printNode(ts.EmitHint.Unspecified, rewrittenImport, sourceFile));
    }

    // Migrate calls to awaited calls using their new function name.
    findToBecomeAwaitedCallExpressions(sourceFile, typeChecker, imports).forEach(toBecomeAsync => {
      if (!isAsync(toBecomeAsync.function)) {
        update.insertLeft(toBecomeAsync.function.getStart(), 'async ');
      }
      for (const call of toBecomeAsync.calls) {
        const functionNameNode = call.callExpression.expression;
        update.remove(functionNameNode.getStart(), functionNameNode.getWidth());
        update.insertRight(functionNameNode.getStart(), `await ${call.fn.newFunctionName}`);
        if (shouldWrapInParenthesis(call.callExpression)) {
          update.insertLeft(functionNameNode.getStart(), `(`);
          update.insertRight(call.callExpression.getEnd(), `)`);
        }
      }
    });

    tree.commitUpdate(update);
  }
}
