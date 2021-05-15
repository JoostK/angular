/****************************************************************************************************
 * PARTIAL FILE: legacy_enabled.js
 ****************************************************************************************************/
import { Component, NgModule } from '@angular/core';
import * as i0 from "@angular/core";
export class MyComponent {
}
MyComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "0.0.0-PLACEHOLDER", ngImport: i0, type: MyComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
MyComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "0.0.0-PLACEHOLDER", type: MyComponent, selector: "my-component", ngImport: i0, template: `
  <div i18n>Some Message</div>
`, isInline: true });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "0.0.0-PLACEHOLDER", ngImport: i0, type: MyComponent, decorators: [{
            type: Component,
            args: [{
                    selector: 'my-component',
                    template: `
  <div i18n>Some Message</div>
`
                }]
        }] });
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
 * PARTIAL FILE: legacy_enabled.d.ts
 ****************************************************************************************************/
import { ɵɵFactoryDeclaration, ɵɵComponentDeclaration, ɵɵNgModuleDeclaration, ɵɵInjectorDeclaration } from "@angular/core";
export declare class MyComponent {
    static ɵfac: ɵɵFactoryDeclaration<MyComponent, never>;
    static ɵcmp: ɵɵComponentDeclaration<MyComponent, "my-component", never, {}, {}, never, never>;
}
export declare class MyModule {
    static ɵfac: ɵɵFactoryDeclaration<MyModule, never>;
    static ɵmod: ɵɵNgModuleDeclaration<MyModule, [typeof MyComponent], never, never>;
    static ɵinj: ɵɵInjectorDeclaration<MyModule>;
}

/****************************************************************************************************
 * PARTIAL FILE: legacy_disabled.js
 ****************************************************************************************************/
import { Component, NgModule } from '@angular/core';
import * as i0 from "@angular/core";
export class MyComponent {
}
MyComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "0.0.0-PLACEHOLDER", ngImport: i0, type: MyComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
MyComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "0.0.0-PLACEHOLDER", type: MyComponent, selector: "my-component", ngImport: i0, template: `
  <div i18n>Some Message</div>
`, isInline: true });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "0.0.0-PLACEHOLDER", ngImport: i0, type: MyComponent, decorators: [{
            type: Component,
            args: [{
                    selector: 'my-component',
                    template: `
  <div i18n>Some Message</div>
`
                }]
        }] });
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
 * PARTIAL FILE: legacy_disabled.d.ts
 ****************************************************************************************************/
import { ɵɵFactoryDeclaration, ɵɵComponentDeclaration, ɵɵNgModuleDeclaration, ɵɵInjectorDeclaration } from "@angular/core";
export declare class MyComponent {
    static ɵfac: ɵɵFactoryDeclaration<MyComponent, never>;
    static ɵcmp: ɵɵComponentDeclaration<MyComponent, "my-component", never, {}, {}, never, never>;
}
export declare class MyModule {
    static ɵfac: ɵɵFactoryDeclaration<MyModule, never>;
    static ɵmod: ɵɵNgModuleDeclaration<MyModule, [typeof MyComponent], never, never>;
    static ɵinj: ɵɵInjectorDeclaration<MyModule>;
}

