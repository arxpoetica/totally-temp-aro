import Constants from '../../common/constants'

class ServiceLayerEditorController {
  constructor ($http, $timeout, state, Utils) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
    this.utils = Utils
    this.Constants = Constants

    this.discardChanges = false
    this.currentTransaction = null

    this.serviceLayerName = null
    this.serviceLayerCode = null

    this.objectIdToMapObject = {}
    this.selectedMapObject = null
  }

  $onInit () {
    this.resumeOrCreateTransaction()
  }

  // Convert the paths in a Google Maps object into a Polygon WKT
  polygonPathsToWKT (paths) {
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

  formatServiceLayerForService (mapObject) {
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

  handleObjectCreated (mapObject, usingMapClick, feature) {
    this.objectIdToMapObject[mapObject.objectId] = mapObject
    // this.updateObjectIdsToHide()

    // Create New SA
    if (!mapObject.feature.isExistingObject) {
      mapObject.feature.name = this.serviceLayerName
      mapObject.feature.code = this.serviceLayerCode
      var serviceLayerFeature = this.formatServiceLayerForService(mapObject)
      // send serviceLayer feature to service
      this.$http.post(`/service/library/transaction/${this.currentTransaction.id}/features`, serviceLayerFeature)
    }

    this.$timeout()
  }

  handleSelectedObjectChanged (mapObject) {
    if (this.currentTransaction == null) return
    if (mapObject != null) {
      this.updateSelectedState(mapObject)
    }
    this.selectedMapObject = mapObject
    this.$timeout()
  }

  handleObjectModified (mapObject) {
    // const boundaryProperties = this.objectIdToProperties[mapObject.objectId]
    var serviceLayerFeature = this.formatServiceLayerForService(mapObject)
    this.$http.put(`/service/library/transaction/${this.currentTransaction.id}/features`, serviceLayerFeature)
      .catch((err) => console.error(err))
    this.$timeout()
  }

  handleObjectDroppedOnMarker (eventArgs) {
    console.log(eventArgs)
  }

  handleObjectDeleted (mapObject) {
    this.$http.delete(`/service/library/transaction/${this.currentTransaction.id}/features/${mapObject.objectId}`)
  }

  updateSelectedState (selectedFeature) {
    var newSelection = this.state.cloneSelection()
    newSelection.editable.serviceArea = {}
    if (typeof selectedFeature !== 'undefined') {
      newSelection.editable.serviceArea[selectedFeature.object_id || selectedFeature.objectId] = selectedFeature
    }
    this.state.selection = newSelection
  }

  isBoundaryCreationAllowed (mapObject) {
    return false
  }

  resumeOrCreateTransaction () {
    this.currentTransaction = null
    // See if we have an existing transaction for the currently selected location library
    var selectedLibraryItem = this.state.dataItems.service_layer.selectedLibraryItems[0]
    this.$http.get(`/service/library/transaction?user_id=${this.state.loggedInUser.id}`)
      .then((result) => {
        var existingTransactions = result.data.filter((item) => item.libraryId === selectedLibraryItem.identifier)
        if (existingTransactions.length > 0) {
          // We have an existing transaction for this library item. Use it.
          return Promise.resolve({ data: existingTransactions[0] })
        } else {
          // Create a new transaction and return it
          return this.$http.post('/service/library/transaction', {
            libraryId: selectedLibraryItem.identifier,
            userId: this.state.loggedInUser.id
          })
        }
      })
      .then((result) => {
        this.discardChanges = false
        this.currentTransaction = result.data
      })
      .catch((err) => {
        this.discardChanges = false
        this.state.selectedDisplayMode.next(this.state.displayModes.VIEW)
        this.$timeout()
        console.warn(err)
      })
  }

  commitTransaction () {
    this.$http.put(`/service/library/transaction/${this.currentTransaction.id}`)
      .then((result) => {
      // Transaction has been committed, start a new one
        this.discardChanges = true
        this.currentTransaction = null
        this.state.recreateTilesAndCache()
        return this.resumeOrCreateTransaction()
      })
      .catch((err) => {
        this.discardChanges = true
        this.currentTransaction = null
        this.state.recreateTilesAndCache()
        this.state.activeViewModePanel = this.state.viewModePanels.LOCATION_INFO // Close out this panel
        this.$timeout()
        console.error(err)
      })
  }

  discardTransaction () {
    swal({
      title: 'Delete transaction?',
      text: `Are you sure you want to delete transaction with ID ${this.currentTransaction.id} for library ${this.currentTransaction.libraryName}`,
      type: 'warning',
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Yes, discard',
      cancelButtonText: 'No',
      showCancelButton: true,
      closeOnConfirm: true
    }, (deleteTransaction) => {
      if (deleteTransaction) {
        // The user has confirmed that the transaction should be deleted
        this.$http.delete(`/service/library/transaction/${this.currentTransaction.id}`)
          .then((result) => {
            // Transaction has been discarded, start a new one
            this.discardChanges = true
            this.currentTransaction = null
            this.state.recreateTilesAndCache()
            return this.resumeOrCreateTransaction()
          })
          .catch((err) => {
            this.discardChanges = true
            this.currentTransaction = null
            this.state.activeViewModePanel = this.state.viewModePanels.LOCATION_INFO // Close out this panel
            this.$timeout()
            console.error(err)
          })
      }
    })
  }

  // Returns a promise that resolves to the iconUrl for a given object id
  getObjectIconUrl (eventArgs) {
    if (eventArgs.objectKey === Constants.MAP_OBJECT_CREATE_SERVICE_AREA) {
      // Icon doesn't matter for Service area, just return an empty string
      return Promise.resolve('')
    }
    return Promise.reject(`Unknown object key ${eventArgs.objectKey}`)
  }

  markSelectedServiceAreaPropertiesDirty () {
    if (this.selectedMapObject) {
      var objectProperties = this.objectIdToMapObject[this.selectedMapObject.objectId]
      objectProperties.isDirty = true
    }
  }

  // Saves the properties of the selected service area
  saveSelectedServiceAreaProperties () {
    if (this.selectedMapObject) {
      var serviceLayerFeature = this.formatServiceLayerForService(this.selectedMapObject)
      this.$http.put(`/service/library/transaction/${this.currentTransaction.id}/features`, serviceLayerFeature)
        .then((result) => {
          this.objectIdToMapObject[this.selectedMapObject.objectId].isDirty = false
          this.$timeout()
        })
        .catch((err) => console.error(err))
    }
  }

  // $onChanges(changesObj) {

  // }

  // $onDestroy() {

  // }
}

ServiceLayerEditorController.$inject = ['$http', '$timeout', 'state', 'Utils']

let serviceLayerEditor = {
  templateUrl: '/components/sidebar/plan-editor/service-layer-editor.html',
  controller: ServiceLayerEditorController
}

export default serviceLayerEditor
