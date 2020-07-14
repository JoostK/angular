/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {AST, BoundTarget, ImplicitReceiver, PropertyWrite, RecursiveAstVisitor, TmplAstVariable} from '@angular/compiler';
import {BindingPipe} from '../../../../../compiler';
import {Reference} from '../../imports';

import {TemplateId} from './api';
import {OutOfBandDiagnosticRecorder} from './oob';

/**
 * Visits a template and records any semantic errors within its expressions.
 */
export class ExpressionSemanticVisitor extends RecursiveAstVisitor {
  constructor(
      private templateId: TemplateId, private boundTarget: BoundTarget<any>,
      private pipes: Map<string, Reference>, private oob: OutOfBandDiagnosticRecorder) {
    super();
  }

  visitPipe(ast: BindingPipe, context: any): void {
    super.visitPipe(ast, context);

    if (!this.pipes.has(ast.name)) {
      this.oob.missingPipe(this.templateId, ast);
    }
  }

  visitPropertyWrite(ast: PropertyWrite, context: any): void {
    super.visitPropertyWrite(ast, context);

    if (!(ast.receiver instanceof ImplicitReceiver)) {
      return;
    }

    const target = this.boundTarget.getExpressionTarget(ast);
    if (target instanceof TmplAstVariable) {
      // Template variables are read-only.
      this.oob.illegalAssignmentToTemplateVar(this.templateId, ast, target);
    }
  }

  static visit(
      ast: AST, id: TemplateId, boundTarget: BoundTarget<any>, pipes: Map<string, Reference>,
      oob: OutOfBandDiagnosticRecorder): void {
    ast.visit(new ExpressionSemanticVisitor(id, boundTarget, pipes, oob));
  }
}
