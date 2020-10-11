/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export type GetConstantScope<TStatement, TExpression> = (ngImport: TExpression) =>
    ConstantScope<TStatement>;

export interface ConstantScope<TStatement> {
  insert(statements: TStatement[]): void;
}
