/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ModuleWithProviders, NgModule, NgModuleDef, NgModuleTransitiveScopes} from '../../metadata/ng_module';
import {Type} from '../../type';
import {assertDefined} from '../assert';
import {getComponentDef, getDirectiveDef, getNgModuleDef, getPipeDef} from '../definition';
import {NG_COMPONENT_DEF, NG_DIRECTIVE_DEF, NG_INJECTOR_DEF, NG_MODULE_DEF, NG_PIPE_DEF} from '../fields';
import {ComponentDef} from '../interfaces/definition';

import {R3InjectorMetadataFacade, getCompilerFacade} from './compiler_facade';
import {angularCoreEnv} from './environment';
import {reflectDependencies} from './util';

const EMPTY_ARRAY: Type<any>[] = [];

/**
 * Compiles a module in JIT mode.
 *
 * This function automatically gets called when a class has a `@NgModule` decorator.
 */
export function compileNgModule(moduleType: Type<any>, ngModule: NgModule = {}): void {
  compileNgModuleDef(moduleType, ngModule);
  compileNgInjectorDef(moduleType, ngModule);
}

/**
 * Compiles and adds the `ngModuleDef` property to the module class.
 */
function compileNgModuleDef(moduleType: Type<any>, ngModule: NgModule): void {
  ngDevMode && assertDefined(moduleType, 'Required value moduleType');
  ngDevMode && assertDefined(ngModule, 'Required value ngModule');

  // if NG_MODULE_DEF is already defined on this class then don't overwrite it
  if (moduleType.hasOwnProperty(NG_MODULE_DEF)) return;

  const declarations: Type<any>[] = flatten(ngModule.declarations || EMPTY_ARRAY);

  let ngModuleDef: any = null;
  Object.defineProperty(moduleType, NG_MODULE_DEF, {
    configurable: true,
    get: () => {
      if (ngModuleDef === null) {
        ngModuleDef = getCompilerFacade().compileNgModule(
            angularCoreEnv, `ng://${moduleType.name}/ngModuleDef.js`, {
              type: moduleType,
              bootstrap: flatten(ngModule.bootstrap || EMPTY_ARRAY),
              declarations: declarations,
              imports: flatten(ngModule.imports || EMPTY_ARRAY).map(expandModuleWithProviders),
              exports: flatten(ngModule.exports || EMPTY_ARRAY).map(expandModuleWithProviders),
              emitInline: true,
            });
        setScopeOnDeclaredComponents(moduleType);
      }
      return ngModuleDef;
    },
  });
}

/**
 * Compiles and adds the `ngInjectorDef` property to the module class.
 */
function compileNgInjectorDef(moduleType: Type<any>, ngModule: NgModule): void {
  // if NG_INJECTOR_DEF is already defined on this class then don't overwrite it
  if (moduleType.hasOwnProperty(NG_INJECTOR_DEF)) return;

  let ngInjectorDef: any = null;
  Object.defineProperty(moduleType, NG_INJECTOR_DEF, {
    get: () => {
      if (ngInjectorDef === null) {
        const meta: R3InjectorMetadataFacade = {
          name: moduleType.name,
          type: moduleType,
          deps: reflectDependencies(moduleType),
          providers: ngModule.providers || EMPTY_ARRAY,
          imports: [
            ngModule.imports || EMPTY_ARRAY,
            ngModule.exports || EMPTY_ARRAY,
          ],
        };
        ngInjectorDef = getCompilerFacade().compileInjector(
            angularCoreEnv, `ng://${moduleType.name}/ngInjectorDef.js`, meta);
      }
      return ngInjectorDef;
    },
    // Make the property configurable in dev mode to allow overriding in tests
    configurable: !!ngDevMode,
  });
}

/**
 * Some declared components may be compiled asynchronously, and thus may not have their
 * ngComponentDef set yet. If this is the case, then a reference to the module is written into
 * the `ngSelectorScope` property of the declared type.
 */
export function setScopeOnDeclaredComponents(moduleType: Type<any>) {
  const def = getNgModuleDef(moduleType);
  if (def === null) {
    throw new Error(`${moduleType.name} does not have an ngModuleDef`);
  }

  const transitiveScopes = transitiveScopesFor(moduleType);

  def.declarations.forEach(declaration => {
    if (declaration.hasOwnProperty(NG_COMPONENT_DEF)) {
      // An `ngComponentDef` field exists - go ahead and patch the component directly.
      const component = declaration as Type<any>& {ngComponentDef: ComponentDef<any>};
      const componentDef = getComponentDef(component) !;
      patchComponentDefWithScope(componentDef, transitiveScopes);
    } else if (
        !declaration.hasOwnProperty(NG_DIRECTIVE_DEF) && !declaration.hasOwnProperty(NG_PIPE_DEF)) {
      // Set `ngSelectorScope` for future reference when the component compilation finishes.
      (declaration as Type<any>& {ngSelectorScope?: any}).ngSelectorScope = moduleType;
    }
  });
}

/**
 * Patch the definition of a component with directives and pipes from the compilation scope of
 * a given module.
 */
export function patchComponentDefWithScope<C>(
    componentDef: ComponentDef<C>, transitiveScopes: NgModuleTransitiveScopes) {
  componentDef.directiveDefs = () => Array.from(transitiveScopes.compilation.directives)
                                         .map(dir => getDirectiveDef(dir) || getComponentDef(dir) !)
                                         .filter(def => !!def);
  componentDef.pipeDefs = () =>
      Array.from(transitiveScopes.compilation.pipes).map(pipe => getPipeDef(pipe) !);
}

/**
 * Compute the pair of transitive scopes (compilation scope and exported scope) for a given module.
 *
 * This operation is memoized and the result is cached on the module's definition. It can be called
 * on modules with components that have not fully compiled yet, but the result should not be used
 * until they have.
 */
export function transitiveScopesFor<T>(moduleType: Type<T>): NgModuleTransitiveScopes {
  const def = getNgModuleDef(moduleType);
  if (def === null) {
    throw new Error(`${moduleType.name} does not have an ngModuleDef`);
  }

  if (def.transitiveCompileScopes !== null) {
    return def.transitiveCompileScopes;
  }

  const scopes: NgModuleTransitiveScopes = {
    compilation: {
      directives: new Set<any>(),
      pipes: new Set<any>(),
    },
    exported: {
      directives: new Set<any>(),
      pipes: new Set<any>(),
    },
  };

  def.declarations.forEach(declared => {
    const declaredWithDefs = declared as Type<any>& { ngPipeDef?: any; };

    if (getPipeDef(declaredWithDefs)) {
      scopes.compilation.pipes.add(declared);
    } else {
      // Either declared has an ngComponentDef or ngDirectiveDef, or it's a component which hasn't
      // had its template compiled yet. In either case, it gets added to the compilation's
      // directives.
      scopes.compilation.directives.add(declared);
    }
  });

  def.imports.forEach(<I>(imported: Type<I>) => {
    const importedTyped = imported as Type<I>& {
      // If imported is an @NgModule:
      ngModuleDef?: NgModuleDef<I>;
    };

    if (!isNgModule<I>(importedTyped)) {
      throw new Error(`Importing ${importedTyped.name} which does not have an ngModuleDef`);
    }

    // When this module imports another, the imported module's exported directives and pipes are
    // added to the compilation scope of this module.
    const importedScope = transitiveScopesFor(importedTyped);
    importedScope.exported.directives.forEach(entry => scopes.compilation.directives.add(entry));
    importedScope.exported.pipes.forEach(entry => scopes.compilation.pipes.add(entry));
  });

  def.exports.forEach(<E>(exported: Type<E>) => {
    const exportedTyped = exported as Type<E>& {
      // Components, Directives, NgModules, and Pipes can all be exported.
      ngComponentDef?: any;
      ngDirectiveDef?: any;
      ngModuleDef?: NgModuleDef<E>;
      ngPipeDef?: any;
    };

    // Either the type is a module, a pipe, or a component/directive (which may not have an
    // ngComponentDef as it might be compiled asynchronously).
    if (isNgModule(exportedTyped)) {
      // When this module exports another, the exported module's exported directives and pipes are
      // added to both the compilation and exported scopes of this module.
      const exportedScope = transitiveScopesFor(exportedTyped);
      exportedScope.exported.directives.forEach(entry => {
        scopes.compilation.directives.add(entry);
        scopes.exported.directives.add(entry);
      });
      exportedScope.exported.pipes.forEach(entry => {
        scopes.compilation.pipes.add(entry);
        scopes.exported.pipes.add(entry);
      });
    } else if (getPipeDef(exportedTyped)) {
      scopes.exported.pipes.add(exportedTyped);
    } else {
      scopes.exported.directives.add(exportedTyped);
    }
  });

  def.transitiveCompileScopes = scopes;
  return scopes;
}

function flatten<T>(values: any[]): T[] {
  const out: T[] = [];
  values.forEach(value => {
    if (Array.isArray(value)) {
      out.push(...flatten<T>(value));
    } else {
      out.push(value);
    }
  });
  return out;
}

function expandModuleWithProviders(value: Type<any>| ModuleWithProviders<{}>): Type<any> {
  if (isModuleWithProviders(value)) {
    return value.ngModule;
  }
  return value;
}

function isModuleWithProviders(value: any): value is ModuleWithProviders<{}> {
  return (value as{ngModule?: any}).ngModule !== undefined;
}

function isNgModule<T>(value: Type<T>): value is Type<T>&{ngModuleDef: NgModuleDef<T>} {
  return !!getNgModuleDef(value);
}
