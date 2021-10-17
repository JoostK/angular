/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Replacement, RuleFailure, Rules} from 'tslint';
import ts from 'typescript';

import {combineImportRewrites, findImports, findToBecomeAwaitedCallExpressions, isAsync, shouldWrapInParenthesis} from '../async-fake-async/helpers';

/** TSLint rule that migrates synchronous fakeAsync to an asynchronous alternative */
export class Rule extends Rules.TypedRule {
  override applyWithProgram(sourceFile: ts.SourceFile, program: ts.Program): RuleFailure[] {
    const failures: RuleFailure[] = [];


    const imports = findImports(sourceFile);
    if (imports.length === 0) {
      return failures;
    }

    const printer = ts.createPrinter();
    const typeChecker = program.getTypeChecker();

    // Update import specifiers.
    const rewrittenImports = combineImportRewrites(imports);
    for (const [originalImport, rewrittenImport] of rewrittenImports) {
      failures.push(
          this._getNamedImportsFailure(originalImport, rewrittenImport, sourceFile, printer));
    }

    // Migrate calls to awaited calls using their new function name.
    findToBecomeAwaitedCallExpressions(sourceFile, typeChecker, imports).forEach(toBecomeAsync => {
      const replacements: Replacement[] = [];
      if (!isAsync(toBecomeAsync.function)) {
        replacements.push(Replacement.appendText(toBecomeAsync.function.getStart(), 'async '));
      }

      for (const call of toBecomeAsync.calls) {
        const functionNameNode = call.callExpression.expression;

        replacements.push(
            Replacement.replaceNode(functionNameNode, `await ${call.fn.newFunctionName}`));
        if (shouldWrapInParenthesis(call.callExpression)) {
          replacements.push(Replacement.appendText(functionNameNode.getStart(), '('));
          replacements.push(Replacement.appendText(call.callExpression.getEnd(), ')'));
        }
      }

      failures.push(new RuleFailure(
          sourceFile, toBecomeAsync.function.getStart(), toBecomeAsync.function.getStart() + 1,
          'Synchronous usage of fakeAsync need to be replaced with their asynchronous alternatives.',
          this.ruleName, replacements));
    });

    return failures;
  }

  private _getNamedImportsFailure(
      originalImport: ts.NamedImports, rewrittenImport: ts.NamedImports, sourceFile: ts.SourceFile,
      printer: ts.Printer): RuleFailure {
    const replacementText = printer.printNode(ts.EmitHint.Unspecified, rewrittenImport, sourceFile);

    return new RuleFailure(
        sourceFile, originalImport.getStart(), originalImport.getEnd(),
        'Synchronous usage of fakeAsync need to be replaced with their asynchronous alternatives.',
        this.ruleName,
        new Replacement(originalImport.getStart(), originalImport.getWidth(), replacementText));
  }
}
