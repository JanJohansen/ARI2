import { Component } from '@angular/core';
@Component( {
    selector: "ariflow",
    styleUrls: ['app/flow.component.css'],
    template: `
    <svg viewBox="0 0 900 500" preserveAspectRatio="xMidYMid meet">
        <defs>
            <linearGradient 
                spreadMethod="pad" 
                y2="0" 
                x2="0" 
                y1="1" 
                x1="0" 
                id="nodeBackgroundGradient"
            >
                <stop offset="0" stop-color="#dddddd" />
                <stop offset="0.63934" stop-color="#f7f7f7" />
            </linearGradient>
        </defs>
        <svg:g mb-circle *ngFor="let node of nodes" [node]="node" />
    </svg>
    `
})
export class FlowComponent { 
    nodes = [
        {name: "Node 1", x: 50, y: 50, width: 200, height: 100, selected: false, radius: 10,
            inputs: [{name: "Input_1"}, {name: "I_2"}, {name: "I_3"}],
            outputs: [{name: "O_1"}]
        },
        {name: "Node 2", x: 300, y: 75, width: 200, height: 50, selected: false, radius: 20,
            inputs: [{name: "I_1"}],
            outputs: [{name: "O_1"}]
        }
    ];
    
    constructor() {
        this.nodes.forEach(e => {
            console.log(e.name);
            e.inputs.forEach(e => {
                console.log(e.name);
            }            
        });
    }  
}