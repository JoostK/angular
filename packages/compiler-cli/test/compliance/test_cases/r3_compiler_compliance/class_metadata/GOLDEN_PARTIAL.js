/****************************************************************************************************
 * PARTIAL FILE: custom.js
 ****************************************************************************************************/
export function CustomClassDecorator() {
    return (clazz) => clazz;
}
export function CustomPropDecorator() {
    return () => { };
}
export function CustomParamDecorator() {
    return () => { };
}

/****************************************************************************************************
 * PARTIAL FILE: custom.d.ts
 ****************************************************************************************************/
export declare function CustomClassDecorator(): ClassDecorator;
export declare function CustomPropDecorator(): PropertyDecorator;
export declare function CustomParamDecorator(): ParameterDecorator;

/****************************************************************************************************
 * PARTIAL FILE: class_decorators.js
 ****************************************************************************************************/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@angular/core';
import { CustomClassDecorator } from './custom';
import * as i0 from "@angular/core";
export class BasicInjectable {
}
BasicInjectable.ɵfac = i0.ɵɵngDeclareFactory({ version: "0.0.0-PLACEHOLDER", ngImport: i0, type: BasicInjectable, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
BasicInjectable.ɵprov = i0.ɵɵngDeclareInjectable({ version: "0.0.0-PLACEHOLDER", ngImport: i0, type: BasicInjectable });
i0.ɵɵngDeclareClassMetadata({ version: "0.0.0-PLACEHOLDER", ngImport: i0, type: BasicInjectable, decorators: [{
            type: Injectable
        }] });
export class RootInjectable {
}
RootInjectable.ɵfac = i0.ɵɵngDeclareFactory({ version: "0.0.0-PLACEHOLDER", ngImport: i0, type: RootInjectable, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
RootInjectable.ɵprov = i0.ɵɵngDeclareInjectable({ version: "0.0.0-PLACEHOLDER", ngImport: i0, type: RootInjectable, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ version: "0.0.0-PLACEHOLDER", ngImport: i0, type: RootInjectable, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }] });
let CustomInjectable = class CustomInjectable {
};
CustomInjectable.ɵfac = i0.ɵɵngDeclareFactory({ version: "0.0.0-PLACEHOLDER", ngImport: i0, type: CustomInjectable, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
CustomInjectable.ɵprov = i0.ɵɵngDeclareInjectable({ version: "0.0.0-PLACEHOLDER", ngImport: i0, type: CustomInjectable });
CustomInjectable = __decorate([
    CustomClassDecorator()
], CustomInjectable);
i0.ɵɵngDeclareClassMetadata({ version: "0.0.0-PLACEHOLDER", ngImport: i0, type: CustomInjectable, decorators: [{
            type: Injectable
        }] });

/****************************************************************************************************
 * PARTIAL FILE: class_decorators.d.ts
 ****************************************************************************************************/
import * as i0 from "@angular/core";
export declare class BasicInjectable {
    static ɵfac: i0.ɵɵFactoryDeclaration<BasicInjectable, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<BasicInjectable>;
}
export declare class RootInjectable {
    static ɵfac: i0.ɵɵFactoryDeclaration<RootInjectable, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<RootInjectable>;
}

/****************************************************************************************************
 * PARTIAL FILE: custom.js
 ****************************************************************************************************/
export function CustomClassDecorator() {
    return (clazz) => clazz;
}
export function CustomPropDecorator() {
    return () => { };
}
export function CustomParamDecorator() {
    return () => { };
}

/****************************************************************************************************
 * PARTIAL FILE: custom.d.ts
 ****************************************************************************************************/
export declare function CustomClassDecorator(): ClassDecorator;
export declare function CustomPropDecorator(): PropertyDecorator;
export declare function CustomParamDecorator(): ParameterDecorator;

/****************************************************************************************************
 * PARTIAL FILE: property_decorators.js
 ****************************************************************************************************/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Directive, Input, Output } from '@angular/core';
import { CustomPropDecorator } from './custom';
import * as i0 from "@angular/core";
export class MyDir {
}
MyDir.ɵfac = i0.ɵɵngDeclareFactory({ version: "0.0.0-PLACEHOLDER", ngImport: i0, type: MyDir, deps: [], target: i0.ɵɵFactoryTarget.Directive });
MyDir.ɵdir = i0.ɵɵngDeclareDirective({ version: "0.0.0-PLACEHOLDER", type: MyDir, inputs: { foo: "foo", bar: ["baz", "bar"], mixed: "mixed" }, outputs: { mixed: "mixed" }, ngImport: i0 });
__decorate([
    CustomPropDecorator(),
    __metadata("design:type", String)
], MyDir.prototype, "custom", void 0);
__decorate([
    CustomPropDecorator(),
    __metadata("design:type", String)
], MyDir.prototype, "mixed", void 0);
i0.ɵɵngDeclareClassMetadata({ version: "0.0.0-PLACEHOLDER", ngImport: i0, type: MyDir, decorators: [{
            type: Directive
        }], propDecorators: { foo: [{
                type: Input
            }], bar: [{
                type: Input,
                args: ['baz']
            }], custom: [], mixed: [{
                type: Input
            }, {
                type: Output
            }] } });

/****************************************************************************************************
 * PARTIAL FILE: property_decorators.d.ts
 ****************************************************************************************************/
import * as i0 from "@angular/core";
export declare class MyDir {
    foo: string;
    bar: string;
    custom: string;
    mixed: string;
    static ɵfac: i0.ɵɵFactoryDeclaration<MyDir, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<MyDir, never, never, { "foo": "foo"; "bar": "baz"; "mixed": "mixed"; }, { "mixed": "mixed"; }, never>;
}

/****************************************************************************************************
 * PARTIAL FILE: custom.js
 ****************************************************************************************************/
export function CustomClassDecorator() {
    return (clazz) => clazz;
}
export function CustomPropDecorator() {
    return () => { };
}
export function CustomParamDecorator() {
    return () => { };
}

/****************************************************************************************************
 * PARTIAL FILE: custom.d.ts
 ****************************************************************************************************/
export declare function CustomClassDecorator(): ClassDecorator;
export declare function CustomPropDecorator(): PropertyDecorator;
export declare function CustomParamDecorator(): ParameterDecorator;

/****************************************************************************************************
 * PARTIAL FILE: parameter_decorators.js
 ****************************************************************************************************/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Inject, Injectable, InjectionToken, SkipSelf } from '@angular/core';
import { CustomParamDecorator } from './custom';
import * as i0 from "@angular/core";
export const TOKEN = new InjectionToken('TOKEN');
class Service {
}
let ParamerizedInjectable = class ParamerizedInjectable {
    constructor(service, token, custom, mixed) { }
};
ParamerizedInjectable.ɵfac = i0.ɵɵngDeclareFactory({ version: "0.0.0-PLACEHOLDER", ngImport: i0, type: ParamerizedInjectable, deps: [{ token: Service }, { token: TOKEN }, { token: Service }, { token: TOKEN, skipSelf: true }], target: i0.ɵɵFactoryTarget.Injectable });
ParamerizedInjectable.ɵprov = i0.ɵɵngDeclareInjectable({ version: "0.0.0-PLACEHOLDER", ngImport: i0, type: ParamerizedInjectable });
ParamerizedInjectable = __decorate([
    __param(2, CustomParamDecorator()),
    __param(3, CustomParamDecorator()),
    __metadata("design:paramtypes", [Service, String, Service, String])
], ParamerizedInjectable);
export { ParamerizedInjectable };
i0.ɵɵngDeclareClassMetadata({ version: "0.0.0-PLACEHOLDER", ngImport: i0, type: ParamerizedInjectable, decorators: [{
            type: Injectable
        }], ctorParameters: function () { return [{ type: Service }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [TOKEN]
                }] }, { type: Service, decorators: [] }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [TOKEN]
                }, {
                    type: SkipSelf
                }] }]; } });
export class NoCtor {
}
NoCtor.ɵfac = i0.ɵɵngDeclareFactory({ version: "0.0.0-PLACEHOLDER", ngImport: i0, type: NoCtor, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
NoCtor.ɵprov = i0.ɵɵngDeclareInjectable({ version: "0.0.0-PLACEHOLDER", ngImport: i0, type: NoCtor });
i0.ɵɵngDeclareClassMetadata({ version: "0.0.0-PLACEHOLDER", ngImport: i0, type: NoCtor, decorators: [{
            type: Injectable
        }] });
export class EmptyCtor {
    constructor() { }
}
EmptyCtor.ɵfac = i0.ɵɵngDeclareFactory({ version: "0.0.0-PLACEHOLDER", ngImport: i0, type: EmptyCtor, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
EmptyCtor.ɵprov = i0.ɵɵngDeclareInjectable({ version: "0.0.0-PLACEHOLDER", ngImport: i0, type: EmptyCtor });
i0.ɵɵngDeclareClassMetadata({ version: "0.0.0-PLACEHOLDER", ngImport: i0, type: EmptyCtor, decorators: [{
            type: Injectable
        }], ctorParameters: function () { return []; } });
export class NoDecorators {
    constructor(service) { }
}
NoDecorators.ɵfac = i0.ɵɵngDeclareFactory({ version: "0.0.0-PLACEHOLDER", ngImport: i0, type: NoDecorators, deps: [{ token: Service }], target: i0.ɵɵFactoryTarget.Injectable });
NoDecorators.ɵprov = i0.ɵɵngDeclareInjectable({ version: "0.0.0-PLACEHOLDER", ngImport: i0, type: NoDecorators });
i0.ɵɵngDeclareClassMetadata({ version: "0.0.0-PLACEHOLDER", ngImport: i0, type: NoDecorators, decorators: [{
            type: Injectable
        }], ctorParameters: function () { return [{ type: Service }]; } });
let CustomInjectable = class CustomInjectable {
    constructor(service) { }
};
CustomInjectable.ɵfac = i0.ɵɵngDeclareFactory({ version: "0.0.0-PLACEHOLDER", ngImport: i0, type: CustomInjectable, deps: [{ token: Service }], target: i0.ɵɵFactoryTarget.Injectable });
CustomInjectable.ɵprov = i0.ɵɵngDeclareInjectable({ version: "0.0.0-PLACEHOLDER", ngImport: i0, type: CustomInjectable });
CustomInjectable = __decorate([
    __param(0, CustomParamDecorator()),
    __metadata("design:paramtypes", [Service])
], CustomInjectable);
export { CustomInjectable };
i0.ɵɵngDeclareClassMetadata({ version: "0.0.0-PLACEHOLDER", ngImport: i0, type: CustomInjectable, decorators: [{
            type: Injectable
        }], ctorParameters: function () { return [{ type: Service, decorators: [] }]; } });

/****************************************************************************************************
 * PARTIAL FILE: parameter_decorators.d.ts
 ****************************************************************************************************/
import { InjectionToken } from '@angular/core';
import * as i0 from "@angular/core";
export declare const TOKEN: InjectionToken<string>;
declare class Service {
}
export declare class ParamerizedInjectable {
    constructor(service: Service, token: string, custom: Service, mixed: string);
    static ɵfac: i0.ɵɵFactoryDeclaration<ParamerizedInjectable, [null, null, null, { skipSelf: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<ParamerizedInjectable>;
}
export declare class NoCtor {
    static ɵfac: i0.ɵɵFactoryDeclaration<NoCtor, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<NoCtor>;
}
export declare class EmptyCtor {
    constructor();
    static ɵfac: i0.ɵɵFactoryDeclaration<EmptyCtor, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<EmptyCtor>;
}
export declare class NoDecorators {
    constructor(service: Service);
    static ɵfac: i0.ɵɵFactoryDeclaration<NoDecorators, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<NoDecorators>;
}
export declare class CustomInjectable {
    constructor(service: Service);
    static ɵfac: i0.ɵɵFactoryDeclaration<CustomInjectable, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<CustomInjectable>;
}
export {};

