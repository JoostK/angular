/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as fs from 'fs';
import * as ts from 'typescript';

import MagicString from 'magic-string';
import {fromObject, generateMapFileComment} from 'convert-source-map';
import {makeProgram} from '../helpers/utils';
import {AnalyzedClass, DecorationAnalyzer} from '../../src/analysis/decoration_analyzer';
import {Fesm2015ReflectionHost} from '../../src/host/fesm2015_host';
import {Renderer} from '../../src/rendering/renderer';

class TestRenderer extends Renderer {
  addImports(output: MagicString, imports: {name: string, as: string}[]) {
    output.prepend('\n// ADD IMPORTS\n');
  }
  addConstants(output: MagicString, constants: string, file: ts.SourceFile): void {
    output.prepend('\n// ADD CONSTANTS\n');
  }
  addDefinitions(output: MagicString, analyzedClass: AnalyzedClass, definitions: string) {
    output.prepend('\n// ADD DEFINITIONS\n');
  }
  removeDecorators(output: MagicString, decoratorsToRemove: Map<ts.Node, ts.Node[]>) {
    output.prepend('\n// REMOVE DECORATORS\n');
  }
  rewriteSwitchableDeclarations(output: MagicString, sourceFile: ts.SourceFile): void {
    output.prepend('\n// REWRITTEN DECLARATIONS\n');
  }
}

function createTestRenderer(host: Fesm2015ReflectionHost) {
  const renderer = new TestRenderer(host);
  spyOn(renderer, 'addImports').and.callThrough();
  spyOn(renderer, 'addDefinitions').and.callThrough();
  spyOn(renderer, 'removeDecorators').and.callThrough();
  return renderer as jasmine.SpyObj<TestRenderer>;
}

function setup(file: {name: string, contents: string}) {
  const program = makeProgram(file);
  const host = new Fesm2015ReflectionHost('some-package', program.getTypeChecker());
  const analyzer = new DecorationAnalyzer(program.getTypeChecker(), host, ['']);

  const decoratedFiles = host.findDecoratedFiles(program.getSourceFile(file.name) !);
  const analyzedFiles = decoratedFiles.map(file => analyzer.analyzeFile(file));

  return {program, host, parser, analyzer, decoratedFiles, analyzedFiles};
}

describe('Renderer', () => {
  const INPUT_PROGRAM = {
    name: '/file.js',
    contents:
        `import { Directive } from '@angular/core';\nexport class A {\n    foo(x) {\n        return x;\n    }\n}\nA.decorators = [\n    { type: Directive, args: [{ selector: '[a]' }] }\n];\n`
  };
  const INPUT_PROGRAM_MAP = fromObject({
    'version': 3,
    'file': '/file.js',
    'sourceRoot': '',
    'sources': ['/file.ts'],
    'names': [],
    'mappings':
        'AAAA,OAAO,EAAE,SAAS,EAAE,MAAM,eAAe,CAAC;AAC1C,MAAM;IACF,GAAG,CAAC,CAAS;QACT,OAAO,CAAC,CAAC;IACb,CAAC;;AACM,YAAU,GAAG;IAChB,EAAE,IAAI,EAAE,SAAS,EAAE,IAAI,EAAE,CAAC,EAAE,QAAQ,EAAE,KAAK,EAAE,CAAC,EAAE;CACnD,CAAC',
    'sourcesContent': [
      'import { Directive } from \'@angular/core\';\nexport class A {\n    foo(x: string): string {\n        return x;\n    }\n    static decorators = [\n        { type: Directive, args: [{ selector: \'[a]\' }] }\n    ];\n}'
    ]
  });
  const RENDERED_CONTENTS =
      `\n// REWRITTEN DECLARATIONS\n\n// REMOVE DECORATORS\n\n// ADD IMPORTS\n\n// ADD CONSTANTS\n\n// ADD DEFINITIONS\n` +
      INPUT_PROGRAM.contents;
  const OUTPUT_PROGRAM_MAP = fromObject({
    'version': 3,
    'file': '/output_file.js',
    'sources': ['/file.js'],
    'sourcesContent': [
      'import { Directive } from \'@angular/core\';\nexport class A {\n    foo(x) {\n        return x;\n    }\n}\nA.decorators = [\n    { type: Directive, args: [{ selector: \'[a]\' }] }\n];\n'
    ],
    'names': [],
    'mappings': ';;;;;;;;;;AAAA;;;;;;;;;'
  });

  const MERGED_OUTPUT_PROGRAM_MAP = fromObject({
    'version': 3,
    'sources': ['/file.ts'],
    'names': [],
    'mappings': ';;;;;;;;;;AAAA',
    'file': '/output_file.js',
    'sourcesContent': [
      'import { Directive } from \'@angular/core\';\nexport class A {\n    foo(x: string): string {\n        return x;\n    }\n    static decorators = [\n        { type: Directive, args: [{ selector: \'[a]\' }] }\n    ];\n}'
    ]
  });

  describe('renderFile()', () => {
    it('should render the modified contents; and a new map file, if the original provided no map file.',
       () => {
         const {analyzedFiles, host} = setup(INPUT_PROGRAM);
         const renderer = createTestRenderer(host);
         const result = renderer.renderFile(analyzedFiles[0], '/output_file.js');
         expect(result.source.path).toEqual('/output_file.js');
         expect(result.source.contents)
             .toEqual(RENDERED_CONTENTS + '\n' + generateMapFileComment('/output_file.js.map'));
         expect(result.map !.path).toEqual('/output_file.js.map');
         expect(result.map !.contents).toEqual(OUTPUT_PROGRAM_MAP.toJSON());
       });

    it('should call addImports with the source code and info about the core Angular library.',
       () => {
         const {analyzedFiles, host} = setup(INPUT_PROGRAM);
         const renderer = createTestRenderer(host);
         renderer.renderFile(analyzedFiles[0], '/output_file.js');
         expect(renderer.addImports.calls.first().args[0].toString()).toEqual(RENDERED_CONTENTS);
         expect(renderer.addImports.calls.first().args[1]).toEqual([
           {name: '@angular/core', as: 'ɵngcc0'}
         ]);
       });

    it('should call addDefinitions with the source code, the analyzed class and the renderered definitions.',
       () => {
         const {analyzedFiles, host} = setup(INPUT_PROGRAM);
         const analyzedFile = analyzedFiles[0];
         const renderer = createTestRenderer(host);
         renderer.renderFile(analyzedFile, '/output_file.js');
         expect(renderer.addDefinitions.calls.first().args[0].toString())
             .toEqual(RENDERED_CONTENTS);
         expect(renderer.addDefinitions.calls.first().args[1])
             .toBe(analyzedFile.analyzedClasses[0]);
         expect(renderer.addDefinitions.calls.first().args[2])
             .toEqual(
                 `A.ngDirectiveDef = ɵngcc0.ɵdefineDirective({ type: A, selectors: [["", "a", ""]], factory: function A_Factory(t) { return new (t || A)(); }, features: [ɵngcc0.ɵPublicFeature] });`);
       });

    it('should call removeDecorators with the source code, a map of class decorators that have been analyzed',
       () => {
         const {analyzedFiles, host} = setup(INPUT_PROGRAM);
         const analyzedFile = analyzedFiles[0];
         const renderer = createTestRenderer(host);
         renderer.renderFile(analyzedFile, '/output_file.js');
         expect(renderer.removeDecorators.calls.first().args[0].toString())
             .toEqual(RENDERED_CONTENTS);

         // Each map key is the TS node of the decorator container
         // Each map value is an array of TS nodes that are the decorators to remove
         const map = renderer.removeDecorators.calls.first().args[1] as Map<ts.Node, ts.Node[]>;
         const keys = Array.from(map.keys());
         expect(keys.length).toEqual(1);
         expect(keys[0].getText())
             .toEqual(`[\n    { type: Directive, args: [{ selector: '[a]' }] }\n]`);
         const values = Array.from(map.values());
         expect(values.length).toEqual(1);
         expect(values[0].length).toEqual(1);
         expect(values[0][0].getText()).toEqual(`{ type: Directive, args: [{ selector: '[a]' }] }`);
       });

    it('should merge any inline source map from the original file and write the output as an inline source map',
       () => {
         const {analyzedFiles, host} = setup({
           ...INPUT_PROGRAM,
           contents: INPUT_PROGRAM.contents + '\n' + INPUT_PROGRAM_MAP.toComment()
         });
         const renderer = createTestRenderer(host);
         const result = renderer.renderFile(analyzedFiles[0], '/output_file.js');
         expect(result.source.path).toEqual('/output_file.js');
         expect(result.source.contents)
             .toEqual(RENDERED_CONTENTS + '\n' + MERGED_OUTPUT_PROGRAM_MAP.toComment());
         expect(result.map).toBe(null);
       });

    it('should merge any external source map from the original file and write the output to an external source map',
       () => {
         // Mock out reading the map file from disk
         spyOn(fs, 'readFileSync').and.returnValue(INPUT_PROGRAM_MAP.toJSON());
         const {analyzedFiles, host} = setup({
           ...INPUT_PROGRAM,
           contents: INPUT_PROGRAM.contents + '\n//# sourceMappingURL=file.js.map'
         });
         const renderer = createTestRenderer(host);
         const result = renderer.renderFile(analyzedFiles[0], '/output_file.js');
         expect(result.source.path).toEqual('/output_file.js');
         expect(result.source.contents)
             .toEqual(RENDERED_CONTENTS + '\n' + generateMapFileComment('/output_file.js.map'));
         expect(result.map !.path).toEqual('/output_file.js.map');
         expect(result.map !.contents).toEqual(MERGED_OUTPUT_PROGRAM_MAP.toJSON());
       });
  });
});
