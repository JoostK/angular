/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * @fileoverview The API from compiler-cli that the `@angular/localize`
 * package requires.
 */

export {absoluteFrom, AbsoluteFsPath, FileSystem, getFileSystem, NodeJSFileSystem, PathManipulation, PathSegment, ReadonlyFileSystem, relativeFrom, setFileSystem} from '@angular/compiler-cli/src/ngtsc/file_system';
export {ConsoleLogger, Logger, LogLevel} from '@angular/compiler-cli/src/ngtsc/logging';
export {SourceFile, SourceFileLoader} from '@angular/compiler-cli/src/ngtsc/sourcemaps';
