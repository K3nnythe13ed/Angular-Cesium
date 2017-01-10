import { Component, ElementRef, OnInit, Renderer, ViewChild } from '@angular/core';
import * as elasticsearch from 'elasticsearch';
/**
 * This is my cesium comment
 */

@Component({
  selector: 'app-cesium',
  templateUrl: './cesium.component.html',
  styleUrls: ['./cesium.component.css']
})
export class CesiumComponent implements OnInit {
  @ViewChild('cesiumContainer') cesiumContainer: ElementRef;
  cesiumViewer: any;
  private _client: elasticsearch.Client
  pinBuilder: any;

  constructor(public element: ElementRef, private renderer: Renderer) {
    Cesium.BingMapsApi.defaultKey = 'AroazdWsTmTcIx4ZE3SIicDXX00yEp9vuRZyn6pagjyjgS-VdRBfBNAVkvrucbqr';
    (<any>window).CESIUM_BASE_URL = '/assets/Cesium';


    this._client = new elasticsearch.Client({
      host: 'localhost:9200'
    });
  }

  ngAfterViewInit() {


    var terrainProvider = new Cesium.CesiumTerrainProvider({
      url: '//assets.agi.com/stk-terrain/world',
      requestWaterMask: true
    });

    this.cesiumViewer.terrainProvider = terrainProvider;
    var viewer = this.cesiumViewer;
    let marker = this.newMarkerOnMap;
    let pinbuilder = this.pinBuilder;
    let addToList = this.addToList;
    this._client.search({
      index: 'logstash-*',
      type: 'warehouse',
      size: 1000,
      body: {
        "sort": {
          "properties.LocID": { "order": "desc" }
        }
      }

    }, function (error, response) {
      if (error) {
        console.error('elasticsearch cluster is down!');
      } else {

        response.hits.hits.forEach((hit) => {
          marker(hit, viewer, pinbuilder);
          addToList(hit, "locationlist", true, viewer)
        })
        console.log('All is well');

      }
    });
    console.log(this.cesiumViewer.entities)
    console.log(viewer.entities)
  }
  newMarkerOnMap(hit, viewer, pinBuilder) {

    var markerHeight = Math.max(Math.min(hit._source.properties.Exp_TIV / 200000, 100), 20);
    var pointOfInterest = Cesium.Cartographic.fromDegrees(
      hit._source.geometry.coordinates[0], hit._source.geometry.coordinates[1]);

    Cesium.sampleTerrain(viewer.terrainProvider, 9, [pointOfInterest])
      .then(function (samples) {
        viewer.entities.add({
          id: hit._source.properties.LocID,
          name: hit._source.properties.AccountName,
          position: Cesium.Cartesian3.fromDegrees(hit._source.geometry.coordinates[0], hit._source.geometry.coordinates[1], samples[0].height),
          billboard: {
            image: pinBuilder.fromText('' + hit._source.properties.LocID, Cesium.Color.ROYALBLUE, markerHeight).toDataURL(),
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM
          },
          description: '\
                        <p>\
                        Location: '+ hit._source.properties.AccountName + ' \
                        </p>\
                        <p>\
                        Location ID: '+ hit._source.properties.LocID + '\
                        </p>\
                        <p>\
                        Exposure: '+ hit._source.properties.Exp_TIV + '\
                        </p>\
                        <p>\
                        Coordinates: '+ hit._source.geometry.coordinates[0] + ', ' + hit._source.geometry.coordinates[1] + '\
                        </p>\
                        <p>\
                        Risk Score: '+ hit._source.properties.MR_RISK_SCORE + '\
                        </p>'
        });
      });



  }

  addToList(hit, element, del, viewer) {

    var locationlist = document.getElementById(element);
    var li = document.createElement("LI");
    li.style.width = "350px"



    var a = document.createElement('a');

    var linkText = document.createTextNode("" + hit._source.properties.AccountName);
    a.appendChild(linkText);
    a.title = "Location: " + hit._source.properties.AccountName;
    a.href = "#";
    a.onclick = function () {
      viewer.flyTo(viewer.entities.getById(hit._source.properties.LocID),
        {
          orientation: {
            heading: Cesium.Math.toRadians(175.0),
            pitch: Cesium.Math.toRadians(-35.0),
            roll: 0.0
          }
        }
      )
      return false;
    };
    li.appendChild(a);


    var att = document.createAttribute("id");
    att.value = "li " + hit._source.properties.LocID;
    li.setAttributeNode(att);
    if (del) {
      var btn = document.createElement("BUTTON");        // Create a <button> element
      var t = document.createTextNode("Delete");       // Create a text node
      btn.appendChild(t);

      btn.onclick = function () {
        deleteLocation(hit._source.properties.LocID)
      }


      li.appendChild(btn);

    }
    locationlist.appendChild(li)


    function deleteLocation(id) {
      this.client.delete({
        index: 'logstash-constant',
        type: 'warehouse',
        id: id
      }, function (error, response) {
        this.client.indices.refresh({
          index: 'logstash-constant'
        }, function (err, results) {

          //removePinMarker(id)
          removeFromList(id)
        }

        )
      });
    }

    function removePinMarker(id) {

      viewer.entities.remove(viewer.entities.getById(id))
    }
    function removeFromList(id) {
      var li = document.getElementById("li " + id);
      li.parentNode.removeChild(li);

    }
  }
  ngOnInit() {
    this.pinBuilder = new Cesium.PinBuilder();
    this.cesiumViewer = new Cesium.Viewer(this.cesiumContainer.nativeElement);
    this.cesiumViewer.scene.globe.enableLighting = true;
  }



}