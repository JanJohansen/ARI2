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
var core_1 = require('@angular/core');
var FlowComponent = (function () {
    function FlowComponent() {
        this.nodes = [
            { name: "Node 1", x: 50, y: 50, width: 200, height: 100, selected: false, radius: 10,
                inputs: [{ name: "Input_1" }, { name: "I_2" }, { name: "I_3" }],
                outputs: [{ name: "O_1" }]
            },
            { name: "Node 2", x: 300, y: 75, width: 200, height: 50, selected: false, radius: 20,
                inputs: [{ name: "I_1" }],
                outputs: [{ name: "O_1" }]
            }
        ];
        this.nodes.forEach(function (e) {
            console.log(e.name);
            e.inputs.forEach(function (e) {
                console.log(e.name);
            });
        });
    }
    FlowComponent = __decorate([
        core_1.Component({
            selector: "ariflow",
            styleUrls: ['app/flow.component.css'],
            template: "\n    <svg viewBox=\"0 0 900 500\" preserveAspectRatio=\"xMidYMid meet\">\n        <defs>\n            <linearGradient \n                spreadMethod=\"pad\" \n                y2=\"0\" \n                x2=\"0\" \n                y1=\"1\" \n                x1=\"0\" \n                id=\"nodeBackgroundGradient\"\n            >\n                <stop offset=\"0\" stop-color=\"#dddddd\" />\n                <stop offset=\"0.63934\" stop-color=\"#f7f7f7\" />\n            </linearGradient>\n        </defs>\n        <svg:g mb-circle *ngFor=\"let node of nodes\" [node]=\"node\" />\n    </svg>\n    "
        }), 
        __metadata('design:paramtypes', [])
    ], FlowComponent);
    return FlowComponent;
}());
exports.FlowComponent = FlowComponent;
//# sourceMappingURL=C:/Users/Jan/Desktop/ARI2_Test/dist/www/app/del.flow.component.js.map