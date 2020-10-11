/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {WrappedNodeExpr} from '@angular/compiler';
import {parse} from '@babel/parser';
import * as t from '@babel/types';

import {AstObject, AstValue} from '../../src/ast/ast_value';
import {BabelAstHost} from '../../src/ast/babel/babel_ast_host';

const host = new BabelAstHost();
const nestedObj = t.objectExpression([
  t.objectProperty(t.identifier('x'), t.numericLiteral(42)),
  t.objectProperty(t.identifier('y'), t.stringLiteral('X')),
]);
const nestedArray = t.arrayExpression([t.numericLiteral(1), t.numericLiteral(2)]);
const obj = AstObject.parse(
    t.objectExpression([
      t.objectProperty(t.identifier('a'), t.numericLiteral(42)),
      t.objectProperty(t.identifier('b'), t.stringLiteral('X')),
      t.objectProperty(t.identifier('c'), t.booleanLiteral(true)),
      t.objectProperty(t.identifier('d'), nestedObj),
      t.objectProperty(t.identifier('e'), nestedArray),
    ]),
    host);

describe('AstObject', () => {
  describe('has()', () => {
    it('should return true if the property exists on the object', () => {
      expect(obj.has('a')).toBe(true);
      expect(obj.has('b')).toBe(true);
      expect(obj.has('z')).toBe(false);
    });
  });

  describe('getNumber()', () => {
    it('should return the number value of the property', () => {
      expect(obj.getNumber('a')).toEqual(42);
    });

    it('should throw an error if the property is not a number', () => {
      expect(() => obj.getNumber('b'))
          .toThrowError('Unsupported syntax, expected a numeric literal.');
    });
  });

  describe('getString()', () => {
    it('should return the string value of the property', () => {
      expect(obj.getString('b')).toEqual('X');
    });

    it('should throw an error if the property is not a string', () => {
      expect(() => obj.getString('a'))
          .toThrowError('Unsupported syntax, expected a string literal.');
    });
  });

  describe('getBoolean()', () => {
    it('should return the boolean value of the property', () => {
      expect(obj.getBoolean('c')).toEqual(true);
    });

    it('should throw an error if the property is not a boolean', () => {
      expect(() => obj.getBoolean('b'))
          .toThrowError('Unsupported syntax, expected a boolean literal.');
    });
  });

  describe('getObject()', () => {
    it('should return an AstObject instance parsed from the value of the property', () => {
      expect(obj.getObject('d')).toEqual(AstObject.parse(nestedObj, host));
    });

    it('should throw an error if the property is not an object expression', () => {
      expect(() => obj.getObject('b'))
          .toThrowError('Unsupported syntax, expected an object literal.');
    });
  });

  describe('getArray()', () => {
    it('should return an array of AstValue instances of parsed from the value of the property',
       () => {
         expect(obj.getArray('e')).toEqual([
           new AstValue(t.numericLiteral(1), host), new AstValue(t.numericLiteral(2), host)
         ]);
       });

    it('should throw an error if the property is not an array of expressions', () => {
      expect(() => obj.getArray('b'))
          .toThrowError('Unsupported syntax, expected an array literal.');
    });
  });

  describe('getOpaque()', () => {
    it('should return the expression value of the property wrapped in a `WrappedNodeExpr`', () => {
      expect(obj.getOpaque('d')).toEqual(jasmine.any(WrappedNodeExpr));
      expect(obj.getOpaque('d').node).toEqual(obj.getNode('d'));
    });

    it('should throw an error if the property does not exist', () => {
      expect(() => obj.getOpaque('x')).toThrowError('Expected property \'x\' to be present.');
    });
  });

  describe('getNode()', () => {
    it('should return the original expression value of the property', () => {
      expect(obj.getNode('a')).toEqual(t.numericLiteral(42));
    });

    it('should throw an error if the property does not exist', () => {
      expect(() => obj.getNode('x')).toThrowError('Expected property \'x\' to be present.');
    });
  });

  describe('getValue()', () => {
    it('should return the expression value of the property wrapped in an `AstValue`', () => {
      expect(obj.getValue('a')).toEqual(jasmine.any(AstValue));
      expect(obj.getValue('a').getNumber()).toEqual(42);
    });

    it('should throw an error if the property does not exist', () => {
      expect(() => obj.getValue('x')).toThrowError('Expected property \'x\' to be present.');
    });
  });

  describe('toLiteral()', () => {
    it('should convert the AstObject to a raw object with each property mapped', () => {
      expect(obj.toLiteral(value => value.getOpaque())).toEqual({
        a: obj.getOpaque('a'),
        b: obj.getOpaque('b'),
        c: obj.getOpaque('c'),
        d: obj.getOpaque('d'),
        e: obj.getOpaque('e'),
      });
    });
  });

  describe('toMap()', () => {
    it('should convert the AstObject to a Map with each property mapped', () => {
      expect(obj.toMap(value => value.getOpaque())).toEqual(new Map([
        ['a', obj.getOpaque('a')],
        ['b', obj.getOpaque('b')],
        ['c', obj.getOpaque('c')],
        ['d', obj.getOpaque('d')],
        ['e', obj.getOpaque('e')],
      ]));
    });
  });
});

describe('AstValue', () => {
  describe('getSymbolName', () => {
    it('should return the name of an identifier', () => {
      expect(new AstValue(t.identifier('Foo'), host).getSymbolName()).toEqual('Foo');
    });

    it('should return the name of an member expression', () => {
      expect(new AstValue(t.memberExpression(t.identifier('Foo'), t.identifier('Bar')), host).getSymbolName())
          .toEqual('Bar');
    });

    it('should return null if no symbol name is available', () => {
      expect(new AstValue(t.stringLiteral('a'), host).getSymbolName()).toBeNull();
    });
  });

  describe('isNumber', () => {
    it('should return true if the value is a number', () => {
      expect(new AstValue(t.numericLiteral(42), host).isNumber()).toEqual(true);
    });

    it('should return false if the value is not a number', () => {
      expect(new AstValue(t.stringLiteral('a'), host).isNumber()).toEqual(false);
    });
  });

  describe('getNumber', () => {
    it('should return the number value of the AstValue', () => {
      expect(new AstValue(t.numericLiteral(42), host).getNumber()).toEqual(42);
    });

    it('should throw an error if the property is not a number', () => {
      expect(() => new AstValue(t.stringLiteral('a'), host).getNumber())
          .toThrowError('Unsupported syntax, expected a numeric literal.');
    });
  });

  describe('isString', () => {
    it('should return true if the value is a string', () => {
      expect(new AstValue(t.stringLiteral('a'), host).isString()).toEqual(true);
    });

    it('should return false if the value is not a string', () => {
      expect(new AstValue(t.numericLiteral(42), host).isString()).toEqual(false);
    });
  });

  describe('getString', () => {
    it('should return the string value of the AstValue', () => {
      expect(new AstValue(t.stringLiteral('X'), host).getString()).toEqual('X');
    });

    it('should throw an error if the property is not a string', () => {
      expect(() => new AstValue(t.numericLiteral(42), host).getString())
          .toThrowError('Unsupported syntax, expected a string literal.');
    });
  });

  describe('isBoolean', () => {
    it('should return true if the value is a boolean', () => {
      expect(new AstValue(t.booleanLiteral(true), host).isBoolean()).toEqual(true);
    });

    it('should return false if the value is not a boolean', () => {
      expect(new AstValue(t.numericLiteral(42), host).isBoolean()).toEqual(false);
    });
  });

  describe('getBoolean', () => {
    it('should return the boolean value of the AstValue', () => {
      expect(new AstValue(t.booleanLiteral(true), host).getBoolean()).toEqual(true);
    });

    it('should throw an error if the property is not a boolean', () => {
      expect(() => new AstValue(t.numericLiteral(42), host).getBoolean())
          .toThrowError('Unsupported syntax, expected a boolean literal.');
    });
  });

  describe('isObject', () => {
    it('should return true if the value is an object literal', () => {
      expect(new AstValue(nestedObj, host).isObject()).toEqual(true);
    });

    it('should return false if the value is not an object literal', () => {
      expect(new AstValue(t.numericLiteral(42), host).isObject()).toEqual(false);
    });
  });

  describe('getObject', () => {
    it('should return the AstObject value of the AstValue', () => {
      expect(new AstValue(nestedObj, host).getObject()).toEqual(AstObject.parse(nestedObj, host));
    });

    it('should throw an error if the property is not an object literal', () => {
      expect(() => new AstValue(t.numericLiteral(42), host).getObject())
          .toThrowError('Unsupported syntax, expected an object literal.');
    });
  });

  describe('isArray', () => {
    it('should return true if the value is an array literal', () => {
      expect(new AstValue(nestedArray, host).isArray()).toEqual(true);
    });

    it('should return false if the value is not an object literal', () => {
      expect(new AstValue(t.numericLiteral(42), host).isArray()).toEqual(false);
    });
  });

  describe('getArray', () => {
    it('should return an array of AstValue objects from the AstValue', () => {
      expect(new AstValue(nestedArray, host).getArray()).toEqual([
        new AstValue(t.numericLiteral(1), host),
        new AstValue(t.numericLiteral(2), host),
      ]);
    });

    it('should throw an error if the property is not an array', () => {
      expect(() => new AstValue(t.numericLiteral(42), host).getArray())
          .toThrowError('Unsupported syntax, expected an array literal.');
    });
  });

  describe('isFunction', () => {
    it('should return true if the value is a function expression', () => {
      const funcExpr = t.functionExpression(
          t.identifier('foo'), [], t.blockStatement([t.returnStatement(t.numericLiteral(42))]));
      expect(new AstValue(funcExpr, host).isFunction()).toEqual(true);
    });

    it('should return false if the value is not a function expression', () => {
      expect(new AstValue(t.numericLiteral(42), host).isFunction()).toEqual(false);
    });
  });

  describe('getFunctionReturnValue', () => {
    it('should return the "return value" of the function expression', () => {
      const funcExpr = t.functionExpression(
          t.identifier('foo'), [], t.blockStatement([t.returnStatement(t.numericLiteral(42))]));
      expect(new AstValue(funcExpr, host).getFunctionReturnValue())
          .toEqual(new AstValue(t.numericLiteral(42), host));
    });

    it('should throw an error if the property is not a function expression', () => {
      expect(() => new AstValue(t.numericLiteral(42), host).getFunctionReturnValue())
          .toThrowError('Unsupported syntax, expected a function.');
    });

    it('should throw an error if the property is a function expression with no return value',
       () => {
         const funcExpr = t.functionExpression(t.identifier('foo'), [], t.blockStatement([]));
         expect(() => new AstValue(funcExpr, host).getFunctionReturnValue())
             .toThrowError(
                 'Unsupported syntax, expected a function body with a single return statement.');
       });
  });

  describe('getOpaque()', () => {
    it('should return the value wrapped in a `WrappedNodeExpr`', () => {
      expect(new AstValue(t.numericLiteral(42), host).getOpaque())
          .toEqual(jasmine.any(WrappedNodeExpr));
      expect(new AstValue(t.numericLiteral(42), host).getOpaque().node)
          .toEqual(t.numericLiteral(42));
    });
  });

  describe('getRange()', () => {
    it('should return the source range of the AST node', () => {
      const file = parse('// preamble\nx = \'moo\';');
      const stmt = file.program.body[0] as t.ExpressionStatement;
      const expr = (stmt.expression as t.AssignmentExpression).right;
      expect(new AstValue(expr, host).getRange())
          .toEqual({startLine: 1, startCol: 4, startPos: 16, endPos: 21});
    });
  });
});
