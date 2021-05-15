/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as ts from 'typescript';
import {ImportRewriter, NoopImportRewriter} from '../../imports';
import {ImportGenerator, NamedImport} from './api/import_generator';

/**
 * Information about an import that has been added to a module.
 */
export interface Import {
  /** The name of the module that has been imported. */
  specifier: string;
  /** The `ts.Identifer` by which the imported module is known. */
  qualifier: ts.Identifier;
}

export class ImportManager implements ImportGenerator<ts.Identifier> {
  private specifierToIdentifier = new Map<string, ts.Identifier>();
  private nextIndex = 0;

  constructor(protected rewriter: ImportRewriter = new NoopImportRewriter(), private prefix = 'i') {
  }

  generateNamespaceImport(moduleName: string): ts.Identifier {
    if (!this.specifierToIdentifier.has(moduleName)) {
      this.specifierToIdentifier.set(
          moduleName, ts.createIdentifier(`${this.prefix}${this.nextIndex++}`));
    }
    return this.specifierToIdentifier.get(moduleName)!;
  }

  generateNamedImport(moduleName: string, originalSymbol: string): NamedImport<ts.Identifier> {
    // First, rewrite the symbol name.
    const symbol = this.rewriter.rewriteSymbol(originalSymbol, moduleName);

    // Ask the rewriter if this symbol should be imported at all. If not, it can be referenced
    // directly (moduleImport: null).
    if (!this.rewriter.shouldImportSymbol(symbol, moduleName)) {
      // The symbol should be referenced directly.
      return {moduleImport: null, symbol: ts.factory.createIdentifier(symbol)};
    }

    // If not, this symbol will be imported using a generated namespace import.
    const moduleImport = this.generateNamespaceImport(moduleName);

    return {moduleImport, symbol: ts.factory.createIdentifier(symbol)};
  }

  getAllImports(contextPath: string): Import[] {
    const imports: Import[] = [];
    for (const [originalSpecifier, qualifier] of this.specifierToIdentifier) {
      const specifier = this.rewriter.rewriteSpecifier(originalSpecifier, contextPath);
      imports.push({
        specifier,
        qualifier,
      });
    }
    return imports;
  }
}

export class DirectImportManager implements ImportGenerator<ts.Identifier> {
  private imports = new Map<string, Map<string, ts.ImportSpecifier>>();

  constructor(
      protected rewriter: ImportRewriter, private sf: ts.SourceFile,
      private context: ts.TransformationContext) {}

  generateNamespaceImport(moduleName: string): ts.Identifier {
    throw new Error('Unable to generate namespace imports');
  }

  generateNamedImport(moduleName: string, originalSymbol: string): NamedImport<ts.Identifier> {
    // First, rewrite the symbol name.
    const symbol = this.rewriter.rewriteSymbol(originalSymbol, moduleName);

    // Ask the rewriter if this symbol should be imported at all. If not, it can be referenced
    // directly (moduleImport: null).
    if (!this.rewriter.shouldImportSymbol(symbol, moduleName)) {
      // The symbol should be referenced directly.
      return {moduleImport: null, symbol: this.context.factory.createIdentifier(symbol)};
    }

    if (!this.imports.has(moduleName)) {
      this.imports.set(moduleName, new Map<string, ts.ImportSpecifier>());
    }
    const specifiers = this.imports.get(moduleName)!;
    if (!specifiers.has(symbol)) {
      const factory = this.context.factory;

      const isUnique = (ts as unknown as {
                         isFileLevelUniqueName(sf: ts.SourceFile, name: string): boolean
                       }).isFileLevelUniqueName(this.sf, symbol);

      const specifier = isUnique ?
          factory.createImportSpecifier(undefined, factory.createIdentifier(symbol)) :
          factory.createImportSpecifier(
              factory.createIdentifier(symbol),
              factory.createUniqueName(
                  symbol,
                  ts.GeneratedIdentifierFlags.FileLevel | ts.GeneratedIdentifierFlags.Optimistic));
      specifiers.set(symbol, specifier);
    }
    const symbolName = specifiers.get(symbol)!;

    return {
      moduleImport: null,
      symbol: symbolName.name,
    };
  }

  getAllImports(): ts.ImportDeclaration[] {
    const result: ts.ImportDeclaration[] = [];
    const factory = this.context.factory;
    for (const [moduleName, specifiers] of this.imports) {
      const namedBindings = factory.createNamedImports(Array.from(specifiers.values()));
      const importClause = factory.createImportClause(false, undefined, namedBindings);
      result.push(factory.createImportDeclaration(
          undefined, undefined, importClause, factory.createStringLiteral(moduleName)));
    }
    return result;
  }
}
