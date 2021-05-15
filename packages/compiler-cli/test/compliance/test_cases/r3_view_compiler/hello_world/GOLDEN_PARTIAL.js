/****************************************************************************************************
 * PARTIAL FILE: test.js
 ****************************************************************************************************/
import { Component, NgModule } from '@angular/core';
import * as i0 from "@angular/core";
class Greeter {
}
class GreeterEN {
    greet() {
        return 'Hi';
    }
}
export class MyComponent {
}
MyComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "0.0.0-PLACEHOLDER", ngImport: i0, type: MyComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
MyComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "0.0.0-PLACEHOLDER", type: MyComponent, selector: "my-component", providers: [GreeterEN, { provide: Greeter, useClass: GreeterEN }], ngImport: i0, template: '<div></div>', isInline: true, viewProviders: [GreeterEN] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "0.0.0-PLACEHOLDER", ngImport: i0, type: MyComponent, decorators: [{
            type: Component,
            args: [{
                    selector: 'my-component',
                    template: '<div></div>',
                    providers: [GreeterEN, { provide: Greeter, useClass: GreeterEN }],
                    viewProviders: [GreeterEN]
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
 * PARTIAL FILE: test.d.ts
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

