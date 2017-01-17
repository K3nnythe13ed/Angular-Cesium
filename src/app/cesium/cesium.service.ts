import { Injectable } from '@angular/core';
import 'rxjs/add/operator/toPromise';
import { Headers, Http, Response } from '@angular/http';
import { CoordinateSearchResult, ModelLocation } from './cesium.model';
import * as elasticsearch from 'elasticsearch';
import { Logger } from '../utility/logger';
@Injectable()
export class CesiumService {

  constructor(private http: Http,
    private logger: Logger) { }



getLocationsWithCoordinates(): Promise<CoordinateSearchResult> {

return this.http.post('http://localhost:9200/logstash-constant/warehouse/_search',
      JSON.stringify({ "size" : 500, "query": { "exists": { "field": "coordinates.coordinates" } } })).toPromise().then((response: Response) => {
        let searchResult = new CoordinateSearchResult();
        searchResult.totalCount = response.json().hits.total;
        let items: ModelLocation[] = [];
        for (let result of response.json().hits.hits) {
         let item = new ModelLocation();
         item.id = result._source.properties.LocID;
         item.exp = result._source.properties.Exp_TIV;
         item.lat = result._source.geometry.coordinates[0];
         item.lon = result._source.geometry.coordinates[1];
         item.name = result._source.properties.AccountName;
         items.push(item)
        }
searchResult.items = items;
        return searchResult;
      }).catch(error => {
        this.logger.error(error);
        return Promise.reject(error);
      });
  }

}