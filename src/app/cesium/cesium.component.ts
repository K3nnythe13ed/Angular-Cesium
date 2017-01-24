import { Component, ElementRef, OnInit, Renderer, ViewChild } from '@angular/core';
import * as elasticsearch from 'elasticsearch';
import { ModalDirective } from 'ng2-bootstrap';
import { CObject } from './cesium.object';
import { VesselService } from './vessel.service';
import { Vessel, VesselList } from './cesium.model';


/**
 * This is my cesium comment
 */

@Component({
  selector: 'app-cesium',
  templateUrl: './cesium.component.html',
  styleUrls: ['./cesium.component.css']
})
export class CesiumComponent implements OnInit {
  @ViewChild('dash') dash: ElementRef;
  @ViewChild('cesiumContainer') cesiumContainer: ElementRef;
  cesiumViewer: any;

  private _client: elasticsearch.Client
  pinBuilder: any;
  render: Renderer;
  CesiumObject: CObject;


  constructor(public element: ElementRef, private renderer: Renderer, private VesselService: VesselService) {
    Cesium.BingMapsApi.defaultKey = 'AroazdWsTmTcIx4ZE3SIicDXX00yEp9vuRZyn6pagjyjgS-VdRBfBNAVkvrucbqr';
    (<any>window).CESIUM_BASE_URL = '/assets/Cesium';

    this._client = new elasticsearch.Client({
      host: 'localhost:9200'
    });
  }

  ngAfterViewInit() {


    let terrainProvider = new Cesium.CesiumTerrainProvider({
      url: '//assets.agi.com/stk-terrain/world',
      requestWaterMask: true
    });
    let CesiumObject = new CObject();
    CesiumObject.viewer = this.cesiumViewer;
    CesiumObject.client = this._client;
    CesiumObject.render = this.render;
    CesiumObject.pinBuilder = this.pinBuilder;
    this.CesiumObject = CesiumObject;
    this.cesiumViewer.terrainProvider = terrainProvider;
    
    let marker = this.newMarkerOnMap;
    let addToList = this.addToList;
    this.VesselService.LoadVessels();

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
          marker(hit, CesiumObject);
          addToList(hit, "locationlist", true, CesiumObject)
        })
        console.log('All is well');

      }
    });
    this.render = this.renderer;


  }
  newMarkerOnMap(hit, CesiumObject) {

    let markerHeight = Math.max(Math.min(hit._source.properties.Exp_TIV / 200000, 100), 20);
    let pointOfInterest = Cesium.Cartographic.fromDegrees(
      hit._source.geometry.coordinates[0], hit._source.geometry.coordinates[1]);

    Cesium.sampleTerrain(CesiumObject.viewer.terrainProvider, 9, [pointOfInterest])
      .then(function (samples) {
        CesiumObject.viewer.entities.add({
          id: hit._source.properties.LocID,
          name: hit._source.properties.AccountName,
          position: Cesium.Cartesian3.fromDegrees(hit._source.geometry.coordinates[0], hit._source.geometry.coordinates[1], samples[0].height),
          billboard: {
            image: CesiumObject.pinBuilder.fromText('' + hit._source.properties.LocID, Cesium.Color.ROYALBLUE, markerHeight).toDataURL(),
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

  addToList(hit, element, del, CesiumObject) {

    var locationlist = document.getElementById(element);
    var li = document.createElement("LI");
    li.style.width = "350px"



    var a = document.createElement('a');

    var linkText = document.createTextNode("" + hit._source.properties.AccountName);
    a.appendChild(linkText);
    a.title = "Location: " + hit._source.properties.AccountName;
    a.href = "#";
    a.onclick = function () {
      CesiumObject.viewer.flyTo(CesiumObject.viewer.entities.getById(hit._source.properties.LocID),
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
        deleteLocation(hit._source.properties.LocID, CesiumObject.client)
      }


      li.appendChild(btn);

    }
    locationlist.appendChild(li)


    function deleteLocation(id, client) {
      client.delete({
        index: 'logstash-constant',
        type: 'warehouse',
        id: id
      }, function (error, response) {
        client.indices.refresh({
          index: 'logstash-constant'
        }, function (err, results) {

          removePinMarker(id)
          removeFromList(id)
        }

        )
      });
    }

    function removePinMarker(id) {

      CesiumObject.viewer.entities.remove(CesiumObject.viewer.entities.getById(id))
    }
    function removeFromList(id) {
      var li = document.getElementById("li " + id);
      li.parentNode.removeChild(li);

    }
  }

  showModal() {
    let viewer = this.CesiumObject.viewer;

    let screenSpaceEventHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    screenSpaceEventHandler.setInputAction(function parseLatLon(position) {

      let mousePosition = new Cesium.Cartesian2(position.position.x, position.position.y);

      let cartesian = viewer.camera.pickEllipsoid(mousePosition, viewer.scene.globe.ellipsoid);

      let cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
      let longitudeString = Cesium.Math.toDegrees(cartographic.longitude).toFixed(8);
      let latitudeString = Cesium.Math.toDegrees(cartographic.latitude).toFixed(8);

      let mod = (<any>$('#MyModal'));
      mod.modal('show');

      let lat = mod.find('#loclat');
      let lon = mod.find('#loclon');

      lat.val(parseFloat(latitudeString));
      lon.val(parseFloat(longitudeString));


      screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK, Cesium.KeyboardEventModifier.ALT)
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK, Cesium.KeyboardEventModifier.ALT);

  }
  SaveData() {
    let CesiumObject = this.CesiumObject;
    let addToList = this.addToList;
    let newMarkerOnMap = this.newMarkerOnMap
    let mod = (<any>$('#MyModal'));
    let lat = mod.find('#loclat')["0"].value;
    let lon = mod.find('#loclon')["0"].value;
    let name = mod.find('#locname')["0"].value;
    let id = mod.find('#locid')["0"].value;
    let risc = mod.find('#locrisc')["0"].value;
    let exp = mod.find('#locexp')["0"].value;
    let oe = mod.find('#locoe')["0"].value;
    let today = new Date();
    let hit = {
        "@timestamp": today,
        "exposure": exp,
        "geometry": {
          "coordinates": [
            lon,
            lat
          ],
          "type": "Point"
        },
        "id": id,
        "properties": {
          "AAL_PreCat_EQ": "",
          "AAL_PreCat_WS": "",
          "ML_AGCS_Share": "",
          "Entire": ", " + oe + ",  0,  0,  0",
          "Exp_TIV": exp,
          "OE": oe,
          "MR_RISK_SCORE": risc,
          "LocID": id,
          "AAL_PreCat_FL": "",
          "AddrMatch": "",
          "AccountName": name
        }
      }
    CesiumObject.client.index({
      index: 'logstash-constant',
      type: 'warehouse',
      id: id,
      body: hit
    }, function (err, results) {
      CesiumObject.client.indices.refresh({
        index: 'logstash-constant'
      }, function (err, res) {
        CesiumObject.client.get({
                index: 'logstash-constant',
                type: 'warehouse',
                id: id
            }, function (err, response) {
                newMarkerOnMap(response, CesiumObject);
                addToList(response, 'locationlist', true, CesiumObject);
            })
        
      })
    
    });
    (<any>$('#MyModal')).modal('hide');
  }

SelectArea() {
  let addToList = this.addToList;
  let dash = this.dash;
  let CesiumObject = this.CesiumObject;
  let selector;
  let rectangleSelector = new Cesium.Rectangle();
  let screenSpaceEventHandler = new Cesium.ScreenSpaceEventHandler(CesiumObject.viewer.scene.canvas);
  let cartesian = new Cesium.Cartesian3();
  let tempCartographic = new Cesium.Cartographic();
  let center = new Cesium.Cartographic();
  let firstPoint = new Cesium.Cartographic();
  let firstPointSet = false;
  let mouseDown = false;
  let camera = CesiumObject.viewer.camera;
  let coords = [];

  viewerEventListener(addToList, CesiumObject, dash)
  function viewerEventListener(addToList, CesiumObject, dash) {
    viewerEventRemoveListener();

    screenSpaceEventHandler.setInputAction(function drawSelector(movement) {
      if (!mouseDown) {
        return;
      }

      cartesian = camera.pickEllipsoid(movement.endPosition, CesiumObject.viewer.scene.globe.ellipsoid, cartesian);

      if (cartesian) {
        tempCartographic = Cesium.Cartographic.fromCartesian(cartesian, Cesium.Ellipsoid.WGS84, tempCartographic);

        if (!firstPointSet) {
          Cesium.Cartographic.clone(tempCartographic, firstPoint);
          firstPointSet = true;
        }
        // tslint:disable-next-line:one-line
        else{
          rectangleSelector.east = Math.max(tempCartographic.longitude, firstPoint.longitude);
          rectangleSelector.west = Math.min(tempCartographic.longitude, firstPoint.longitude);
          rectangleSelector.north = Math.max(tempCartographic.latitude, firstPoint.latitude);
          rectangleSelector.south = Math.min(tempCartographic.latitude, firstPoint.latitude);
          selector.show = true;

        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE, Cesium.KeyboardEventModifier.ALT);

    screenSpaceEventHandler.setInputAction(function startClickALT() {
      mouseDown = true;
      coords = []
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN, Cesium.KeyboardEventModifier.ALT);

    screenSpaceEventHandler.setInputAction(function endClickALT() {
      mouseDown = false;
      firstPointSet = false;

      let longitudeString2 = Cesium.Math.toDegrees(rectangleSelector.east).toFixed(2);
      let latitudeString2 = Cesium.Math.toDegrees(rectangleSelector.north).toFixed(2);
      let longitudeString = Cesium.Math.toDegrees(rectangleSelector.west).toFixed(2);
      let latitudeString = Cesium.Math.toDegrees(rectangleSelector.south).toFixed(2);

      coords.push([parseFloat(longitudeString), parseFloat(latitudeString)], [parseFloat(longitudeString2), parseFloat(latitudeString2)])
      //deleteDashboardWarehouseChild()
      SelectAreaLocation(coords, addToList, CesiumObject)
      //collapse()
      // render.invokeElementMethod(dash.nativeElement, 'click', []);
      // document.getElementById('dash').click(); works aswell

    }, Cesium.ScreenSpaceEventType.LEFT_UP, Cesium.KeyboardEventModifier.ALT);

    let getSelectorLocation = new Cesium.CallbackProperty(function getSelectorLocation(time, result) {
      return Cesium.Rectangle.clone(rectangleSelector, result);
    }, false);


    selector = CesiumObject.viewer.entities.add({
      id: 'rectangleAreaSelect',
      name: 'Selected Area',
      selectable: false,
      show: false,
      rectangle: {
        coordinates: getSelectorLocation,
        material: Cesium.Color.PURPLE.withAlpha(0.5),
        height: 50
      },
      description: 'Area Selected'
    });

  }


  function viewerEventRemoveListener() {
    //deleteDashboardChild()
    //deleteDashboardWarehouseChild()
    CesiumObject.viewer.entities.removeById('rectangleAreaSelect');
    screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP, Cesium.KeyboardEventModifier.ALT)
    screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK, Cesium.KeyboardEventModifier.ALT)
    screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN, Cesium.KeyboardEventModifier.ALT)
    screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE, Cesium.KeyboardEventModifier.ALT)

  }

  function SelectAreaLocation(c, addToList, CesiumObject) {



    CesiumObject.client.search({
      index: 'logstash-constant',
      type: 'warehouse',
      body: {
        "size": 1000,
        "query": {
          "bool": {
            "must": [
              {
                "geo_shape": {
                  "geometry": {
                    "shape": {
                      "type": "envelope",
                      "coordinates": [
                        [c[0][0], c[0][1]], [c[1][0], c[1][1]]
                      ]
                    },
                    "relation": "within"
                  }
                }
              }
            ]

          }
        },
        "aggs": {
          "1": {
            "sum": {
              "field": "exposure"
            }
          }
        }
      }
    }, function getMoreUntilDone(error, response) {

      response.hits.hits.forEach(function (hit) {
        addToList(hit, 'warehouse', false, CesiumObject)
      });
      InsertWarehouseValue(response)
    });

  }
  function InsertWarehouseValue(result) {
    let node = document.createTextNode('Location Exp_TIV: ' + result.aggregations[1].value);


    if (document.getElementById('WarehouseValue')) {
      var li = document.getElementById('WarehouseValue')
      li.removeChild(li.firstChild);
    }
    else {
      var li = document.createElement("LI");
      var att = document.createAttribute("id");
      att.value = "WarehouseValue"

      li.setAttributeNode(att);
    }
    li.appendChild(node);
    var root = document.getElementById('dashboard');

    root.insertBefore(li, root.childNodes[0])

  }

  
}
Toggle()
{
  this.CesiumObject.viewer.scene.globe.enableLighting = !(this.cesiumViewer.scene.globe.enableLighting)
}
ngOnInit() {
  this.pinBuilder = new Cesium.PinBuilder();
  this.cesiumViewer = new Cesium.Viewer(this.cesiumContainer.nativeElement);
  this.cesiumViewer.scene.globe.enableLighting = true;
}



}