/**
 * Created by saneesh on 13/2/17.
 */

STREET_APP.service("MapLayer" , ['$rootScope', function ($rootScope) {

    function MapLayerLocal(Data) {
        this.children = [];
        this.setData(Data);
    }

    MapLayerLocal.prototype = {
        layerChecked: true,
        setData : function (data) {
            this.parseData(data);
        },
        parseData : function (data) {
            angular.extend(this , data);
        },
        showHideLayer : function () {
            if(this.layerChecked){
                this.show()
            }else {
                this.hide()
            }
        },
        show : function () {
            var children = this.children;
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                child.setVisible(true);
            }
        },
        hide : function () {
            var children = this.children;
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                child.setVisible(false);
            }
        },
        getLayerName : function () {
            return this.layer;
        },
        getLayerIcon : function () {
            return this.icon;
        },
        addChild : function (child) {
            var map = this.map;

            var marker = new google.maps.Marker({
                position:  new google.maps.LatLng(child.lat,child.lon),
                map: map,
                draggable: true,
                icon: this.getLayerIcon(),
                title: this.getLayerName()
            });

            // When the marker is clicked, fire an event with the lat long coordinates
            marker.addListener('click', function() {
                $rootScope.$broadcast('marker_clicked', {
                    title: marker.getTitle(),
                    lat: marker.getPosition().lat(),
                    lng: marker.getPosition().lng()
                });
            });
            google.maps.event.addListener(marker, 'dragend', function(event) {
                console.log(marker.getPosition().lat() + ", " + marker.getPosition().lng());
            });
            this.children.push(marker);
        },
        setMap :function (map) {
            this.map = map;
        }
    }

    return MapLayerLocal;

}]);