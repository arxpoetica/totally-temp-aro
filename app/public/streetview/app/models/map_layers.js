/**
 * Created by saneesh on 13/2/17.
 */

STREET_APP.service("MapLayer" , [function () {

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

            // var image = {
            //     url: this.getLayerIcon(),
            //     // This marker is 20 pixels wide by 32 pixels high.
            //     size: new google.maps.Size(25, 25),
            //     // The origin for this image is (0, 0).
            //     origin: new google.maps.Point(0, 0),
            //     // The anchor for this image is the base of the flagpole at (0, 32).
            //     scaledSize: new google.maps.Size(25, 25)
            // };

            var marker = new google.maps.Marker({
                position:  new google.maps.LatLng(child.lat,child.lon),
                map: map,
                icon: this.getLayerIcon(),
                title: this.getLayerName()
            });
            this.children.push(marker);
        },
        setMap :function (map) {
            this.map = map;
        }
    }

    return MapLayerLocal;

}]);