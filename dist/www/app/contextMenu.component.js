"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular/core");
let ContextMenuComponent = class ContextMenuComponent {
    constructor() {
        //@Input() menuItems: any;
        this._contextMenu = [
            {
                name: "Add object",
                children: [
                    {
                        name: "Logic",
                        children: [
                            { name: "AND", className: "andClass" },
                            { name: "OR" },
                            { name: "NOT" },
                            { name: "XOR" }
                        ]
                    }, {
                        name: "Math",
                        children: [
                            { name: "Add" },
                            { name: "Sub" },
                            { name: "Div" },
                            { name: "Mul" },
                            { name: "Min" },
                            { name: "Max" }
                        ]
                    },
                    {
                        name: "Time",
                        children: [
                            { name: "Ticker" },
                            { name: "Timer" },
                            { name: "Delay" },
                            { name: "Trigger" },
                            { name: "Min" },
                            { name: "Max" }
                        ]
                    }
                ]
            },
            {
                name: "Paste ojbect"
            }
        ];
        this.pos = { x: 200, y: 100 };
        this._currentLevel = 0;
        this._currentMenu = this._contextMenu;
        this.menuPathString = "";
        this.visible = false;
        this.menuSelected = new core_1.EventEmitter();
    }
    menuMouseUp(event, currentMenu, name) {
        console.log("MenuClicked", event, currentMenu, name);
        if (currentMenu.children) {
            this.menuPathString += name + "->";
            this._currentMenu = currentMenu.children;
        }
        else {
            this.menuPathString += name;
            console.log("Menu selected:", this.menuPathString);
            this.visible = false;
            this.menuSelected.emit({ path: this.menuPathString, event: event, item: currentMenu });
        }
        event.stopPropagation();
    }
    onHostClick(event) {
        console.log("onHostClick:", event);
        if (this.visible)
            this.visible = false;
        else {
            this._currentLevel = 0;
            this._currentMenu = this._contextMenu;
            this.menuPathString = "";
            this.pos.x = event.clientX;
            this.pos.y = event.clientY;
            this.visible = true;
        }
        event.stopPropagation();
    }
};
__decorate([
    core_1.Output(),
    __metadata("design:type", Object)
], ContextMenuComponent.prototype, "menuSelected", void 0);
ContextMenuComponent = __decorate([
    core_1.Component({
        selector: 'jj-context-menu',
        // Add click handler to hosting element, to detect when to show context menu.
        host: {
            '(document:mouseup)': 'onHostClick($event)',
        },
        template: `
                <div *ngIf="visible" class="dropdown" style="display: block; position:fixed;" [style.left]="pos.x" [style.top]="pos.y">
                    <ul class="dropdown-menu" role="menu" aria-labelledby="dLabel" style="display: block;">
                        <li class="dropdown-submenu" *ngFor="let menu of _currentMenu">
                            <a tabindex="-1" href="#" (mouseup)="menuMouseUp($event, menu, menu.name)">
                                {{menu.name}}  
                                <i *ngIf="menu.children" class="fa fa-angle-right" aria-hidden="true"></i>
                            </a>
                        </li>
                    </ul>
                </div>
            `
    })
], ContextMenuComponent);
exports.ContextMenuComponent = ContextMenuComponent;
//# sourceMappingURL=C:/Users/jan/Desktop/ARI2/dist/www/app/contextMenu.component.js.map