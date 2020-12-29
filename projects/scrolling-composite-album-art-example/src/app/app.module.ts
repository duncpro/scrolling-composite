import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ScrollingCompositeModule } from 'scrolling-composite';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    ScrollingCompositeModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
