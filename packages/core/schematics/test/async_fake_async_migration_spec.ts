/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {getSystemPath, normalize, virtualFs} from '@angular-devkit/core';
import {TempScopedNodeJsSyncHost} from '@angular-devkit/core/node/testing';
import {HostTree} from '@angular-devkit/schematics';
import {SchematicTestRunner, UnitTestTree} from '@angular-devkit/schematics/testing';
import * as shx from 'shelljs';

describe('async fakeAsync migration', () => {
  let runner: SchematicTestRunner;
  let host: TempScopedNodeJsSyncHost;
  let tree: UnitTestTree;
  let tmpDirPath: string;
  let previousWorkingDir: string;

  beforeEach(() => {
    runner = new SchematicTestRunner('test', require.resolve('../migrations.json'));
    host = new TempScopedNodeJsSyncHost();
    tree = new UnitTestTree(new HostTree(host));

    writeFile('/tsconfig.json', JSON.stringify({
      compilerOptions: {
        lib: ['es2015'],
        strictNullChecks: true,
      },
    }));
    writeFile('/angular.json', JSON.stringify({
      version: 1,
      projects: {t: {architect: {build: {options: {tsConfig: './tsconfig.json'}}}}}
    }));
    // We need to declare the Angular symbols we're testing for, otherwise type checking won't work.
    writeFile('/node_modules/@angular/core/testing/index.d.ts', `
      export declare function fakeAsync(fn: Function): any;
      export declare function tick(n?: number): void;
      export declare function flushMicrotasks(): void;
    `);

    previousWorkingDir = shx.pwd();
    tmpDirPath = getSystemPath(host.root);

    // Switch into the temporary directory path. This allows us to run
    // the schematic against our custom unit test tree.
    shx.cd(tmpDirPath);
  });

  afterEach(() => {
    shx.cd(previousWorkingDir);
    shx.rm('-r', tmpDirPath);
  });

  it('should migrate', async () => {
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

    await runMigration();
    expect(tree.readContent('/index.ts')).toEqual(`
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

  function writeFile(filePath: string, contents: string) {
    host.sync.write(normalize(filePath), virtualFs.stringToFileBuffer(contents));
  }

  function runMigration() {
    return runner.runSchematicAsync('migration-v13-async-fake-async', {}, tree).toPromise();
  }
});
