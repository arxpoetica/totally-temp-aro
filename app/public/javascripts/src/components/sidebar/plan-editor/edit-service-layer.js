import Constants from '../../common/constants'

class EditServiceLayerController {
  
  constructor($http,$timeout,state,Utils) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
    this.utils = Utils
    
    this.createdMapObjects = {}
    this.objectIdToMapObject = {}
    this.selectedMapObject = null
  }

  $onInit() {
    // We should have a map variable at this point
    if (!window[this.mapGlobalObjectName]) {
      console.error('ERROR:Edit service Layer component initialized, but a map object is not available at this time.')
      return
    }
    this.mapRef = window[this.mapGlobalObjectName]
  }

  // Returns a promise that resolves to the iconUrl for a given object id
  getObjectIconUrl(eventArgs) {
    if (eventArgs.objectKey === Constants.MAP_OBJECT_CREATE_SERVICE_AREA) {
      // Icon doesn't matter for Service area, just return an empty string
      return Promise.resolve('')
    }
    return Promise.reject(`Unknown object key ${eventArgs.objectKey}`)
  }

  handleObjectCreated(mapObject, usingMapClick, feature) {
    this.objectIdToMapObject[mapObject.objectId] = mapObject
    //this.updateObjectIdsToHide()
    this.$timeout()
  }

  handleSelectedObjectChanged(mapObject) {
    if (null == this.currentTransaction) return    
    this.selectedMapObject = mapObject
    this.$timeout()
  }

  handleObjectModified(mapObject) {
    //const boundaryProperties = this.objectIdToProperties[mapObject.objectId]
    var serviceLayerFeature = this.formatServiceLayerForService(mapObject)
    this.$http.put(`/service/library/transaction/${this.currentTransaction.id}/features`, serviceLayerFeature)
      .catch((err) => console.error(err))
    this.$timeout()
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

  isBoundaryCreationAllowed(mapObject){
    return false
  }

  handleObjectDeleted(mapObject) {
    this.$http.delete(`/service/library/transaction/${this.currentTransaction.id}/features/${mapObject.objectId}`)
  }

  $onChanges(changesObj) {
    if (changesObj.currentTransaction) {}
  }

  $onDestroy() {
    this.mapFeaturesSelectedEventObserver && this.mapFeaturesSelectedEventObserver.unsubscribe();
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