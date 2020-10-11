/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as o from '@angular/compiler/src/output/output_ast';
import {transformSync} from '@babel/core';
import generate from '@babel/generator';
import * as t from '@babel/types';

import {createEs2015LinkerPlugin} from '../../../src/file_linker/babel/es2015_linker_plugin';
import {FileLinker} from '../../../src/file_linker/file_linker';
import {DEFAULT_LINKER_OPTIONS} from '../../../src/file_linker/linker_options';
import {PartialDirectiveLinkerVersion1} from '../../../src/file_linker/partial_linkers/partial_directive_linker_1';

describe('createEs2015LinkerPlugin()', () => {
  it('should return a Babel plugin visitor that handles Program (enter/exit) and CallExpression nodes',
     () => {
       const plugin = createEs2015LinkerPlugin(DEFAULT_LINKER_OPTIONS);
       expect(plugin.visitor).toEqual({
         Program: {
           enter: jasmine.any(Function),
           exit: jasmine.any(Function),
         },
         CallExpression: jasmine.any(Function),
       });
     });

  it('should return a Babel plugin that calls FileLinker.isPartialDeclaration() on each call expression',
     () => {
       const isPartialDeclarationSpy = spyOn(FileLinker.prototype, 'isPartialDeclaration');

       transformSync(
           [
             'var core;', `fn1()`, 'fn2({prop: () => fn3({})});', `x.method(() => fn4());`,
             'spread(...x);'
           ].join('\n'),
           {
             plugins: [createEs2015LinkerPlugin(DEFAULT_LINKER_OPTIONS)],
             filename: '/test.js',
             parserOpts: {sourceType: 'unambiguous'},
           });
       expect(isPartialDeclarationSpy.calls.allArgs()).toEqual([
         ['fn1'],
         ['fn2'],
         ['fn3'],
         ['method'],
         ['fn4'],
         ['spread'],
       ]);
     });

  it('should return a Babel plugin that calls FileLinker.linkPartialDeclaration() on each matching declaration',
     () => {
       const linkSpy = spyOn(FileLinker.prototype, 'linkPartialDeclaration')
                           .and.returnValue(t.identifier('REPLACEMENT'));

       transformSync(
           [
             'var core;',
             `$ngDeclareDirective({version: 1, ngImport: core, x: 1});`,
             `$ngDeclareComponent({version: 1, ngImport: core, foo: () => $ngDeclareDirective({version: 1, ngImport: core, x: 2})});`,
             `x.qux(() => $ngDeclareDirective({version: 1, ngImport: core, x: 3}));`,
             'spread(...x);',
           ].join('\n'),
           {
             plugins: [createEs2015LinkerPlugin(DEFAULT_LINKER_OPTIONS)],
             filename: '/test.js',
             parserOpts: {sourceType: 'unambiguous'},
           });

       expect(humanizeLinkerCalls(linkSpy.calls)).toEqual([
         ['$ngDeclareDirective', '{version:1,ngImport:core,x:1}'],
         [
           '$ngDeclareComponent',
           '{version:1,ngImport:core,foo:()=>$ngDeclareDirective({version:1,ngImport:core,x:2})}'
         ],
         // Note we do not process `x:2` declaration since it is nested within another declaration
         ['$ngDeclareDirective', '{version:1,ngImport:core,x:3}']
       ]);
     });

  it('should return a Babel plugin that replaces call expressions with the return value from FileLinker.linkPartialDeclaration()',
     () => {
       spyOn(FileLinker.prototype, 'linkPartialDeclaration')
           .and.returnValue(t.identifier('REPLACEMENT'));
       const result = transformSync(
           [
             'var core;',
             '$ngDeclareDirective({version: 1, ngImport: core});',
             '$ngDeclareDirective({version: 1, ngImport: core, foo: () => bar({})});',
             'x.qux();',
             'spread(...x);',
           ].join('\n'),
           {
             plugins: [createEs2015LinkerPlugin(DEFAULT_LINKER_OPTIONS)],
             filename: '/test.js',
             parserOpts: {sourceType: 'unambiguous'},
             generatorOpts: {compact: true},
           });
       expect(result!.code).toEqual('var core;REPLACEMENT;REPLACEMENT;x.qux();spread(...x);');
     });

  it('should return a Babel plugin that adds shared statements after any imports', () => {
    let callCount = 0;
    spyOn(PartialDirectiveLinkerVersion1.prototype, 'linkPartialDeclaration')
        .and.callFake(((sourceUrl, code, constantPool, metaObj) => {
                        callCount++;
                        // We have to add the constant twice or it will not create a shared
                        // statement
                        constantPool.getConstLiteral(o.literalArr([o.literal(callCount)]));
                        return constantPool.getConstLiteral(o.literalArr([o.literal(callCount)]));
                      }) as typeof PartialDirectiveLinkerVersion1.prototype.linkPartialDeclaration);
    const result = transformSync(
        [
          'import * as core from \'some-module\';',
          'import {id} from \'other-module\';',
          `$ngDeclareDirective({version: 1, ngImport: core})`,
          `$ngDeclareDirective({version: 1, ngImport: core})`,
          `$ngDeclareDirective({version: 1, ngImport: core})`,
        ].join('\n'),
        {
          plugins: [createEs2015LinkerPlugin(DEFAULT_LINKER_OPTIONS)],
          filename: '/test.js',
          parserOpts: {sourceType: 'unambiguous'},
          generatorOpts: {compact: true},
        });
    expect(result!.code)
        .toEqual(
            'import*as core from\'some-module\';import{id}from\'other-module\';const _c0=[1];const _c1=[2];const _c2=[3];_c0;_c1;_c2;');
  });

  it('should return a Babel plugin that adds shared statements at the start of the program if there are no imports',
     () => {
       let callCount = 0;
       spyOn(PartialDirectiveLinkerVersion1.prototype, 'linkPartialDeclaration')
           .and.callFake(
               ((sourceUrl, code, constantPool, metaObj) => {
                 callCount++;
                 // We have to add the constant twice or it will not create a shared statement
                 constantPool.getConstLiteral(o.literalArr([o.literal(callCount)]));
                 return constantPool.getConstLiteral(o.literalArr([o.literal(callCount)]));
               }) as typeof PartialDirectiveLinkerVersion1.prototype.linkPartialDeclaration);
       const result = transformSync(
           [
             'var core;',
             `$ngDeclareDirective({version: 1, ngImport: core})`,
             `$ngDeclareDirective({version: 1, ngImport: core})`,
             `$ngDeclareDirective({version: 1, ngImport: core})`,
           ].join('\n'),
           {
             plugins: [createEs2015LinkerPlugin(DEFAULT_LINKER_OPTIONS)],
             filename: '/test.js',
             parserOpts: {sourceType: 'unambiguous'},
             generatorOpts: {compact: true},
           });
       expect(result!.code)
           .toEqual('const _c0=[1];const _c1=[2];const _c2=[3];var core;_c0;_c1;_c2;');
     });

  it('should return a Babel plugin that adds shared statements at the start of the function body if the ngImport is from a function parameter',
     () => {
       let callCount = 0;
       spyOn(PartialDirectiveLinkerVersion1.prototype, 'linkPartialDeclaration')
           .and.callFake(
               ((sourceUrl, code, constantPool, metaObj) => {
                 callCount++;
                 // We have to add the constant twice or it will not create a shared statement
                 constantPool.getConstLiteral(o.literalArr([o.literal(callCount)]));
                 return constantPool.getConstLiteral(o.literalArr([o.literal(callCount)]));
               }) as typeof PartialDirectiveLinkerVersion1.prototype.linkPartialDeclaration);
       const result = transformSync(
           [
             'function run(core) {', `  $ngDeclareDirective({version: 1, ngImport: core})`,
             `  $ngDeclareDirective({version: 1, ngImport: core})`,
             `  $ngDeclareDirective({version: 1, ngImport: core})`, '}'
           ].join('\n'),
           {
             plugins: [createEs2015LinkerPlugin(DEFAULT_LINKER_OPTIONS)],
             filename: '/test.js',
             parserOpts: {sourceType: 'unambiguous'},
             generatorOpts: {compact: true},
           });
       expect(result!.code)
           .toEqual('function run(core){const _c0=[1];const _c1=[2];const _c2=[3];_c0;_c1;_c2;}');
     });

  it('should return a Babel plugin that adds shared statements into an IIFE if no scope could not be derived for the ngImport',
     () => {
       let callCount = 0;
       spyOn(PartialDirectiveLinkerVersion1.prototype, 'linkPartialDeclaration')
           .and.callFake(
               ((sourceUrl, code, constantPool, metaObj) => {
                 callCount++;
                 // We have to add the constant twice or it will not create a shared statement
                 constantPool.getConstLiteral(o.literalArr([o.literal(callCount)]));
                 return constantPool.getConstLiteral(o.literalArr([o.literal(callCount)]));
               }) as typeof PartialDirectiveLinkerVersion1.prototype.linkPartialDeclaration);
       const result = transformSync(
           [
             'function run() {', `  $ngDeclareDirective({version: 1, ngImport: core})`,
             `  $ngDeclareDirective({version: 1, ngImport: core})`,
             `  $ngDeclareDirective({version: 1, ngImport: core})`, '}'
           ].join('\n'),
           {
             plugins: [createEs2015LinkerPlugin(DEFAULT_LINKER_OPTIONS)],
             filename: '/test.js',
             parserOpts: {sourceType: 'unambiguous'},
             generatorOpts: {compact: true},
           });
       expect(result!.code).toEqual([
         `function run(){`, `(function(){const _c0=[1];return _c0;})();`,
         `(function(){const _c0=[2];return _c0;})();`, `(function(){const _c0=[3];return _c0;})();`,
         `}`
       ].join(''));
     });

  it('should work (delete this test, should be compliance test)', () => {
    const result = transformSync(
        `
           import * as ng from '@angular/core';

           class Dir {}
           Dir.ɵdir = ng.$ngDeclareDirective({
             version: 1,
             type: Dir,
             selector: 'my-dir',
             host: {
               attributes: {},
               listeners: {},
               properties: {},
             },
             inputs: {},
             outputs: {},
             queries: [],
             viewQueries: [],
             providers: [],
             usesInheritance: false,
             fullInheritance: false,
             usesOnChanges: false,
             ngImport: ng,
           });

           class Cmp {}
           Cmp.ɵcmp = ng.$ngDeclareComponent({
             version: 1,
             type: Cmp,
             selector: 'my-cmp',
             host: {
               attributes: {},
               listeners: {},
               properties: {},
             },
             inputs: {},
             outputs: {},
             queries: [],
             viewQueries: [],
             providers: [],
             usesInheritance: false,
             fullInheritance: false,
             usesOnChanges: false,
             template: '<span></span>',
             preserveWhitespaces: false,
             directives: [],
             pipes: {},
             styles: [],
             interpolation: ['{{', '}}'],
             ngImport: ng,
           });
           `,
        {
          plugins: [createEs2015LinkerPlugin()],
          filename: '/test.js',
          parserOpts: {sourceType: 'unambiguous'},
          generatorOpts: {compact: true},
        });
    expect(result!.code).toEqual([
      `import*as ng from'@angular/core';`,     //
      `class Dir{}`,                           //
      `Dir.ɵdir=ng.ɵɵdefineDirective({`,       //
      `type:Dir,`,                             //
      `selectors:[["my-dir"]],`,               //
      `features:[ng.ɵɵProvidersFeature([])]`,  //
      `});`,                                   //
      //
      `class Cmp{}`,                              //
      `Cmp.ɵcmp=ng.ɵɵdefineComponent({`,          //
      `type:Cmp,`,                                //
      `selectors:[["my-cmp"]],`,                  //
      `features:[ng.ɵɵProvidersFeature([])],`,    //
      `decls:1,`,                                 //
      `vars:0,`,                                  //
      `template:function Cmp_Template(rf,ctx){`,  //
      `if(rf&1){`,                                //
      `ng.ɵɵelement(0,"span");`,                  //
      `}},`,                                      //
      `encapsulation:2`,                          //
      `});`
    ].join(''))
  });
});

function humanizeLinkerCalls(
    calls: jasmine.Calls<typeof FileLinker.prototype.linkPartialDeclaration>) {
  return calls.all().map(({args: [fn, args]}) => [fn, generate(args[0], {compact: true}).code]);
}
