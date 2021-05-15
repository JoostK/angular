/****************************************************************************************************
 * PARTIAL FILE: todo_example.js
 ****************************************************************************************************/
import { Component, Input, NgModule } from '@angular/core';
import * as i0 from "@angular/core";
export class MyApp {
    constructor() {
        this.list = [];
    }
}
MyApp.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "0.0.0-PLACEHOLDER", ngImport: i0, type: MyApp, deps: [], target: i0.ɵɵFactoryTarget.Component });
MyApp.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "0.0.0-PLACEHOLDER", type: MyApp, selector: "my-app", ngImport: i0, template: '<todo [data]="list"></todo>', isInline: true, components: [{ type: i0.forwardRef(function () { return TodoComponent; }), selector: "todo", inputs: ["data"] }] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "0.0.0-PLACEHOLDER", ngImport: i0, type: MyApp, decorators: [{
            type: Component,
            args: [{ selector: 'my-app', template: '<todo [data]="list"></todo>' }]
        }] });
export class TodoComponent {
    constructor() {
        this.data = [];
    }
}
TodoComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "0.0.0-PLACEHOLDER", ngImport: i0, type: TodoComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
TodoComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "0.0.0-PLACEHOLDER", type: TodoComponent, selector: "todo", inputs: { data: "data" }, ngImport: i0, template: '<ul class="list" [title]="myTitle"><li *ngFor="let item of data">{{data}}</li></ul>', isInline: true });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "0.0.0-PLACEHOLDER", ngImport: i0, type: TodoComponent, decorators: [{
            type: Component,
            args: [{
                    selector: 'todo',
                    template: '<ul class="list" [title]="myTitle"><li *ngFor="let item of data">{{data}}</li></ul>'
                }]
        }], propDecorators: { data: [{
                type: Input
            }] } });
export class TodoModule {
}
TodoModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "0.0.0-PLACEHOLDER", ngImport: i0, type: TodoModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
TodoModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "0.0.0-PLACEHOLDER", ngImport: i0, type: TodoModule, declarations: [TodoComponent, MyApp] });
TodoModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "0.0.0-PLACEHOLDER", ngImport: i0, type: TodoModule });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "0.0.0-PLACEHOLDER", ngImport: i0, type: TodoModule, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [TodoComponent, MyApp],
                }]
        }] });

/****************************************************************************************************
 * PARTIAL FILE: todo_example.d.ts
 ****************************************************************************************************/
import { ɵɵFactoryDeclaration, ɵɵComponentDeclaration, ɵɵNgModuleDeclaration, ɵɵInjectorDeclaration } from "@angular/core";
export declare class MyApp {
    list: any[];
    static ɵfac: ɵɵFactoryDeclaration<MyApp, never>;
    static ɵcmp: ɵɵComponentDeclaration<MyApp, "my-app", never, {}, {}, never, never>;
}
export declare class TodoComponent {
    data: any[];
    myTitle: string;
    static ɵfac: ɵɵFactoryDeclaration<TodoComponent, never>;
    static ɵcmp: ɵɵComponentDeclaration<TodoComponent, "todo", never, { "data": "data"; }, {}, never, never>;
}
export declare class TodoModule {
    static ɵfac: ɵɵFactoryDeclaration<TodoModule, never>;
    static ɵmod: ɵɵNgModuleDeclaration<TodoModule, [typeof TodoComponent, typeof MyApp], never, never>;
    static ɵinj: ɵɵInjectorDeclaration<TodoModule>;
}

