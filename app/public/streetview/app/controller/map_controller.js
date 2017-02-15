/**
 * Created by saneesh on 13/2/17.
 */

function MapsController($scope,$rootScope , $timeout , $compile ,MapLayer,$templateCache){

    $scope.toggleView = false;
    var ctx = {
        mapLayers:[],
        toggleStreetView : function () {
            $scope.toggleView = !$scope.toggleView;
            if($scope.toggleView){
                this.toStreetView();
            }else{
                this.toMapView();
            }
        },
        initMap : function () {
           $timeout(function () {
               var astorPlace = this.mapCenter = {lat: 42.343156, lng: -71.087586};
               this.map = new google.maps.Map(document.getElementById('mapView'), {
                   center: astorPlace,
                   zoom: 18,
                   disableDefaultUI: true, // a way to quickly hide all controls
                   mapTypeControl: false,
                   scaleControl: false,
                   zoomControl: false,
                   streetViewControl: false,
                   zoomControlOptions: {
                       style: google.maps.ZoomControlStyle.LARGE
                   }
               });
               this._generateStreetView();
               this._generateLayers();

               this._createControls();
           }.bind(this), 100);
        },
        _createControls : function () {
            var map = this.map;

            //add togglelayers to botn
            var template = $templateCache.get('layertoggle.html');

            var toggelControl = '<div>'+'<button class="btn btn-md btn-toggleView" ng-click="maps.toggleStreetView()"> Toggle StreetView</button>' + template.trim()+'</div>';
            map.controls[google.maps.ControlPosition.TOP_RIGHT].push($compile($(toggelControl))($scope)[0]);

            //add panorama controls
            var panControl = '<div><button class="btn btn-md btn-toggleView" ng-click="maps.toggleStreetView()"> Toggle MapView</button>' + template.trim()+'</div>';
            this.streetView.controls[google.maps.ControlPosition.TOP_RIGHT].push($compile($(panControl))($scope)[0]);

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
        },
        toMapView : function () {
            this.streetView.setVisible(false);
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

        }
    };

    angular.extend(this,ctx);
}

STREET_APP.controller("MapController", MapsController);