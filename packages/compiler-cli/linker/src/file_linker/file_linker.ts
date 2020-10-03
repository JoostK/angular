/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {ConstantPool} from '@angular/compiler';

import {AstObject} from '../ast/ast_value';
import {FatalLinkerError} from '../fatal_linker_error';

import {LinkerEnvironment} from './linker_environment';
import {PartialLinkerSelector} from './partial_linkers/partial_linker_selector';

/**
 * This class is responsible for linking all the partial declarations found in a single file.
 */
export class FileLinker<TStatement, TExpression> {
  private linkerSelector = new PartialLinkerSelector<TStatement, TExpression>();

  constructor(
      private linkerEnvironment: LinkerEnvironment<TStatement, TExpression>,
      private sourceUrl: string, readonly code: string) {}

  /**
   * Return true if the given callee name matches a partial declaration that can be linked.
   */
  isPartialDeclaration(calleeName: string): boolean {
    return this.linkerSelector.supportsDeclaration(calleeName);
  }

  /**
   * Link the metadata extracted from the args of a call to a partial declaration function.
   */
  linkPartialDeclaration(
      declarationFn: string, metaObj: AstObject<TExpression>,
      constantPool: ConstantPool): TExpression {
    const version = getVersion(metaObj);
    const linker = this.linkerSelector.getLinker(declarationFn, version);
    return linker.linkPartialDeclaration(
        this.linkerEnvironment, this.sourceUrl, this.code, constantPool, metaObj);
  }
}

/**
 * Extract the `version` number from the `metaObj`.
 */
function getVersion<TExpression>(metaObj: AstObject<TExpression>): number {
  try {
    return metaObj.getNumber('version');
  } catch (e) {
    throw new FatalLinkerError(metaObj.expression, `Invalid declaration property: ${e.message}`);
  }
}
