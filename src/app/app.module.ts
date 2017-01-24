import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { AppComponent } from './app.component';
import { CesiumComponent } from './cesium/cesium.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import { VesselService } from './cesium/vessel.service';

@NgModule({
  declarations: [
    AppComponent,
    CesiumComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    NgbModule.forRoot()
  ],
  providers: [
    VesselService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
