/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {compileDirectiveFromMetadata, ConstantPool, makeBindingParser, ParseLocation, ParseSourceFile, ParseSourceSpan, R3DirectiveMetadata, R3QueryMetadata, R3Reference} from '@angular/compiler';
import * as o from '@angular/compiler/src/output/output_ast';
import {Range} from '../../ast/ast_host';
import {AstObject} from '../../ast/ast_value';
import {PartialLinker} from './partial_linker';

/**
 * A `PartialLinker` that is designed to process `$ngDeclareDirective()` call expressions.
 */
export class PartialDirectiveLinkerVersion1<TExpression> implements PartialLinker<TExpression> {
  linkPartialDeclaration(
      sourceUrl: string, code: string, constantPool: ConstantPool,
      metaObj: AstObject<TExpression>): o.Expression {
    const meta = toR3DirectiveMeta(metaObj, code, sourceUrl);
    const def = compileDirectiveFromMetadata(meta, constantPool, makeBindingParser());
    return def.expression;
  }
}

export function toR3DirectiveMeta<TExpression>(
    metaObj: AstObject<TExpression>, code: string, sourceUrl: string): R3DirectiveMetadata {
  const typeName = metaObj.getValue('type').getSymbolName() ?? 'anonymous';
  const range = metaObj.getValue('type').getRange();

  const host = metaObj.getObject('host');

  return {
    typeSourceSpan: createSourceSpan(range, code, sourceUrl),
    type: wrapReference(metaObj.getOpaque('type')),
    typeArgumentCount: 0,
    internalType: metaObj.getOpaque('type'),
    deps: null,
    host: {
      attributes: host.getObject('attributes').toLiteral(value => value.getOpaque()),
      listeners: host.getObject('listeners').toLiteral(value => value.getString()),
      properties: host.getObject('properties').toLiteral(value => value.getString()),
      specialAttributes: {/* TODO */},
    },
    inputs: metaObj.getObject('inputs').toLiteral(value => {
      if (value.isString()) {
        return value.getString();
      } else {
        return value.getArray().map(innerValue => innerValue.getString()) as [string, string];
      }
    }),
    outputs: metaObj.getObject('outputs').toLiteral(value => value.getString()),
    queries: metaObj.getArray('queries').map(entry => toQueryMetadata(entry.getObject())),
    viewQueries: metaObj.getArray('viewQueries').map(entry => toQueryMetadata(entry.getObject())),
    providers: metaObj.has('providers') ? metaObj.getOpaque('providers') : null,
    fullInheritance: metaObj.getBoolean('fullInheritance'),
    selector: metaObj.getString('selector'),
    exportAs: metaObj.has('exportAs') ?
        metaObj.getArray('exportAs').map(entry => entry.getString()) :
        null,
    lifecycle: {usesOnChanges: metaObj.getBoolean('usesOnChanges')},
    name: typeName,
    usesInheritance: metaObj.getBoolean('usesInheritance'),
  };
}

function toQueryMetadata<TExpression>(obj: AstObject<TExpression>): R3QueryMetadata {
  let predicate: R3QueryMetadata['predicate'];
  const predicateExpr = obj.getValue('predicate');
  if (predicateExpr.isArray()) {
    predicate = predicateExpr.getArray().map(entry => entry.getString());
  } else {
    predicate = predicateExpr.getOpaque();
  }
  return {
    propertyName: obj.getString('propertyName'),
    first: obj.getBoolean('first'),
    predicate,
    descendants: obj.getBoolean('descendants'),
    read: obj.has('read') ? obj.getOpaque('read') : null,
    static: obj.getBoolean('static'),
  };
}

function wrapReference<TExpression>(wrapped: o.WrappedNodeExpr<TExpression>): R3Reference {
  return {value: wrapped, type: wrapped};
}

export function createSourceSpan(range: Range, code: string, sourceUrl: string): ParseSourceSpan {
  const sourceFile = new ParseSourceFile(code, sourceUrl);
  const startLocation =
      new ParseLocation(sourceFile, range.startPos, range.startLine, range.startCol);
  return new ParseSourceSpan(startLocation, startLocation.moveBy(range.endPos - range.startPos));
}
