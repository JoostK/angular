/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

export namespace ttc {
  export type Parent<T> = T;
  export type Siblings<Match extends Binding<any, any>|Guard<any, any>> = unknown;

  export type Property<Directive, Property extends keyof Directive> = unknown;
  export type Binding<Directive, Property extends keyof Directive> = unknown;
  export type Guard<Directive, Property extends keyof Directive> = unknown;
  export type Binary<Left, Op extends '=='|'===', Right> = unknown;

  export type Not<T> = unknown;
  export type Or<T> = unknown;
  export type GuardTemplate<TemplateRef, GuardExpression> = unknown;

  export type Array<Name, Scope> = unknown;
  export type Push<Expression, Name, Scope> = unknown;
}
