class EditServiceLayerController {
  
  constructor($http,$timeout,state,Utils) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
    this.utils = Utils

    this.polygonOptions = {
      strokeColor: '#FF1493',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF1493',
      fillOpacity: 0.4,
    }

    this.selectedPolygonOptions = {
      strokeColor: '#000000',
      strokeOpacity: 0.8,
      strokeWeight: 3,
      fillColor: '#FF1493',
      fillOpacity: 0.4,
    }

    this.createdMapObjects = {}
    this.selectedMapObject = null
  }

  $onInit() {
    // We should have a map variable at this point
    if (!window[this.mapGlobalObjectName]) {
      console.error('ERROR:Edit service Layer component initialized, but a map object is not available at this time.')
      return
    }
    this.mapRef = window[this.mapGlobalObjectName]

    // Note we are using skip(1) to skip the initial value (that is fired immediately) from the RxJS stream.
    this.mapFeaturesSelectedEventObserver = this.state.mapFeaturesSelectedEvent.skip(1).subscribe((event) => {
      if (this.state.isRulerEnabled) return //disable any click action when ruler is enabled
      this.handleMapEntitySelected(event)
    })
  }

  handleMapEntitySelected(event) {
    if (!event || !event.latLng) {
      return
    }

    if (event.hasOwnProperty('serviceAreas')
      && event.serviceAreas.length > 0
      && event.serviceAreas[0].hasOwnProperty('code')) {
        this.getServiceAreaInfo(event.serviceAreas[0])
    } else {
      return
    }
  }

  getServiceAreaInfo(serviceArea) {
    return this.state.StateViewMode.loadEntityList(this.$http,this.state,'ServiceAreaView',serviceArea.id,'id,code,name,sourceId,geom','id')
    .then((result) => {
      var serviceAreaInfo = result[0]
      serviceAreaInfo.objectId = serviceArea.object_id
      this.createMapObject(serviceAreaInfo)
      .then(() => {
        this.selectedMapObject.setEditable(true)
        console.log("created a map object")
      })
      .catch((err) => console.error(err))
    })
  }

  createPolygonMapObject(feature) {
    // Create a "polygon" map object
    //this.tileDataService.addFeatureToExclude(feature.objectId)
    var polygonPath = []
    feature.geom.coordinates[0][0].forEach((polygonVertex) => {
      polygonPath.push({
        lat: polygonVertex[1],  // Note array index
        lng: polygonVertex[0]   // Note array index
      })
    })

    var polygon = new google.maps.Polygon({
      //objectId: feature.objectId, // Not used by Google Maps
      paths: polygonPath,
      clickable: true,
      draggable: false,
      map: this.mapRef
    })
    polygon.setOptions(this.polygonOptions)
    
    polygon.feature = feature
    
    return polygon
  }

  selectMapObject(mapObject) {
    // First de-select the currently selected map object (if any)
    if (this.selectedMapObject) {
        this.selectedMapObject.setOptions(this.polygonOptions)
        this.selectedMapObject.setEditable(false)
    }

    // Then select the map object
    if (mapObject) {  // Can be null if we are de-selecting everything
      mapObject.setOptions(this.selectedPolygonOptions)
      mapObject.setEditable(true)
    } else {
      //when deselected object close drop down if open
      //this.closeContextMenu()
    }
    this.selectedMapObject = mapObject
  }

  // Return true if the given path is a closed path
  isClosedPath(path) {
    const firstPoint = path.getAt(0)
    const lastPoint = path.getAt(path.length - 1)
    const deltaLat = Math.abs(firstPoint.lat() - lastPoint.lat())
    const deltaLng = Math.abs(firstPoint.lng() - lastPoint.lng())
    const TOLERANCE = 0.0001
    return (deltaLat < TOLERANCE) && (deltaLng < TOLERANCE)
  }

  createMapObject(feature) {
    return new Promise((resolve, reject) => {
      var mapObject = null
      if (feature.geom.type === 'MultiPolygon') {
        mapObject = this.createPolygonMapObject(feature)
        // Set up listeners on the map object
        mapObject.addListener('click', (event) => {
          // Select this map object
          this.selectMapObject(mapObject)
        })
        var self = this
        mapObject.getPaths().forEach(function (path, index) {
          google.maps.event.addListener(path, 'insert_at', function () {
            self.onModifyMapObject(mapObject)
          });
          google.maps.event.addListener(path, 'remove_at', function () {
            self.onModifyMapObject(mapObject)
          });
          google.maps.event.addListener(path, 'set_at', function () {
            if (!self.isClosedPath(path)) {
              // IMPORTANT to check if it is already a closed path, otherwise we will get into an infinite loop when trying to keep it closed
              if (index === 0) {
                // The first point has been moved, move the last point of the polygon (to keep it a valid, closed polygon)
                path.setAt(0, path.getAt(path.length - 1))
                self.onModifyMapObject(mapObject)
              } else if (index === path.length - 1) {
                // The last point has been moved, move the first point of the polygon (to keep it a valid, closed polygon)
                path.setAt(path.length - 1, path.getAt(0))
                self.onModifyMapObject(mapObject)
              }
            } else {
              self.onModifyMapObject(mapObject)
            }
          });
        });

        //mapObject.addListener('rightclick', (event) => {

        // 'event' contains a MouseEvent which we use to get X,Y coordinates. The key of the MouseEvent object
        // changes with google maps implementations. So iterate over the keys to find the right object.

        // ToDo: this kind of thing needs to be in the controller
        //console.log('rightclick editable object')
        //console.log(event)
        //   var eventXY = this.getXYFromEvent(event)
        //   this.updateContextMenu(event.latLng, eventXY.x, eventXY.y, mapObject)
        // })

        this.createdMapObjects[mapObject.feature.id] = mapObject
        this.selectMapObject(mapObject)
        return resolve()
      } else {
        return reject()
      }
    })
  }

  // Convert the paths in a Google Maps object into a Polygon WKT
  polygonPathsToWKT(paths) {
    var allPaths = []
    paths.forEach((path) => {
      var pathPoints = []
      path.forEach((latLng) => pathPoints.push([latLng.lng(), latLng.lat()]))
      allPaths.push(pathPoints)
    })
    return {
      type: 'MultiPolygon',
      coordinates: [allPaths]
    }
  }

  formatServiceLayerForService(mapObject) {
    // ToDo: this should use AroFeatureFactory
    var serviceFeature = {
      objectId: mapObject.feature.objectId,
      dataType: 'service_layer',
      geometry: this.polygonPathsToWKT(mapObject.getPaths()),
      attributes: {
        name: mapObject.feature.name,
        code: mapObject.feature.code
      }
    }
    return serviceFeature
  }

  onModifyMapObject(mapObject) {
    var serviceLayerFeature = this.formatServiceLayerForService(mapObject)
    this.$http.put(`/service/library/transaction/${this.currentTransaction.id}/features`, serviceLayerFeature)
    .catch((err) => console.error(err))
  }

  $onChanges(changesObj) {
    if (changesObj.currentTransaction) {}
  }

  $onDestroy() {
    this.mapFeaturesSelectedEventObserver.unsubscribe();
  }

}
  
EditServiceLayerController.$inject = ['$http','$timeout','state','Utils']

let editServiceLayer = {
  templateUrl: '/components/sidebar/plan-editor/edit-service-layer.html',
  bindings: {
    mapGlobalObjectName: '@',
    currentTransaction: '<'
  },
  controller: EditServiceLayerController
}

export default editServiceLayer