/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {readFileSync, writeFileSync} from 'fs';
import {dirname, join} from 'path';
import * as shx from 'shelljs';
import {Configuration, Linter} from 'tslint';

describe('Google3 async fakeAsync TSLint rule', () => {
  const rulesDirectory = dirname(require.resolve('../../migrations/google3/asyncFakeAsyncRule'));

  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(process.env['TEST_TMPDIR']!, 'google3-test');
    shx.mkdir('-p', tmpDir);

    // We need to declare the Angular symbols we're testing for, otherwise type checking won't work.
    writeFile('testing.d.ts', `
      export declare function fakeAsync(fn: Function): any;
      export declare function tick(n?: number): void;
      export declare function flushMicrotasks(): void;
    `);

    writeFile('tsconfig.json', JSON.stringify({
      compilerOptions: {
        module: 'es2015',
        baseUrl: './',
        paths: {
          '@angular/core/testing': ['testing.d.ts'],
        }
      },
    }));
  });

  afterEach(() => shx.rm('-r', tmpDir));

  function runTSLint(fix: boolean) {
    const program = Linter.createProgram(join(tmpDir, 'tsconfig.json'));
    const linter = new Linter({fix, rulesDirectory: [rulesDirectory]}, program);
    const config = Configuration.parseConfigFile({rules: {'async-fake-async': true}});

    program.getRootFileNames().forEach(fileName => {
      linter.lint(fileName, program.getSourceFile(fileName)!.getFullText(), config);
    });

    return linter;
  }

  function writeFile(fileName: string, content: string) {
    writeFileSync(join(tmpDir, fileName), content);
  }

  function getFile(fileName: string) {
    return readFileSync(join(tmpDir, fileName), 'utf8');
  }

  it('should work', () => {
    writeFile('/index.ts', `
      import { fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';

      it('should work', fakeAsync(/* comment */ () => {
        /* wait */tick();
        flushMicrotasks() && tick();
      }));

      it('should not add async keyword for functions that are already async', fakeAsync(async () => {
        tick();
      }));
    `);

    runTSLint(true);

    expect(getFile('/index.ts')).toEqual(`
      import { fakeAsync, tickClock, flushMicrotasksAsync } from '@angular/core/testing';

      it('should work', fakeAsync(/* comment */ async () => {
        /* wait */await tickClock();
        (await flushMicrotasksAsync()) && (await tickClock());
      }));

      it('should not add async keyword for functions that are already async', fakeAsync(async () => {
        await tickClock();
      }));
    `);
  });
});
