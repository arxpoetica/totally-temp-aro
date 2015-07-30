var app = angular.module('aro', []);
var map;

function initialize() {
  var styles = [{
    featureType: 'poi',
    elementType: 'labels',
    stylers: [ { visibility: 'off' } ],
  }];

  map = new google.maps.Map(document.getElementById('map-canvas'), {
    zoom: 12,
    center: {lat: 47.6097, lng: -122.3331}, // Centroid of Seattle, WA
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    panControl: false,
    zoomControlOptions: {
      style: google.maps.ZoomControlStyle.SMALL,
      position: google.maps.ControlPosition.TOP_RIGHT
    },
    mapTypeControlOptions: {
      position: google.maps.ControlPosition.TOP_RIGHT
    },
    styles: styles,
  });
}

google.maps.event.addDomListener(window, 'load', initialize);

var expect = chai.expect;
