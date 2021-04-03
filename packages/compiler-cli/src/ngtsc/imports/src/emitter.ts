/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {Expression, ExternalExpr, ExternalReference, WrappedNodeExpr} from '@angular/compiler';
import * as ts from 'typescript';

import {UnifiedModulesHost} from '../../core/api';
import {absoluteFromSourceFile, dirname, LogicalFileSystem, LogicalProjectPath, relative, toRelativeImport} from '../../file_system';
import {stripExtension} from '../../file_system/src/util';
import {DeclarationNode, ReflectionHost} from '../../reflection';
import {getSourceFile, isDeclaration, isTypeDeclaration, nodeNameForError} from '../../util/src/typescript';
import {shouldExcludeExport} from './exclude';

import {findExportedNameOfNode} from './find_export';
import {Reference} from './references';
import {ModuleResolver} from './resolver';


/**
 * Flags which alter the imports generated by the `ReferenceEmitter`.
 */
export enum ImportFlags {
  None = 0x00,

  /**
   * Force the generation of a new import when generating a reference, even if an identifier already
   * exists in the target file which could be used instead.
   *
   * This is sometimes required if there's a risk TypeScript might remove imports during emit.
   */
  ForceNewImport = 0x01,

  /**
   * Don't make use of any aliasing information when emitting a reference.
   *
   * This is sometimes required if emitting into a context where generated references will be fed
   * into TypeScript and type-checked (such as in template type-checking).
   */
  NoAliasing = 0x02,

  /**
   * Indicates that an import to a type-only declaration is allowed.
   *
   * For references that occur in type-positions, the referred declaration may be a type-only
   * declaration that is not retained during emit. Including this flag allows to emit references to
   * type-only declarations as used in e.g. template type-checking.
   */
  AllowTypeImports = 0x04,
}

/**
 * An emitter strategy has the ability to indicate which `ts.SourceFile` is being imported by the
 * expression that it has generated. This information is useful for consumers of the emitted
 * reference that would otherwise have to perform a relatively expensive module resolution step,
 * e.g. for cyclic import analysis. In cases the emitter is unable to definitively determine the
 * imported source file or a computation would be required to actually determine the imported
 * source file, then `'unknown'` should be returned. If the generated expression does not represent
 * an import then `null` should be used.
 */
export type ImportedFile = ts.SourceFile|'unknown'|null;

/**
 * Represents the emitted expression of a `Reference` that is valid in the source file it was
 * emitted from.
 */
export interface EmittedReference {
  /**
   * The expression that refers to `Reference`.
   */
  expression: Expression;

  /**
   * The `ts.SourceFile` that is imported by `expression`. This is not necessarily the source file
   * of the `Reference`'s declaration node, as the reference may have been rewritten through an
   * alias export. It could also be `null` if `expression` is a local identifier, or `'unknown'` if
   * the exact source file that is being imported is not known to the emitter.
   */
  importedFile: ImportedFile;
}

/**
 * A particular strategy for generating an expression which refers to a `Reference`.
 *
 * There are many potential ways a given `Reference` could be referred to in the context of a given
 * file. A local declaration could be available, the `Reference` could be importable via a relative
 * import within the project, or an absolute import into `node_modules` might be necessary.
 *
 * Different `ReferenceEmitStrategy` implementations implement specific logic for generating such
 * references. A single strategy (such as using a local declaration) may not always be able to
 * generate an expression for every `Reference` (for example, if no local identifier is available),
 * and may return `null` in such a case.
 */
export interface ReferenceEmitStrategy {
  /**
   * Emit an `Expression` which refers to the given `Reference` in the context of a particular
   * source file, if possible.
   *
   * @param ref the `Reference` for which to generate an expression
   * @param context the source file in which the `Expression` must be valid
   * @param importFlags a flag which controls whether imports should be generated or not
   * @returns an `EmittedReference` which refers to the `Reference`, or `null` if none can be
   *   generated
   */
  emit(ref: Reference, context: ts.SourceFile, importFlags: ImportFlags): EmittedReference|null;
}

/**
 * Generates `Expression`s which refer to `Reference`s in a given context.
 *
 * A `ReferenceEmitter` uses one or more `ReferenceEmitStrategy` implementations to produce an
 * `Expression` which refers to a `Reference` in the context of a particular file.
 */
export class ReferenceEmitter {
  constructor(private strategies: ReferenceEmitStrategy[]) {}

  emit(ref: Reference, context: ts.SourceFile, importFlags: ImportFlags = ImportFlags.None):
      EmittedReference {
    for (const strategy of this.strategies) {
      const emitted = strategy.emit(ref, context, importFlags);
      if (emitted !== null) {
        return emitted;
      }
    }
    throw new Error(`Unable to write a reference to ${nodeNameForError(ref.node)} in ${
        ref.node.getSourceFile().fileName} from ${context.fileName}`);
  }
}

/**
 * A `ReferenceEmitStrategy` which will refer to declarations by any local `ts.Identifier`s, if
 * such identifiers are available.
 */
export class LocalIdentifierStrategy implements ReferenceEmitStrategy {
  emit(ref: Reference, context: ts.SourceFile, importFlags: ImportFlags): EmittedReference|null {
    const refSf = getSourceFile(ref.node);

    // If the emitter has specified ForceNewImport, then LocalIdentifierStrategy should not use a
    // local identifier at all, *except* in the source file where the node is actually declared.
    if (importFlags & ImportFlags.ForceNewImport && refSf !== context) {
      return null;
    }

    // If referenced node is not an actual TS declaration (e.g. `class Foo` or `function foo() {}`,
    // etc) and it is in the current file then just use it directly.
    // This is important because the reference could be a property access (e.g. `exports.foo`). In
    // such a case, the reference's `identities` property would be `[foo]`, which would result in an
    // invalid emission of a free-standing `foo` identifier, rather than `exports.foo`.
    if (!isDeclaration(ref.node) && refSf === context) {
      return {
        expression: new WrappedNodeExpr(ref.node),
        importedFile: null,
      };
    }

    // A Reference can have multiple identities in different files, so it may already have an
    // Identifier in the requested context file.
    const identifier = ref.getIdentityIn(context);
    if (identifier !== null) {
      return {
        expression: new WrappedNodeExpr(identifier),
        importedFile: null,
      };
    } else {
      return null;
    }
  }
}

/**
 * Represents the exported declarations from a module source file.
 */
interface ModuleExports {
  /**
   * The source file of the module.
   */
  module: ts.SourceFile;

  /**
   * The map of declarations to their exported name.
   */
  exportMap: Map<DeclarationNode, string>;
}

/**
 * A `ReferenceEmitStrategy` which will refer to declarations that come from `node_modules` using
 * an absolute import.
 *
 * Part of this strategy involves looking at the target entry point and identifying the exported
 * name of the targeted declaration, as it might be different from the declared name (e.g. a
 * directive might be declared as FooDirImpl, but exported as FooDir). If no export can be found
 * which maps back to the original directive, an error is thrown.
 */
export class AbsoluteModuleStrategy implements ReferenceEmitStrategy {
  /**
   * A cache of the exports of specific modules, because resolving a module to its exports is a
   * costly operation.
   */
  private moduleExportsCache = new Map<string, ModuleExports|null>();

  constructor(
      protected program: ts.Program, protected checker: ts.TypeChecker,
      protected moduleResolver: ModuleResolver, private reflectionHost: ReflectionHost) {}

  emit(ref: Reference, context: ts.SourceFile, importFlags: ImportFlags): EmittedReference|null {
    if (ref.bestGuessOwningModule === null) {
      // There is no module name available for this Reference, meaning it was arrived at via a
      // relative path.
      return null;
    } else if (!isDeclaration(ref.node)) {
      // It's not possible to import something which isn't a declaration.
      throw new Error(`Debug assert: unable to import a Reference to non-declaration of type ${
          ts.SyntaxKind[ref.node.kind]}.`);
    } else if ((importFlags & ImportFlags.AllowTypeImports) === 0 && isTypeDeclaration(ref.node)) {
      throw new Error(`Importing a type-only declaration of type ${
          ts.SyntaxKind[ref.node.kind]} in a value position is not allowed.`);
    }

    // Try to find the exported name of the declaration, if one is available.
    const {specifier, resolutionContext} = ref.bestGuessOwningModule;
    const exports = this.getExportsOfModule(specifier, resolutionContext);
    if (exports === null || !exports.exportMap.has(ref.node)) {
      // TODO(alxhub): make this error a ts.Diagnostic pointing at whatever caused this import to be
      // triggered.
      throw new Error(`Symbol ${ref.debugName} declared in ${
          getSourceFile(ref.node).fileName} is not exported from ${specifier} (import into ${
          context.fileName})`);
    }
    const symbolName = exports.exportMap.get(ref.node)!;

    return {
      expression: new ExternalExpr(new ExternalReference(specifier, symbolName)),
      importedFile: exports.module,
    };
  }

  private getExportsOfModule(moduleName: string, fromFile: string): ModuleExports|null {
    if (!this.moduleExportsCache.has(moduleName)) {
      this.moduleExportsCache.set(moduleName, this.enumerateExportsOfModule(moduleName, fromFile));
    }
    return this.moduleExportsCache.get(moduleName)!;
  }

  protected enumerateExportsOfModule(specifier: string, fromFile: string): ModuleExports|null {
    // First, resolve the module specifier to its entry point, and get the ts.Symbol for it.
    const entryPointFile = this.moduleResolver.resolveModule(specifier, fromFile);
    if (entryPointFile === null) {
      return null;
    }

    const exports = this.reflectionHost.getExportsOfModule(entryPointFile);
    if (exports === null) {
      return null;
    }
    const exportMap = new Map<DeclarationNode, string>();
    exports.forEach((declaration, name) => {
      if (!shouldExcludeExport(name)) {
        exportMap.set(declaration.node, name);
      }
    });
    return {module: entryPointFile, exportMap};
  }
}

/**
 * A `ReferenceEmitStrategy` which will refer to declarations via relative paths, provided they're
 * both in the logical project "space" of paths.
 *
 * This is trickier than it sounds, as the two files may be in different root directories in the
 * project. Simply calculating a file system relative path between the two is not sufficient.
 * Instead, `LogicalProjectPath`s are used.
 */
export class LogicalProjectStrategy implements ReferenceEmitStrategy {
  constructor(private reflector: ReflectionHost, private logicalFs: LogicalFileSystem) {}

  emit(ref: Reference, context: ts.SourceFile): EmittedReference|null {
    const destSf = getSourceFile(ref.node);

    // Compute the relative path from the importing file to the file being imported. This is done
    // as a logical path computation, because the two files might be in different rootDirs.
    const destPath = this.logicalFs.logicalPathOfSf(destSf);
    if (destPath === null) {
      // The imported file is not within the logical project filesystem.
      return null;
    }

    const originPath = this.logicalFs.logicalPathOfSf(context);
    if (originPath === null) {
      throw new Error(
          `Debug assert: attempt to import from ${context.fileName} but it's outside the program?`);
    }

    // There's no way to emit a relative reference from a file to itself.
    if (destPath === originPath) {
      return null;
    }

    const name = findExportedNameOfNode(ref.node, destSf, this.reflector);
    if (name === null) {
      // The target declaration isn't exported from the file it's declared in. This is an issue!
      return null;
    }

    // With both files expressed as LogicalProjectPaths, getting the module specifier as a relative
    // path is now straightforward.
    const moduleName = LogicalProjectPath.relativePathBetween(originPath, destPath);
    return {
      expression: new ExternalExpr({moduleName, name}),
      importedFile: destSf,
    };
  }
}

/**
 * A `ReferenceEmitStrategy` which constructs relatives paths between `ts.SourceFile`s.
 *
 * This strategy can be used if there is no `rootDir`/`rootDirs` structure for the project which
 * necessitates the stronger logic of `LogicalProjectStrategy`.
 */
export class RelativePathStrategy implements ReferenceEmitStrategy {
  constructor(private reflector: ReflectionHost) {}

  emit(ref: Reference, context: ts.SourceFile): EmittedReference|null {
    const destSf = getSourceFile(ref.node);
    const relativePath =
        relative(dirname(absoluteFromSourceFile(context)), absoluteFromSourceFile(destSf));
    const moduleName = toRelativeImport(stripExtension(relativePath));

    const name = findExportedNameOfNode(ref.node, destSf, this.reflector);
    return {expression: new ExternalExpr({moduleName, name}), importedFile: destSf};
  }
}

/**
 * A `ReferenceEmitStrategy` which uses a `UnifiedModulesHost` to generate absolute import
 * references.
 */
export class UnifiedModulesStrategy implements ReferenceEmitStrategy {
  constructor(private reflector: ReflectionHost, private unifiedModulesHost: UnifiedModulesHost) {}

  emit(ref: Reference, context: ts.SourceFile): EmittedReference|null {
    const destSf = getSourceFile(ref.node);
    const name = findExportedNameOfNode(ref.node, destSf, this.reflector);
    if (name === null) {
      return null;
    }

    const moduleName =
        this.unifiedModulesHost.fileNameToModuleName(destSf.fileName, context.fileName);

    return {
      expression: new ExternalExpr({moduleName, name}),
      importedFile: destSf,
    };
  }
}
