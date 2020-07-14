/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {AST, BindingType, TmplAstBoundText, TmplAstElement, TmplAstNode, TmplAstTemplate, TmplAstVariable} from '@angular/compiler';

import {TypeCheckableDirectiveMeta, TypeCheckBlockMetadata} from './api';
import {DomSchemaChecker} from './dom';
import {OutOfBandDiagnosticRecorder} from './oob';
import {ExpressionSemanticVisitor} from './template_semantics';

export interface TypeCheckCodegen {
  visitElement(node: TmplAstElement): void;

  visitBoundText(node: TmplAstBoundText): void;

  visitTemplate(node: TmplAstTemplate, processChildren: () => void): void;

  visitBindings(
      node: TmplAstElement|TmplAstTemplate, directives: TypeCheckableDirectiveMeta[]|null): void;
}

export class NoopTypeCheckCodegen implements TypeCheckCodegen {
  visitElement(node: TmplAstElement): void {}

  visitBoundText(node: TmplAstBoundText): void {}

  visitTemplate(node: TmplAstTemplate, processChildren: () => void): void {
    processChildren();
  }

  visitBindings(
    node: TmplAstElement | TmplAstTemplate, directives: TypeCheckableDirectiveMeta[] | null): void {}
}

export class TemplateValidator {
  constructor(
      private meta: TypeCheckBlockMetadata, private domSchemaChecker: DomSchemaChecker,
      private oobRecorder: OutOfBandDiagnosticRecorder, private codegen: TypeCheckCodegen) {}

  validate(nodes: TmplAstNode[]): void {
    this.visitAll(nodes);
  }

  private visitAll(nodes: TmplAstNode[]): void {
    for (const node of nodes) {
      this.visitNode(node);
    }
  }

  private visitNode(node: TmplAstNode): void {
    if (node instanceof TmplAstElement) {
      this.visitElement(node);
    } else if (node instanceof TmplAstTemplate) {
      this.visitTemplate(node);
    } else if (node instanceof TmplAstBoundText) {
      this.visitBoundText(node);
    }
  }

  private visitElement(element: TmplAstElement): void {
    this.checkReferencesOfNode(element);

    this.codegen.visitElement(element);
    this.visitBindings(element);
    this.visitAll(element.children);
  }

  private visitTemplate(template: TmplAstTemplate): void {
    this.checkReferencesOfNode(template);
    this.visitBindings(template);

    this.codegen.visitTemplate(template, () => {
      this.visitAll(template.children);
    });

    const varMap = new Map<string, TmplAstVariable>();
    for (const v of template.variables) {
      // Validate that variables on the `TmplAstTemplate` are only declared once.
      if (!varMap.has(v.name)) {
        varMap.set(v.name, v);
      } else {
        const firstDecl = varMap.get(v.name)!;
        this.oobRecorder.duplicateTemplateVar(this.meta.id, v, firstDecl);
      }
    }
  }

  private visitBoundText(node: TmplAstBoundText): void {
    this.codegen.visitBoundText(node);

    this.checkExpression(node.value);
  }

  private visitBindings(node: TmplAstElement|TmplAstTemplate): void {
    // Collect all the inputs on the element.
    const claimedInputs = new Set<string>();
    const directives = this.meta.boundTarget.getDirectivesOfNode(node);

    this.codegen.visitBindings(node, directives);

    if (directives === null || directives.length === 0) {
      // If there are no directives, then all inputs are unclaimed inputs, so queue an operation
      // to add them if needed.
      if (node instanceof TmplAstElement) {
        this.checkSchema(node, /* checkElement */ true, claimedInputs);
      }
      return;
    }

    // After expanding the directives, we might need to queue an operation to check any unclaimed
    // inputs.
    if (node instanceof TmplAstElement) {
      // Go through the directives and remove any inputs that it claims from `elementInputs`.
      for (const dir of directives) {
        for (const fieldName of Object.keys(dir.inputs)) {
          const value = dir.inputs[fieldName];
          claimedInputs.add(Array.isArray(value) ? value[0] : value);
        }
      }

      // If there are no directives which match this element, then it's a "plain" DOM element (or a
      // web component), and should be checked against the DOM schema. If any directives match,
      // we must assume that the element could be custom (either a component, or a directive like
      // <router-outlet>) and shouldn't validate the element name itself.
      const checkElement = directives.length === 0;
      this.checkSchema(node, checkElement, claimedInputs);
    }

    for (const input of node.inputs) {
      this.checkExpression(input.value);
    }
    for (const output of node.outputs) {
      this.checkExpression(output.handler);
    }
  }

  private checkExpression(ast: AST): void {
    ExpressionSemanticVisitor.visit(
        ast, this.meta.id, this.meta.boundTarget, this.meta.pipes, this.oobRecorder);
  }

  private checkSchema(element: TmplAstElement, checkElement: boolean, claimedInputs: Set<string>):
      void {
    if (checkElement) {
      this.domSchemaChecker.checkElement(this.meta.id, element, this.meta.schemas);
    }

    // TODO(alxhub): this could be more efficient.
    for (const binding of element.inputs) {
      if (binding.type === BindingType.Property && !claimedInputs.has(binding.name)) {
        // A direct binding to a property not claimed by a directive.
        this.domSchemaChecker.checkProperty(
            this.meta.id, element, binding.name, binding.sourceSpan, this.meta.schemas);
      }
    }
  }

  private checkReferencesOfNode(node: TmplAstElement|TmplAstTemplate): void {
    for (const ref of node.references) {
      if (this.meta.boundTarget.getReferenceTarget(ref) === null) {
        this.oobRecorder.missingReferenceTarget(this.meta.id, ref);
      }
    }
  }
}

interface DirectiveBindings<TBinding> {
  claimed: {directive: TypeCheckableDirectiveMeta; bindings: TBinding[];}[];
  unclaimed: TBinding[];
}
