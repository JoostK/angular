/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * @fileoverview The API from compiler-cli that the `@angular/core`
 * package requires for migration schematics.
 */

export {forwardRefResolver} from '@angular/compiler-cli/src/ngtsc/annotations';
export {Reference} from '@angular/compiler-cli/src/ngtsc/imports';
export {DynamicValue, PartialEvaluator, ResolvedValue, ResolvedValueMap, StaticInterpreter} from '@angular/compiler-cli/src/ngtsc/partial_evaluator';
export {reflectObjectLiteral, TypeScriptReflectionHost} from '@angular/compiler-cli/src/ngtsc/reflection';
