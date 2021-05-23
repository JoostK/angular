/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NgIterable, TemplateRef, TrackByFunction, ttc, ɵɵDirectiveDeclaration, ɵɵNgModuleDeclaration, ɵɵPipeDeclaration} from '@angular/core';

export interface NgForOfContext<T, U extends NgIterable<T>> {
  $implicit: T;
  ngForOf: U;
  odd: boolean;
  event: boolean;
  first: boolean;
  last: boolean;
  count: number;
  index: number;
}

export interface NgIfContext<T = unknown> {
  $implicit: T;
  ngIf: T;
}

/**
 * A fake version of the NgFor directive.
 */
export declare class NgForOf<T, U extends NgIterable<T>> {
  ngForOf: U&NgIterable<T>|null|undefined;
  ngForTrackBy: TrackByFunction<T>;
  ngForTemplate: TemplateRef<NgForOfContext<T, U>>;

  static ɵdir: ɵɵDirectiveDeclaration < NgForOf<any, any>, '[ngFor][ngForOf]', never, {
    'ngForOf': 'ngForOf';
    'ngForTrackBy': 'ngForTrackBy';
    'ngForTemplate': 'ngForTemplate';
  }
  , {}, never > ;
  static ngTemplateContextGuard<T, U extends NgIterable<T>>(dir: NgForOf<T, U>, ctx: any):
      ctx is NgForOfContext<T, U>;
}

export declare class NgIf<T = unknown> {
  ngIf: T;
  ngIfThen: TemplateRef<NgIfContext<T>>|null;
  ngIfElse: TemplateRef<NgIfContext<T>>|null;
  static ɵdir: ɵɵDirectiveDeclaration < NgIf<any>, '[ngIf]', never, {
    'ngIf': 'ngIf';
    'ngIfThen': 'ngIfThen';
    'ngIfElse': 'ngIfElse';
  }
  , {}, never > ;
  static ngTemplateGuard_ngIf: 'binding';
  static ngTemplateGuard_ngIfElse:
      ttc.GuardTemplate<ttc.Binding<NgIf, 'ngIfElse'>, ttc.Not<ttc.Binding<NgIf, 'ngIf'>>>;

  // Maybe alternatively?
  // static ngTemplateGuards: [
  //    ttc.Binding<NgIf, 'ngIf'>,
  //    ttc.GuardTemplate<ttc.Binding<NgIf, 'ngIfElse'>, ttc.Not<ttc.Binding<NgIf, 'ngIf'>>>,
  // ];
  static ngTemplateContextGuard<T>(dir: NgIf<T>, ctx: any):
      ctx is NgIfContext<Exclude<T, false|0|''|null|undefined>>;
}

export declare class NgTemplateOutlet {
  ngTemplateOutlet: TemplateRef<any>|null;
  ngTemplateOutletContext: Object|null;

  static ɵdir: ɵɵDirectiveDeclaration < NgTemplateOutlet, '[ngTemplateOutlet]', never, {
    'ngTemplateOutlet': 'ngTemplateOutlet';
    'ngTemplateOutletContext': 'ngTemplateOutletContext';
  }
  , {}, never > ;
  static ngTemplateContextGuard<T>(dir: NgIf<T>, ctx: any):
      ctx is NgIfContext<Exclude<T, false|0|''|null|undefined>>;
}

export declare class DatePipe {
  transform(value: Date|string|number, format?: string, timezone?: string, locale?: string): string
      |null;
  transform(value: null|undefined, format?: string, timezone?: string, locale?: string): null;
  transform(
      value: Date|string|number|null|undefined, format?: string, timezone?: string,
      locale?: string): string|null;
  static ɵpipe: ɵɵPipeDeclaration<DatePipe, 'date'>;
}

export declare class IndexPipe {
  transform<T>(value: T[], index: number): T;

  static ɵpipe: ɵɵPipeDeclaration<IndexPipe, 'index'>;
}

export declare class NgSwitch {
  ngSwitch: any;
  static ɵdir: ɵɵDirectiveDeclaration < NgSwitch, '[ngSwitch]', never, {
    'ngSwitch': 'ngSwitch';
  }
  , {}, never > ;
}

export declare class NgSwitchCase {
  ngSwitchCase: any;

  static ɵdir: ɵɵDirectiveDeclaration < NgSwitchCase, '[ngSwitchCase]', never, {
    'ngSwitchCase': 'ngSwitchCase';
  }
  , {}, never > ;

  // static ngTemplateGuard: ttc.Binary<ttc.Binding<ttc.Parent<NgSwitch>, 'ngSwitch'>, '==',
  // ttc.Binding<NgSwitchCase, 'ngSwitchCase'>>;
  static ngTemplateGuard_ngSwitchCase: ttc.Binary<
      ttc.Binding<ttc.Parent<NgSwitch>, 'ngSwitch'>,
      '==', ttc.Binding<NgSwitchCase, 'ngSwitchCase'>>;
}

export class NgSwitchDefault {
  static ɵdir: ɵɵDirectiveDeclaration<NgSwitchDefault, '[ngSwitchDefault]', never, {}, {}, never>;

  static ngTemplateGuard: ttc.Not<ttc.Or<ttc.Siblings<ttc.Guard<NgSwitchCase, 'ngSwitchCase'>>>>;
}

export declare class CommonModule {
  static ɵmod: ɵɵNgModuleDeclaration<
      CommonModule,
      [
        typeof NgForOf, typeof NgIf, typeof DatePipe, typeof IndexPipe, typeof NgTemplateOutlet,
        typeof NgSwitch, typeof NgSwitchCase, typeof NgSwitchDefault
      ],
      never, [
        typeof NgForOf, typeof NgIf, typeof DatePipe, typeof IndexPipe, typeof NgTemplateOutlet,
        typeof NgSwitch, typeof NgSwitchCase, typeof NgSwitchDefault
      ]>;
}
