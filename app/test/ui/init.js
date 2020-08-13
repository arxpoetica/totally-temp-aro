/* global angular google */
var app = angular.module('aro', []) // eslint-disable-line
var map // eslint-disable-line

function initialize () {
  var styles = [{
    featureType: 'poi',
    elementType: 'labels',
    stylers: [ { visibility: 'off' } ]
  }]

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
    clickableIcons: false, 
    clickableLabels:false
  })
}

google.maps.event.addDomListener(window, 'load', initialize)

var expect = chai.expect // eslint-disable-line
