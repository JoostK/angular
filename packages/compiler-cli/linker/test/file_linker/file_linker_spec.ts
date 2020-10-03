/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {ConstantPool} from '@angular/compiler';
import {LinkerEnvironment} from '@angular/compiler-cli/linker/src/file_linker/linker_environment';
import * as t from '@babel/types';

import {AstHost} from '../../src/ast/ast_host';
import {AstObject} from '../../src/ast/ast_value';
import {BabelAstFactory} from '../../src/ast/babel/babel_ast_factory';
import {BabelAstHost} from '../../src/ast/babel/babel_ast_host';
import {FileLinker} from '../../src/file_linker/file_linker';
import {DEFAULT_LINKER_OPTIONS} from '../../src/file_linker/linker_options';
import {PartialDirectiveLinkerVersion1} from '../../src/file_linker/partial_linkers/partial_directive_linker_1';

describe('FileLinker', () => {
  describe('linkPartialDeclaration()', () => {
    it('should throw an error if the function name is not recognised', () => {
      const {host, fileLinker} = createFileLinker();
      const version = t.numericLiteral(1);
      const declarationArg = t.objectExpression([
        t.objectProperty(t.identifier('version'), version),
      ]);
      expect(
          () => fileLinker.linkPartialDeclaration(
              'foo', AstObject.parse(declarationArg, host), new ConstantPool()))
          .toThrowError('Unknown partial declaration function foo.');
    });

    it('should throw an error if the metadata object does not have a `version` property', () => {
      const {host, fileLinker} = createFileLinker();
      const ngImport = t.identifier('@angular/core');
      const metaObj = t.objectExpression([t.objectProperty(t.identifier('ngImport'), ngImport)]);
      expect(
          () => fileLinker.linkPartialDeclaration(
              '$ngDeclareDirective', AstObject.parse(metaObj, host), new ConstantPool()))
          .toThrowError(`Invalid declaration property: Expected property 'version' to be present.`);
    });

    it('should call `linkPartialDeclaration()` on the appropriate partial compiler', () => {
      const {host, fileLinker} = createFileLinker();
      const compileSpy = spyOn(PartialDirectiveLinkerVersion1.prototype, 'linkPartialDeclaration')
                             .and.returnValue(t.stringLiteral('compilation result'));

      const ngImport = t.identifier('@angular/core');
      const version = t.numericLiteral(1);
      const declarationArg = t.objectExpression([
        t.objectProperty(t.identifier('ngImport'), ngImport),
        t.objectProperty(t.identifier('version'), version),
      ]);

      const compilationResult = fileLinker.linkPartialDeclaration(
          '$ngDeclareDirective', AstObject.parse(declarationArg, host), new ConstantPool());

      expect(compilationResult).toEqual(t.stringLiteral('compilation result'));
      expect(compileSpy).toHaveBeenCalled();
      expect(compileSpy.calls.mostRecent().args[4].getNode('ngImport')).toBe(ngImport);
    });
  });

  function createFileLinker():
      {host: AstHost<t.Expression>, fileLinker: FileLinker<t.Statement, t.Expression>} {
    const linkerEnvironment = new LinkerEnvironment<t.Statement, t.Expression>(
        new BabelAstHost(), new BabelAstFactory(), DEFAULT_LINKER_OPTIONS);
    const fileLinker =
        new FileLinker<t.Statement, t.Expression>(linkerEnvironment, 'test.js', '// test code');
    return {host: linkerEnvironment.host, fileLinker};
  }
});
