/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {PluginObj} from '@babel/core';
import {NodePath} from '@babel/traverse';
import * as t from '@babel/types';

import {AstHost} from '../../ast/ast_host';
import {AstObject} from '../../ast/ast_value';
import {BabelAstFactory} from '../../ast/babel/babel_ast_factory';
import {BabelAstHost} from '../../ast/babel/babel_ast_host';
import {FatalLinkerError, isFatalLinkerError} from '../../fatal_linker_error';
import {FileLinker} from '../file_linker';
import {LinkerEnvironment} from '../linker_environment';
import {DEFAULT_LINKER_OPTIONS, LinkerOptions} from '../linker_options';

import {ConstantPoolRegistry} from './constant_pool_registry';

/**
 * Create a Babel plugin that visits the program, identifying and linking partial declarations.
 *
 * The plugin delegates most of its work to a generic `FileLinker` for each file (`t.Program` in
 * Babel) that is visited.
 */
export function createEs2015LinkerPlugin(options: Partial<LinkerOptions>): PluginObj {
  let fileLinker: FileLinker<t.Statement, t.Expression>|null = null;
  let constantPoolRegistry: ConstantPoolRegistry|null = null;

  const linkerEnvironment = new LinkerEnvironment<t.Statement, t.Expression>(
      new BabelAstHost(), new BabelAstFactory(), {...DEFAULT_LINKER_OPTIONS, ...options});

  return {
    visitor: {
      Program: {
        /**
         * We create a new `FileLinker` as we enter each file (`t.Program` in Babel).
         */
        enter(path: NodePath<t.Program>): void {
          assertNull(constantPoolRegistry);
          assertNull(fileLinker);
          constantPoolRegistry = new ConstantPoolRegistry(linkerEnvironment.translator);
          fileLinker = new FileLinker<t.Statement, t.Expression>(
              linkerEnvironment, path.hub.file.opts.filename, path.hub.file.code);
        },
        /**
         * On exiting the file, we insert any top-level statements that were generated during
         * linking of the partial declarations.
         */
        exit(): void {
          assertNotNull(constantPoolRegistry);
          assertNotNull(fileLinker);
          constantPoolRegistry.insertStatements();
          constantPoolRegistry = null;
          fileLinker = null;
        }
      },
      /**
       * We attempt to process each call expression as a partial declaration, replacing it with the
       * results of linking the declaration, if successful.
       */
      CallExpression(call: NodePath<t.CallExpression>): void {
        try {
          assertNotNull(constantPoolRegistry);
          assertNotNull(fileLinker);

          const callee = call.get('callee');
          if (!callee.isIdentifier()) {
            return;
          }
          const calleeName = callee.node.name;
          const args = call.get('arguments');
          if (!fileLinker.isPartialDeclaration(calleeName) || !isExpressionArray(args)) {
            return;
          }

          if (args.length !== 1) {
            throw new FatalLinkerError(
                call.node,
                `Invalid function call: It should have only a single object literal argument, but contained ${
                    args.length}.`);
          }

          const ngImport = getNgImport(args[0]);
          const constantPool = constantPoolRegistry.getConstantPoolFor(ngImport);

          const metaObj = parseDeclarationObj(args[0], linkerEnvironment.host);
          const replacement = fileLinker.linkPartialDeclaration(calleeName, metaObj, constantPool);

          call.skip();  // TODO: check if skipping breaks stuff
          call.replaceWith(replacement);
        } catch (e) {
          const node = isFatalLinkerError(e) ? e.node as t.Node : call.node;
          throw buildCodeFrameError(call.hub.file, e.message, node);
        }
      }
    }
  };
}

/**
 * Returns true if all the `nodes` are Babel expressions.
 */
function isExpressionArray(nodes: NodePath<t.Node>[]): nodes is NodePath<t.Expression>[] {
  return nodes.every(node => node.isExpression());
}

/**
 * Extract the `ngImport` NodePath from the `metaData` NodePath.
 */
function getNgImport(metaData: NodePath<t.Node>): NodePath<t.Expression> {
  if (!metaData.isObjectExpression()) {
    throw new FatalLinkerError(
        metaData.node,
        'Invalid declaration argument: Expected argument to be an object expression.');
  }
  const ngImportProp = metaData.get('properties').find(isNgImportProperty);
  if (ngImportProp === undefined) {
    throw new FatalLinkerError(
        metaData.node,
        'Invalid declaration argument: Expected a simple expression property called \'ngImport\'.');
  }
  return ngImportProp.get('value');
}

function isNgImportProperty(prop: NodePath<t.ObjectMethod|t.ObjectProperty|t.SpreadElement>):
    prop is NodePath<t.ObjectProperty&{value: t.Expression}> {
  if (!prop.isObjectProperty()) {
    return false;
  }
  const key = prop.get('key') as NodePath<t.Node>;
  if (!key.isIdentifier() || key.node.name !== 'ngImport') {
    return false;
  }
  const value = prop.get('value');
  return value.isExpression();
}

/**
 * Parse an `AstObject` from the `declarationArg` AST expression, or throw a `FatalLinkerError` if
 * not possible
 */
function parseDeclarationObj(
    declarationArg: NodePath<t.Expression>, host: AstHost<t.Expression>): AstObject<t.Expression> {
  try {
    return AstObject.parse(declarationArg.node, host);
  } catch (e) {
    throw new FatalLinkerError(declarationArg, `Invalid argument: ` + e.message);
  }
}

/**
 * Assert that the given `obj` is `null`.
 */
function assertNull<T>(obj: T|null): asserts obj is null {
  if (obj !== null) {
    throw new Error('BUG - expected `obj` to be null');
  }
}

/**
 * Assert that the given `obj` is not `null`.
 */
function assertNotNull<T>(obj: T|null): asserts obj is T {
  if (obj === null) {
    throw new Error('BUG - expected `obj` not to be null');
  }
}

/**
 * Create a string representation of an error that includes the code frame of the given
 */
function buildCodeFrameError(file: BabelFile, message: string, node: t.Node): string {
  const filename = file.opts.filename || '(unknown file)';
  const error = file.buildCodeFrameError(node, message);
  return `${filename}: ${error.message}`;
}

interface BabelFile {
  opts: {filename?: string;};

  buildCodeFrameError(node: t.Node, message: string): Error;
}
