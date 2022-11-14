// TODO: rework this to use `overlay-view.jsx` ???

// ------- from https://developers.google.com/maps/documentation/javascript/examples/delete-vertex-menu
/**
 * A menu that lets a user delete a selected vertex of a path.
 * @constructor
 */
function DeleteMenu() {
  this.div_ = document.createElement('div');
  this.div_.className = 'delete-menu';
  this.div_.innerHTML = 'Delete';

  var menu = this;
  google.maps.event.addDomListener(this.div_, 'click', function(event) {
    event.stopPropagation()
    menu.removeVertex();
  });
  // needed to prevent clicks passing through div
  google.maps.OverlayView.preventMapHitsAndGesturesFrom(this.div_)
}
DeleteMenu.prototype = new google.maps.OverlayView();

DeleteMenu.prototype.onAdd = function() {
  var deleteMenu = this;
  var map = this.getMap();
  this.getPanes().floatPane.appendChild(this.div_);

  // mousedown anywhere on the map except on the menu div will close the
  // menu.
  this.clickListener_ = google.maps.event.addDomListener(map.getDiv(), 'click', event => {
    //e.stopPropagation()
    if (event.target != deleteMenu.div_) {
      event.stopPropagation()
      deleteMenu.close()
      let callBack = this.get('callBack')
      if (callBack) {
        callBack()
      }
    }
  }, true);

  this.dragListener_ = google.maps.event.addDomListener(map.getDiv(), 'dragstart', event => {
    deleteMenu.close()
  }, true)
};

DeleteMenu.prototype.onRemove = function() {
  google.maps.event.removeListener(this.clickListener_);
  google.maps.event.removeListener(this.dragListener_);
  this.div_.parentNode.removeChild(this.div_);
  // clean up
  this.set('position');
  this.set('path');
  this.set('vertexPayload');
};

DeleteMenu.prototype.close = function() {
  this.setMap(null);
};

DeleteMenu.prototype.draw = function() {
  var position = this.get('position');
  var projection = this.getProjection();

  if (!position || !projection) {
    return;
  }

  var point = projection.fromLatLngToDivPixel(position);
  this.div_.style.top = point.y + 'px';
  this.div_.style.left = point.x + 'px';
};

/**
 * Opens the menu at a vertex of a given path.
 */
DeleteMenu.prototype.open = function(map, path, position, vertexPayload, callBack, repeatable=false) {
  this.close()
  this.set('position', position);
  this.set('path', path);
  this.set('vertexPayload', vertexPayload);
  this.set('callBack', callBack);
  this.set('repeatable', repeatable)

  if (vertexPayload.length > 1) {
    this.div_.innerHTML = "Delete All"
  } else {
    this.div_.innerHTML = "Delete"
  }
  this.setMap(map);
  this.draw();
};

/**
 * Deletes the vertex from the path.
 */
DeleteMenu.prototype.removeVertex = function() {
  var path = this.get('path');
  var vertexPayload = this.get('vertexPayload');
  let callBack = this.get('callBack')
  const repeatable = this.get('repeatable')

  if (!path || (vertexPayload == undefined || vertexPayload.length === 0)) {
    this.close();
    return;
  }

  if (vertexPayload.length) {
    vertexPayload.sort((a, b) => {
      return Number(b.title) - Number(a.title)
    })
    vertexPayload.forEach(marker => {
      if (marker && marker.title && path.getLength() > 3) {
        path.removeAt(Number(marker.title))
      }
    })
    if (callBack) {
      callBack()
    }
  } else {
    if (path.getLength() > 3) path.removeAt(vertexPayload);
  }

  if (!repeatable) this.close();
};

export default DeleteMenu
