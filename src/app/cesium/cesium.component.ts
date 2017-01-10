import { Component, ElementRef, OnInit, Renderer, ViewChild } from '@angular/core';
import * as elasticsearch from 'elasticsearch';
import { ModalDirective } from 'ng2-bootstrap';

/**
 * This is my cesium comment
 */

@Component({
  selector: 'app-cesium',
  templateUrl: './cesium.component.html',
  styleUrls: ['./cesium.component.css']
})
export class CesiumComponent implements OnInit {
  @ViewChild('dash') dash:ElementRef;
  @ViewChild('cesiumContainer') cesiumContainer: ElementRef;
  @ViewChild('modal') public childModal: ModalDirective;
  NgbModule
  cesiumViewer: any;

  private _client: elasticsearch.Client
  pinBuilder: any;
  render: Renderer;
  public showChildModal(): void {

  }

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
    this.render = this.renderer;


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
      this._client.delete({
        index: 'logstash-constant',
        type: 'warehouse',
        id: id
      }, function (error, response) {
        this._client.indices.refresh({
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

  showModal() {

    let viewer = this.cesiumViewer

    var screenSpaceEventHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    screenSpaceEventHandler.setInputAction(function parseLatLon(position) {

      var mousePosition = new Cesium.Cartesian2(position.position.x, position.position.y);

      var cartesian = viewer.camera.pickEllipsoid(mousePosition, viewer.scene.globe.ellipsoid);

      var cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
      var longitudeString = Cesium.Math.toDegrees(cartographic.longitude).toFixed(2);
      var latitudeString = Cesium.Math.toDegrees(cartographic.latitude).toFixed(2);
      this.childModal.modal("show")

      var lat = this.mod.find('#loclat');
      var lon = this.mod.find('#loclon');

      lat.val(parseFloat(latitudeString));
      lon.val(parseFloat(longitudeString));


      screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK, Cesium.KeyboardEventModifier.ALT)
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK, Cesium.KeyboardEventModifier.ALT);






  }

  SelectArea() {
    let addToList = this.addToList;
    let dash = this.dash;
    let client = this._client;
    let render = this.render;
    var selector;
    let viewer = this.cesiumViewer
    var rectangleSelector = new Cesium.Rectangle();
    var screenSpaceEventHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    var cartesian = new Cesium.Cartesian3();
    var tempCartographic = new Cesium.Cartographic();
    var center = new Cesium.Cartographic();
    var firstPoint = new Cesium.Cartographic();
    var firstPointSet = false;
    var mouseDown = false;
    var camera = viewer.camera;
    var coords = [];

    viewerEventListener(addToList, client, render, dash)

    function viewerEventListener(addToList, client, render, dash) {
      viewerEventRemoveListener()


      //Draw the selector while the user drags the mouse while holding ALT
      screenSpaceEventHandler.setInputAction(function drawSelector(movement) {
        if (!mouseDown) {
          return;
        }

        cartesian = camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid, cartesian);

        if (cartesian) {
          //mouse cartographic
          tempCartographic = Cesium.Cartographic.fromCartesian(cartesian, Cesium.Ellipsoid.WGS84, tempCartographic);

          if (!firstPointSet) {
            Cesium.Cartographic.clone(tempCartographic, firstPoint);
            firstPointSet = true;
          }
          else {
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

        var longitudeString2 = Cesium.Math.toDegrees(rectangleSelector.east).toFixed(2);
        var latitudeString2 = Cesium.Math.toDegrees(rectangleSelector.north).toFixed(2);
        var longitudeString = Cesium.Math.toDegrees(rectangleSelector.west).toFixed(2);
        var latitudeString = Cesium.Math.toDegrees(rectangleSelector.south).toFixed(2);

        coords.push([parseFloat(longitudeString), parseFloat(latitudeString)], [parseFloat(longitudeString2), parseFloat(latitudeString2)])
        //deleteDashboardWarehouseChild()
        SelectAreaLocation(coords, addToList, client, viewer)
        //collapse()
        render.invokeElementMethod(dash.nativeElement, 'click', []);

      }, Cesium.ScreenSpaceEventType.LEFT_UP, Cesium.KeyboardEventModifier.ALT);

      var getSelectorLocation = new Cesium.CallbackProperty(function getSelectorLocation(time, result) {
        return Cesium.Rectangle.clone(rectangleSelector, result);
      }, false);


      selector = viewer.entities.add({
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
      viewer.entities.removeById('rectangleAreaSelect')
      screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP, Cesium.KeyboardEventModifier.ALT)
      screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK, Cesium.KeyboardEventModifier.ALT)
      screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN, Cesium.KeyboardEventModifier.ALT)
      screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE, Cesium.KeyboardEventModifier.ALT)

    }

    function SelectAreaLocation(c, addToList, client, viewer) {



      client.search({
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
          addToList(hit, "warehouse", false, viewer)
        })
        InsertWarehouseValue(response)
      })

    }
    function InsertWarehouseValue(result) {
      var node = document.createTextNode('Location Exp_TIV: ' + result.aggregations[1].value);


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
  ngOnInit() {
    this.pinBuilder = new Cesium.PinBuilder();
    this.cesiumViewer = new Cesium.Viewer(this.cesiumContainer.nativeElement);
    this.cesiumViewer.scene.globe.enableLighting = true;
  }



}