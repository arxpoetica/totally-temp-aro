app.service('CustomOverlay', function($http, $rootScope, selection) {

  // Based on https://developers.google.com/maps/documentation/javascript/customoverlays
  function CustomOverlay(map, elem, width, height, latLng, callback) {
    this.setMap(map);

    var div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.width = width+'px';
    div.style.height = height+'px';
    div.appendChild(elem);

    this.div_ = div;
    this.width_ = width;
    this.height_ = height;
    this.latLng_ = latLng;
    this.callback_ = callback;
  }

  CustomOverlay.prototype = new google.maps.OverlayView();

  CustomOverlay.prototype.onAdd = function() {
    var panes = this.getPanes();
    panes.floatPane.appendChild(this.div_);
    this.callback_ && this.callback_();
  }

  CustomOverlay.prototype.draw = function() {
    var overlayProjection = this.getProjection();
    var point = overlayProjection.fromLatLngToDivPixel(this.latLng_);
    var div = this.div_;
    div.style.left = (point.x - this.width_/2) + 'px';
    div.style.top = (point.y - this.height_/2) + 'px';
  }

  CustomOverlay.prototype.onRemove = function() {
    this.div_.parentNode.removeChild(this.div_);
  };

  // Set the visibility to 'hidden' or 'visible'.
  CustomOverlay.prototype.hide = function() {
    if (this.div_) {
      // The visibility property must be a string enclosed in quotes.
      this.div_.style.visibility = 'hidden';
    }
  };

  CustomOverlay.prototype.show = function() {
    if (this.div_) {
      this.div_.style.visibility = 'visible';
    }
  };

  CustomOverlay.prototype.toggle = function() {
    if (this.div_) {
      if (this.div_.style.visibility === 'hidden') {
        this.show();
      } else {
        this.hide();
      }
    }
  };

  // Detach the map from the DOM via toggleDOM().
  // Note that if we later reattach the map, it will be visible again,
  // because the containing <div> is recreated in the overlay's onAdd() method.
  CustomOverlay.prototype.toggleDOM = function() {
    if (this.getMap()) {
      // Note: setMap(null) calls OverlayView.onRemove()
      this.setMap(null);
    } else {
      this.setMap(this.map_);
    }
  };

  return CustomOverlay;

})
