/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as o from '@angular/compiler';
import {ImportGenerator, NamedImport} from '@angular/compiler-cli/src/ngtsc/translator';
import generate from '@babel/generator';
import * as t from '@babel/types';
import {BabelAstFactory} from '../../src/ast/babel/babel_ast_factory';
import {Translator} from '../../src/file_linker/translator';

describe('Translator', () => {
  describe('translateExpression()', () => {
    it('should generate expression specific output', () => {
      const translator = new Translator<t.Statement, t.Expression>(new BabelAstFactory());
      const outputAst = new o.WriteVarExpr('foo', new o.LiteralExpr(42));
      const translated = translator.translateExpression(outputAst, new MockImportGenerator());
      expect(generate(translated).code).toEqual('(foo = 42)');
    });
  });

  describe('translateStatement()', () => {
    it('should generate statement specific output', () => {
      const translator = new Translator<t.Statement, t.Expression>(new BabelAstFactory());
      const outputAst = new o.ExpressionStatement(new o.WriteVarExpr('foo', new o.LiteralExpr(42)));
      const translated = translator.translateStatement(outputAst, new MockImportGenerator());
      expect(generate(translated).code).toEqual('foo = 42;');
    });
  });
});

class MockImportGenerator implements ImportGenerator<t.Expression> {
  generateNamespaceImport(moduleName: string): t.Expression {
    return t.stringLiteral(moduleName);
  }
  generateNamedImport(moduleName: string, originalSymbol: string): NamedImport<t.Expression> {
    return {
      moduleImport: t.stringLiteral(moduleName),
      symbol: originalSymbol,
    };
  }
}
