/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as ts from 'typescript';

import {Reference} from '../../imports';
import {ClassDeclaration, isNamedClassDeclaration, ReflectionHost} from '../../reflection';

export interface GuardContext {
  pushArray(scope: TargetInstruction, variableName: string, expr: ts.Expression): void;
  getArray(scope: TargetInstruction, variableName: string): ts.Expression[]|null;

  getBinding(target: TargetInstruction, fieldName: string): ts.Expression|null;
  getGuard(target: TargetInstruction, fieldName: string): ts.Expression|null;

  guardTemplate(target: TargetInstruction, fieldName: string, expr: ts.Expression): void;

  getSiblings(match: BindingGuardInstruction|GuardGuardInstruction): ts.Expression[]|null;
}

export function evaluateInstruction(
    instruction: GuardInstruction, ctx: GuardContext): ts.Expression|null {
  switch (instruction.kind) {
    case GuardInstructionKind.Parent:
      return null;
    case GuardInstructionKind.Binding:
      return evaluateBinding(instruction, ctx);
    case GuardInstructionKind.Binary:
      return evaluateBinary(instruction, ctx);
    case GuardInstructionKind.Not:
      return evaluateNot(instruction, ctx);
    case GuardInstructionKind.Or:
      return evaluateOr(instruction, ctx);
    case GuardInstructionKind.GuardTemplate:
      return evaluateGuardTemplate(instruction, ctx);
    case GuardInstructionKind.Array:
      return unexpected();
    case GuardInstructionKind.Push:
      return evaluatePush(instruction, ctx);
    case GuardInstructionKind.Siblings:
      return unexpected();
    case GuardInstructionKind.Guard:
      return evaluateGuard(instruction, ctx);
  }
}

function evaluateBinding(instruction: BindingGuardInstruction, ctx: GuardContext): ts.Expression|
    null {
  return ctx.getBinding(instruction.directive, instruction.field);
}

function evaluateGuard(instruction: GuardGuardInstruction, ctx: GuardContext): ts.Expression|null {
  return ctx.getGuard(instruction.directive, instruction.field);
}

function evaluateNot(instruction: NotGuardInstruction, ctx: GuardContext): ts.Expression|null {
  const operand = evaluateInstruction(instruction.operand, ctx);
  if (operand === null) {
    return unexpected();
  }

  return ts.factory.createPrefixUnaryExpression(ts.SyntaxKind.ExclamationToken, operand);
}

function evaluateSiblings(
    instruction: SiblingsGuardInstruction, ctx: GuardContext): ts.Expression[]|null {
  return ctx.getSiblings(instruction.match);
}

function evaluateOr(instruction: OrGuardInstruction, ctx: GuardContext): ts.Expression|null {
  const conditions = instruction.instruction.kind === GuardInstructionKind.Array ?
      evaluateArray(instruction.instruction, ctx) :
      evaluateSiblings(instruction.instruction, ctx);
  if (conditions === null || conditions.length === 0) {
    return unexpected();
  }

  return conditions.slice(1).reduce(
      (binary, condition) =>
          ts.factory.createBinaryExpression(binary, ts.SyntaxKind.BarBarToken, condition),
      conditions[0]);
}

function evaluateGuardTemplate(
    instruction: GuardTemplateGuardInstruction, ctx: GuardContext): ts.Expression|null {
  const expr = evaluateInstruction(instruction.instruction, ctx);
  if (expr === null) {
    return unexpected();
  }

  ctx.guardTemplate(instruction.ref.directive, instruction.ref.field, expr);
  return unexpected();
}

function evaluateArray(instruction: ArrayGuardInstruction, ctx: GuardContext): ts.Expression[]|
    null {
  return ctx.getArray(instruction.scope, instruction.name);
}

function evaluatePush(instruction: PushGuardInstruction, ctx: GuardContext): ts.Expression|null {
  const expr = evaluateInstruction(instruction.instruction, ctx);
  if (expr === null) {
    return unexpected();
  }

  ctx.pushArray(instruction.scope, instruction.name, expr);

  return expr;
}

function evaluateBinary(instruction: BinaryGuardInstruction, ctx: GuardContext): ts.Expression|
    null {
  const left = evaluateInstruction(instruction.left, ctx);
  if (left === null) {
    return unexpected();
  }

  const right = evaluateInstruction(instruction.right, ctx);
  if (right === null) {
    return unexpected();
  }

  let op: ts.BinaryOperator;
  switch (instruction.op) {
    case '==':
      op = ts.SyntaxKind.EqualsEqualsToken;
      break;
    case '===':
      op = ts.SyntaxKind.EqualsEqualsEqualsToken;
      break;
  }

  return ts.factory.createBinaryExpression(left, op, right);
}

////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

export function reflectGuardInstruction(guardType: ts.TypeNode, reflector: ReflectionHost):
    GuardInstruction|Reference<ClassDeclaration>|null {
  const guard = reflectGuardType(guardType, reflector);
  if (guard !== null) {
    return guard;
  }

  if (!ts.isTypeReferenceNode(guardType)) {
    return unexpected();
  }

  let identifier: ts.Identifier;
  if (ts.isQualifiedName(guardType.typeName)) {
    identifier = guardType.typeName.right;
  } else if (ts.isIdentifier(guardType.typeName)) {
    identifier = guardType.typeName;
  } else {
    return unexpected();
  }

  const decl = reflector.getDeclarationOfIdentifier(identifier);
  if (decl === null || decl.node === null || !isNamedClassDeclaration(decl.node)) {
    return unexpected();
  }

  return new Reference(decl.node);
}

export function reflectGuardType(
    guardType: ts.TypeNode, reflector: ReflectionHost): GuardInstruction|null {
  if (!ts.isTypeReferenceNode(guardType)) {
    return unexpected();
  }

  const guard = extractGuard(guardType, reflector);
  if (guard === null) {
    return null;
  }

  const kind = GuardInstructionKind[guard as keyof typeof GuardInstructionKind];
  if (kind === undefined) {
    return unexpected();
  }

  switch (kind) {
    case GuardInstructionKind.Binding:
      return reflectBinding(guardType.typeArguments, reflector);
    case GuardInstructionKind.Array:
      return reflectArray(guardType.typeArguments, reflector);
    case GuardInstructionKind.Not:
      return reflectNot(guardType.typeArguments, reflector);
    case GuardInstructionKind.Or:
      return reflectOr(guardType.typeArguments, reflector);
    case GuardInstructionKind.Parent:
      return reflectParent(guardType.typeArguments, reflector);
    case GuardInstructionKind.Binary:
      return reflectBinary(guardType.typeArguments, reflector);
    case GuardInstructionKind.GuardTemplate:
      return reflectGuardTemplate(guardType.typeArguments, reflector);
    case GuardInstructionKind.Push:
      return reflectPush(guardType.typeArguments, reflector);
    case GuardInstructionKind.Guard:
      return reflectGuard(guardType.typeArguments, reflector);
    case GuardInstructionKind.Siblings:
      return reflectSiblings(guardType.typeArguments, reflector);
  }
}

export function reflectTargetInstruction(
    guardType: ts.TypeNode, reflector: ReflectionHost): TargetInstruction|null {
  const guard = reflectGuardInstruction(guardType, reflector);
  if (guard === null) {
    return unexpected();
  }

  if (guard instanceof Reference) {
    return guard;
  }

  if (guard.kind !== GuardInstructionKind.Parent) {
    return unexpected();
  }

  return guard;
}

export function reflectBinding(
    typeArguments: ts.NodeArray<ts.TypeNode>|undefined,
    reflector: ReflectionHost): BindingGuardInstruction|null {
  if (typeArguments === undefined || typeArguments.length !== 2) {
    return unexpected();
  }

  const directive = reflectTargetInstruction(typeArguments[0], reflector);
  if (directive === null) {
    return unexpected();
  }
  const field = reflectString(typeArguments[1]);
  if (field === null) {
    return unexpected();
  }
  return {
    kind: GuardInstructionKind.Binding,
    directive,
    field,
  };
}

export function reflectGuard(
    typeArguments: ts.NodeArray<ts.TypeNode>|undefined,
    reflector: ReflectionHost): GuardGuardInstruction|null {
  if (typeArguments === undefined || typeArguments.length !== 2) {
    return unexpected();
  }

  const directive = reflectTargetInstruction(typeArguments[0], reflector);
  if (directive === null) {
    return unexpected();
  }
  const field = reflectString(typeArguments[1]);
  if (field === null) {
    return unexpected();
  }
  return {
    kind: GuardInstructionKind.Guard,
    directive,
    field,
  };
}

export function reflectSiblings(
    typeArguments: ts.NodeArray<ts.TypeNode>|undefined,
    reflector: ReflectionHost): SiblingsGuardInstruction|null {
  if (typeArguments === undefined || typeArguments.length !== 1) {
    return unexpected();
  }

  const match = reflectGuardType(typeArguments[0], reflector);
  if (match === null) {
    return unexpected();
  }
  if (match.kind !== GuardInstructionKind.Guard && match.kind !== GuardInstructionKind.Binding) {
    return unexpected();
  }
  if (!(match.directive instanceof Reference)) {
    // Siblings can only refer to direct type references.
    return unexpected();
  }
  return {
    kind: GuardInstructionKind.Siblings,
    match,
  };
}

export function reflectNot(
    typeArguments: ts.NodeArray<ts.TypeNode>|undefined,
    reflector: ReflectionHost): NotGuardInstruction|null {
  if (typeArguments === undefined || typeArguments.length !== 1) {
    return unexpected();
  }

  const operand = reflectGuardType(typeArguments[0], reflector);
  if (operand === null) {
    return unexpected();
  }
  return {
    kind: GuardInstructionKind.Not,
    operand,
  };
}

export function reflectOr(
    typeArguments: ts.NodeArray<ts.TypeNode>|undefined,
    reflector: ReflectionHost): OrGuardInstruction|null {
  if (typeArguments === undefined || typeArguments.length !== 1) {
    return unexpected();
  }

  const instruction = reflectGuardType(typeArguments[0], reflector);
  if (instruction === null) {
    return unexpected();
  }
  if (instruction.kind !== GuardInstructionKind.Array &&
      instruction.kind !== GuardInstructionKind.Siblings) {
    return unexpected();
  }
  return {
    kind: GuardInstructionKind.Or,
    instruction,
  };
}

export function reflectGuardTemplate(
    typeArguments: ts.NodeArray<ts.TypeNode>|undefined,
    reflector: ReflectionHost): GuardTemplateGuardInstruction|null {
  if (typeArguments === undefined || typeArguments.length !== 2) {
    return unexpected();
  }

  const ref = reflectGuardType(typeArguments[0], reflector);
  if (ref === null) {
    return unexpected();
  }
  if (ref.kind !== GuardInstructionKind.Binding) {
    return unexpected();
  }
  const instruction = reflectGuardType(typeArguments[1], reflector);
  if (instruction === null) {
    return unexpected();
  }
  return {
    kind: GuardInstructionKind.GuardTemplate,
    ref,
    instruction,
  };
}

export function reflectParent(
    typeArguments: ts.NodeArray<ts.TypeNode>|undefined,
    reflector: ReflectionHost): ParentGuardInstruction|null {
  if (typeArguments === undefined || typeArguments.length !== 1) {
    return unexpected();
  }

  const type = reflectGuardInstruction(typeArguments[0], reflector);
  if (type === null) {
    return unexpected();
  }
  if (!(type instanceof Reference)) {
    return unexpected();
  }
  return {
    kind: GuardInstructionKind.Parent,
    type,
  };
}

export function reflectBinary(
    typeArguments: ts.NodeArray<ts.TypeNode>|undefined,
    reflector: ReflectionHost): BinaryGuardInstruction|null {
  if (typeArguments === undefined || typeArguments.length !== 3) {
    return unexpected();
  }

  const left = reflectGuardType(typeArguments[0], reflector);
  if (left === null) {
    return unexpected();
  }
  const op = reflectString(typeArguments[1]);
  if (op !== '==' && op !== '===') {
    return unexpected();
  }
  const right = reflectGuardType(typeArguments[2], reflector);
  if (right === null) {
    return unexpected();
  }
  return {
    kind: GuardInstructionKind.Binary,
    left,
    op,
    right,
  };
}

export function reflectArray(
    typeArguments: ts.NodeArray<ts.TypeNode>|undefined,
    reflector: ReflectionHost): ArrayGuardInstruction|null {
  if (typeArguments === undefined || typeArguments.length !== 2) {
    return unexpected();
  }

  const scope = reflectTargetInstruction(typeArguments[0], reflector);
  if (scope === null) {
    return unexpected();
  }
  const name = reflectString(typeArguments[1]);
  if (name === null) {
    return unexpected();
  }
  return {
    kind: GuardInstructionKind.Array,
    scope,
    name,
  };
}

export function reflectPush(
    typeArguments: ts.NodeArray<ts.TypeNode>|undefined,
    reflector: ReflectionHost): PushGuardInstruction|null {
  if (typeArguments === undefined || typeArguments.length !== 3) {
    return unexpected();
  }

  const scope = reflectTargetInstruction(typeArguments[0], reflector);
  if (scope === null) {
    return unexpected();
  }
  const name = reflectString(typeArguments[1]);
  if (name === null) {
    return unexpected();
  }
  const instruction = reflectGuardType(typeArguments[2], reflector);
  if (instruction === null) {
    return unexpected();
  }
  return {
    kind: GuardInstructionKind.Push,
    scope,
    name,
    instruction,
  };
}

export function reflectString(guardType: ts.TypeNode|undefined): string|null {
  if (guardType === undefined) {
    return unexpected();
  }
  if (!ts.isLiteralTypeNode(guardType) || !ts.isStringLiteralLike(guardType.literal)) {
    return unexpected();
  }
  return guardType.literal.text;
}

export function extractGuard(guard: ts.TypeReferenceNode, reflector: ReflectionHost): string|null {
  let identifier: ts.Identifier;
  if (ts.isQualifiedName(guard.typeName)) {
    identifier = guard.typeName.right;
  } else {
    identifier = guard.typeName;
  }

  const decl = reflector.getDeclarationOfIdentifier(identifier);
  if (decl === null || decl.node === null || !ts.isTypeAliasDeclaration(decl.node)) {
    return null;
  }

  // if (decl.viaModule !== '@angular/core') {
  //   return null;
  // }

  return decl.node.name.text;
}

function unexpected(): null {
  // This function exists only to break at any return that hit unexpected input, to more easily
  // debug what is happening. Eventually these situations should report diagnostics.
  // tslint:disable-next-line: no-debugger
  debugger;
  return null;
}

export enum GuardInstructionKind {
  Parent,
  Binding,
  Binary,
  Not,
  Or,
  GuardTemplate,
  Array,
  Push,
  Siblings,
  Guard,
}

export interface ParentGuardInstruction {
  kind: GuardInstructionKind.Parent;
  type: Reference<ClassDeclaration>;
}

export interface BindingGuardInstruction {
  kind: GuardInstructionKind.Binding;
  directive: TargetInstruction;
  field: string;
}

export interface BinaryGuardInstruction {
  kind: GuardInstructionKind.Binary;
  left: GuardInstruction;
  op: '=='|'===';
  right: GuardInstruction;
}

export interface NotGuardInstruction {
  kind: GuardInstructionKind.Not;
  operand: GuardInstruction;
}

export interface OrGuardInstruction {
  kind: GuardInstructionKind.Or;
  instruction: ArrayGuardInstruction|SiblingsGuardInstruction;
}

export interface GuardTemplateGuardInstruction {
  kind: GuardInstructionKind.GuardTemplate;
  ref: BindingGuardInstruction;
  instruction: GuardInstruction;
}

export interface ArrayGuardInstruction {
  kind: GuardInstructionKind.Array;
  scope: TargetInstruction;
  name: string;
}

export interface PushGuardInstruction {
  kind: GuardInstructionKind.Push;
  scope: TargetInstruction;
  name: string;
  instruction: GuardInstruction;
}

export interface SiblingsGuardInstruction {
  kind: GuardInstructionKind.Siblings;
  match: BindingGuardInstruction|GuardGuardInstruction;
}

export interface GuardGuardInstruction {
  kind: GuardInstructionKind.Guard;
  directive: TargetInstruction;
  field: string;
}

export type GuardInstruction = ParentGuardInstruction|BindingGuardInstruction|
    BinaryGuardInstruction|NotGuardInstruction|OrGuardInstruction|GuardTemplateGuardInstruction|
    ArrayGuardInstruction|PushGuardInstruction|SiblingsGuardInstruction|GuardGuardInstruction;

// TODO: refactor into single instruction type
export type TargetInstruction = ParentGuardInstruction|Reference<ClassDeclaration>;
