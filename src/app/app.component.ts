import { Component, OnInit } from '@angular/core';
import * as elasticsearch from 'elasticsearch';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent  implements OnInit {
  title = 'app works!';
  private _client: elasticsearch.Client

  constructor() {
    
  }
  
  ngOnInit() {

  }
}