import { Injectable } from '@angular/core';
import { Vessel, VesselList, CZMLObject, CZMLArray } from './cesium.model';
import * as elasticsearch from 'elasticsearch';

@Injectable()
export class VesselService {
  private _client: elasticsearch.Client
  constructor() {
    this._client = new elasticsearch.Client({
      host: 'localhost:9200'
    });
  }

  LoadVessels() {
    let czmlarray = new CZMLArray();
    let _client = this._client
    let searchResult = new VesselList();
    let vessels: Vessel[] = [];
    _client.search({
      index: 'logstash-*',
      type: 'vessel',
      size: 1000,
      scroll: '30s',
      body: {
        "sort": { "@timestamp": { "order": "asc" } },
        "query": {
          "bool": {
            "must": [
              {
                "range": {
                  "TYPE": {
                    "gte": 70,
                    "lte": 70
                  }
                }
              }
            ]
          }
        }
      }

    }, function getMoreUntilDone(error, response) {
      // collect the title from each response
      response.hits.hits.forEach(function (hit) {
        CZML(hit);

      });
      if (response.hits.total > vessels.length) {
        // ask elasticsearch for the next set of hits from this search
        _client.scroll({
          scrollId: response._scroll_id,
          scroll: '30s'
        }, getMoreUntilDone);
      } else {

      }
    });
    function CZML(hit) {
      //how to add dynamic data in czml format
      for (let vessel of czmlarray.czml) {
        if (vessel.id == hit._source.MMSI) {
          console.log("test")
        }
        else {
          let czml = new CZMLObject()
          czml.id = hit._source.MMSI;
          czml.name = hit.NAME;
          czmlarray.czml.push(czml)
        }
      }



    }





  }


}