import { Component, ElementRef, Output, EventEmitter} from '@angular/core';
@Component({
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
export class ContextMenuComponent { 
    //@Input() menuItems: any;
    _contextMenu = [
        { 
            name:"Add object", 
            children: [
                {
                    name:"Logic", 
                    children: [
                        {name: "AND", className:"andClass"},
                        {name: "OR"},
                        {name: "NOT"},
                        {name: "XOR"}
                    ]
                },{
                    name:"Math", 
                    children: [
                        {name: "Add"},
                        {name: "Sub"},
                        {name: "Div"},
                        {name: "Mul"},
                        {name: "Min"},
                        {name: "Max"}
                    ]
                },
                {
                    name:"Time", 
                    children: [
                        {name: "Ticker"},
                        {name: "Timer"},
                        {name: "Delay"},
                        {name: "Trigger"},
                        {name: "Min"},
                        {name: "Max"}
                    ]
                }
            ]
        },
        {
            name:"Paste ojbect"
        }
    ];

    pos = {x: 200, y:100};
    
    _currentLevel = 0;
    _currentMenu = this._contextMenu;
    menuPathString = "";
    visible = false;

    

    @Output() menuSelected = new EventEmitter();

    menuMouseUp(event, currentMenu, name) {
        console.log("MenuClicked", event, currentMenu, name);
        if(currentMenu.children) {
            this.menuPathString += name + "->";
            this._currentMenu = currentMenu.children;
        } else {
            this.menuPathString += name;
            console.log("Menu selected:", this.menuPathString);
            this.visible = false;
            this.menuSelected.emit({path: this.menuPathString, event: event, item: currentMenu});
        }
        event.stopPropagation();
    }

    onHostClick(event: MouseEvent) {
        console.log("onHostClick:", event);
        if(this.visible) this.visible = false;
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
}
