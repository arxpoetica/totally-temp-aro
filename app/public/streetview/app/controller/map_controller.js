/**
 * Created by saneesh on 13/2/17.
 */

function MapsController($scope, $rootScope , $timeout , $compile, $uibModal, MapLayer, $templateCache){

    $scope.selectedMarkerDetails = null;

    var mapsControllerScope = this;

    layersModal = null;
    $scope.openLayersModal = function() {
        layersModal = $uibModal.open({
            templateUrl: 'views/layers_modal.html',
            controller: function($scope, $rootScope) {
                $scope.mapLayers = mapsControllerScope.mapLayers;
                $scope.lobDescriptions = [
                    'VzT',
                    'VzB',
                    'VzW',
                    'XO'
                ];
                $scope.closeModal = function() {
                    if (layersModal) {
                        layersModal.close();
                        layersModal = null;
                    }
                }
            }
        });
    };
    $rootScope.$on('marker_clicked', function( event, markerDetails ) {
        console.log(mapsControllerScope.getMapLayer(markerDetails.layer));
        $scope.selectedMarkerDetails = markerDetails;
        $scope.$apply();
    });
    var ctx = {
        mapLayers:[],
        showAddDialog: false,
        markerType:'manhole',
        initMap : function () {
           $timeout(function () {
               var astorPlace = this.mapCenter = {lat: 42.376178, lng: -71.238991}; // WALTHAM
               this.map = new google.maps.Map(document.getElementById('mapView'), {
                   center: astorPlace,
                   zoom: 18,
                   disableDefaultUI: true, // a way to quickly hide all controls
                   mapTypeControl: true,
                   scaleControl: false,
                   zoomControl: true,
                   streetViewControl: false,
                   zoomControlOptions: {
                       style: google.maps.ZoomControlStyle.LARGE
                   }
               });
               this._generateStreetView();
               this._generateLayers();

               this._createControls();
               this.toggleView = true;
           }.bind(this), 100);
        },
        _createControls : function () {
            var map = this.map;

            //add togglelayers to botn
            var template = $templateCache.get('layertoggle.html');
        },
        _generateStreetView: function () {
            var panorama = this.streetView = this.map.getStreetView();
            panorama.setPosition(this.mapCenter);
            panorama.setPov(/** @type {google.maps.StreetViewPov} */({
                heading: 265,
                pitch: 0
            }));
            panorama.setVisible(true);
        },
        toStreetView : function () {
            this.streetView.setVisible(true);
            this.toggleView = true;
        },
        toMapView : function () {
            this.streetView.setVisible(false);
            this.toggleView = false;
        },
        _generateLayers : function () {
            var layers = $rootScope.METADATA.metaData;
            var mapData = $rootScope.DATA.markers;

            for (var i = 0; i < layers.length; i++) {
                var layer = layers[i];
                var mapLayer = new MapLayer(layer);
                mapLayer.setMap(this.map);
                for (var j = 0; j < mapData.length; j++) {
                    var data = mapData[j];
                    if(data.layer == mapLayer.getLayerName()){
                        mapLayer.addChild(data);
                    }
                }
                this.mapLayers.push(mapLayer);
                $scope.$apply();
            }
        },
        addMarker : function () {
            var panorama = this.streetView;
            var heading  = panorama.getPov().heading;
            var distance = 40 * 0.0000089; //feet
            var position = panorama.getPosition();

            console.log("Heading : " + heading);
            console.log("Position : " +  position);

            var xy = findNewPoint(position.lat() , position.lng() , heading , distance);
            var layer = this.getMapLayer(this.markerType)[0];
            this.addTempMarker(xy , layer);

        },
        showDialog : function () {
            if(this.showAddDialog){
                this.showAddDialog = false;

                this.cancelMarker();
                return;
            }
           this.showAddDialog = true;

            this.addMarker();
        },
        saveMarker : function () {
            this.showAddDialog = false;
            this.removeTempMarker();
        },
        cancelMarker : function () {
            this.showAddDialog = false;
            this.tempMarker.setMap(null);

            this.removeTempMarker();
        },
        getMapLayer : function (name) {
           return  this.mapLayers.filter(function (layer) {
                return layer.getLayerName() == name;
            })[0]
        },
        markerTypeChanged : function () {
            this.tempMarker.setMap(null);
            var layer = this.getMapLayer(this.markerType);
            this.addTempMarker(this.tempMarkerLoc , layer);

        },
        removeTempMarker : function () {
            delete this.tempMarker;
            delete this.tempMarkerLoc;
        },
        addTempMarker : function (xy , layer) {
            this.tempMarkerLoc = xy;
            this.tempMarker = layer.addChild({
                layer: this.markerType,
                lat: xy.x,
                lon: xy.y
            })
        }
    };

    angular.extend(this,ctx);
    console.log($scope);
}

STREET_APP.controller("MapController", MapsController);

function findNewPoint(x, y, angle, distance) {
    var result = {};

    result.x = distance * Math.cos((angle * Math.PI)/180) + x;
    result.y = distance * Math.sin((angle * Math.PI)/180) + y;

    return result;
}