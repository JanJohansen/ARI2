import { NgModule }      from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { AppComponent }   from './app.component'
import { NavComponent } from './nav.component'
import { FlowDesignerComponent } from './flowdesigner.component'
import { ContextMenuComponent } from './contextMenu.component'

@NgModule({
  imports:      [ BrowserModule ],
  declarations: [ 
                  AppComponent, 
                  NavComponent, 
                  FlowDesignerComponent, 
                  ContextMenuComponent
                 ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }