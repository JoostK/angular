/****************************************************************************************************
 * PARTIAL FILE: component.js
 ****************************************************************************************************/
import { Component, Input, NgModule, Output } from '@angular/core';
import * as i0 from "@angular/core";
export class MyComponent {
}
MyComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "0.0.0-PLACEHOLDER", ngImport: i0, type: MyComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
MyComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "0.0.0-PLACEHOLDER", type: MyComponent, selector: "my-component", inputs: { componentInput: "componentInput", originalComponentInput: ["renamedComponentInput", "originalComponentInput"] }, outputs: { componentOutput: "componentOutput", originalComponentOutput: "renamedComponentOutput" }, ngImport: i0, template: '', isInline: true });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "0.0.0-PLACEHOLDER", ngImport: i0, type: MyComponent, decorators: [{
            type: Component,
            args: [{ selector: 'my-component', template: '' }]
        }], propDecorators: { componentInput: [{
                type: Input
            }], originalComponentInput: [{
                type: Input,
                args: ['renamedComponentInput']
            }], componentOutput: [{
                type: Output
            }], originalComponentOutput: [{
                type: Output,
                args: ['renamedComponentOutput']
            }] } });
export class MyModule {
}
MyModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "0.0.0-PLACEHOLDER", ngImport: i0, type: MyModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
MyModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "0.0.0-PLACEHOLDER", ngImport: i0, type: MyModule, declarations: [MyComponent] });
MyModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "0.0.0-PLACEHOLDER", ngImport: i0, type: MyModule });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "0.0.0-PLACEHOLDER", ngImport: i0, type: MyModule, decorators: [{
            type: NgModule,
            args: [{ declarations: [MyComponent] }]
        }] });

/****************************************************************************************************
 * PARTIAL FILE: component.d.ts
 ****************************************************************************************************/
import { ɵɵFactoryDeclaration, ɵɵComponentDeclaration, ɵɵNgModuleDeclaration, ɵɵInjectorDeclaration } from "@angular/core";
export declare class MyComponent {
    componentInput: any;
    originalComponentInput: any;
    componentOutput: any;
    originalComponentOutput: any;
    static ɵfac: ɵɵFactoryDeclaration<MyComponent, never>;
    static ɵcmp: ɵɵComponentDeclaration<MyComponent, "my-component", never, { "componentInput": "componentInput"; "originalComponentInput": "renamedComponentInput"; }, { "componentOutput": "componentOutput"; "originalComponentOutput": "renamedComponentOutput"; }, never, never>;
}
export declare class MyModule {
    static ɵfac: ɵɵFactoryDeclaration<MyModule, never>;
    static ɵmod: ɵɵNgModuleDeclaration<MyModule, [typeof MyComponent], never, never>;
    static ɵinj: ɵɵInjectorDeclaration<MyModule>;
}

/****************************************************************************************************
 * PARTIAL FILE: directive.js
 ****************************************************************************************************/
import { Directive, Input, NgModule, Output } from '@angular/core';
import * as i0 from "@angular/core";
export class MyDirective {
}
MyDirective.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "0.0.0-PLACEHOLDER", ngImport: i0, type: MyDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive });
MyDirective.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "0.0.0-PLACEHOLDER", type: MyDirective, selector: "[my-directive]", inputs: { directiveInput: "directiveInput", originalDirectiveInput: ["renamedDirectiveInput", "originalDirectiveInput"] }, outputs: { directiveOutput: "directiveOutput", originalDirectiveOutput: "renamedDirectiveOutput" }, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "0.0.0-PLACEHOLDER", ngImport: i0, type: MyDirective, decorators: [{
            type: Directive,
            args: [{ selector: '[my-directive]' }]
        }], propDecorators: { directiveInput: [{
                type: Input
            }], originalDirectiveInput: [{
                type: Input,
                args: ['renamedDirectiveInput']
            }], directiveOutput: [{
                type: Output
            }], originalDirectiveOutput: [{
                type: Output,
                args: ['renamedDirectiveOutput']
            }] } });
export class MyModule {
}
MyModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "0.0.0-PLACEHOLDER", ngImport: i0, type: MyModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
MyModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "0.0.0-PLACEHOLDER", ngImport: i0, type: MyModule, declarations: [MyDirective] });
MyModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "0.0.0-PLACEHOLDER", ngImport: i0, type: MyModule });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "0.0.0-PLACEHOLDER", ngImport: i0, type: MyModule, decorators: [{
            type: NgModule,
            args: [{ declarations: [MyDirective] }]
        }] });

/****************************************************************************************************
 * PARTIAL FILE: directive.d.ts
 ****************************************************************************************************/
import { ɵɵFactoryDeclaration, ɵɵDirectiveDeclaration, ɵɵNgModuleDeclaration, ɵɵInjectorDeclaration } from "@angular/core";
export declare class MyDirective {
    directiveInput: any;
    originalDirectiveInput: any;
    directiveOutput: any;
    originalDirectiveOutput: any;
    static ɵfac: ɵɵFactoryDeclaration<MyDirective, never>;
    static ɵdir: ɵɵDirectiveDeclaration<MyDirective, "[my-directive]", never, { "directiveInput": "directiveInput"; "originalDirectiveInput": "renamedDirectiveInput"; }, { "directiveOutput": "directiveOutput"; "originalDirectiveOutput": "renamedDirectiveOutput"; }, never>;
}
export declare class MyModule {
    static ɵfac: ɵɵFactoryDeclaration<MyModule, never>;
    static ɵmod: ɵɵNgModuleDeclaration<MyModule, [typeof MyDirective], never, never>;
    static ɵinj: ɵɵInjectorDeclaration<MyModule>;
}

