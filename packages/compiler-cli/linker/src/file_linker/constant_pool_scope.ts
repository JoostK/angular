/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {ConstantPool} from '@angular/compiler';
import * as t from '@babel/types';

export interface ConstantPoolScope<TStatement, TExpression> {
  getConstantScope(ngImport: TExpression): ConstantScope<TStatement>;
}

export interface ConstantScope<TStatement> {
  readonly pool: ConstantPool;
  readonly ngImport: t.Expression;

  insert(statements: TStatement[]): void;
}
