import { createSelector } from 'reselect'

import WorkflowState from '../../../shared-utils/workflow-state'
import MapLayerActions from '../../../react/components/map-layers/map-layer-actions'

// We need a selector, else the .toJS() call will create an infinite digest loop
const getAllLocationLayers = state => state.mapLayers.location
const getLocationLayersList = createSelector([getAllLocationLayers], (locationLayers) => locationLayers.toJS())

class LocationProperties {
  constructor (workflowStateId, numberOfLocations = 1) {
    this.locationTypes = ['Household']
    this.selectedLocationType = this.locationTypes[0]
    this.numberOfLocations = numberOfLocations
    this.workflowStateId = workflowStateId
    this.isDirty = false
  }
}

class LocationEditorController {
  constructor ($timeout, $http, $ngRedux, state, tracker, tileDataService) {
    this.$timeout = $timeout
    this.$http = $http
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)
    this.state = state
    this.tracker = tracker
    this.tileDataService = tileDataService
    this.selectedMapObject = null
    this.objectIdToProperties = {}
    this.objectIdToMapObject = {}
    this.deletedFeatures = []
    this.currentTransaction = null
    this.deleteObjectWithId = null // A function into the child map object editor, requesting the specified map object to be deleted
    this.isCommiting = false
    this.WorkflowState = WorkflowState
    this.isExpandLocAttributes = false

    this.availableAttributesKeyList = ['loop_extended']
    this.availableAttributesValueList = ['true', 'false']
  }

  registerObjectDeleteCallback (deleteObjectWithIdCallback) {
    this.deleteObjectWithId = deleteObjectWithIdCallback
  }

  registerCreateMapObjectsCallback (createMapObjects) {
    this.createMapObjects = createMapObjects
  }

  registerRemoveMapObjectsCallback (removeMapObjects) {
    this.removeMapObjects = removeMapObjects
  }

  registerDeleteCreatedMapObject (deleteCreatedMapObject) {
    this.deleteCreatedMapObjectWithId = deleteCreatedMapObject
  }

  $onInit () {
    this.resumeOrCreateTransaction()
    this.state.configuration.ARO_CLIENT === 'frontier' && this.selectAllLocationLayers(this.locationLayers)
  }

  $onDestroy () {
    // to bring bakc the hidden locations
    this.state.requestMapLayerRefresh.next(null)
    this.unsubscribeRedux()
  }

  resumeOrCreateTransaction () {
    this.removeMapObjects && this.removeMapObjects()
    this.currentTransaction = null
    this.lastUsedNumberOfLocations = 1
    // See if we have an existing transaction for the currently selected location library
    var selectedLibraryItem = this.dataItems.location.selectedLibraryItems[0]
    this.$http.get(`/service/library/transaction`)
      .then((result) => {
        var existingTransactions = result.data.filter((item) => item.libraryId === selectedLibraryItem.identifier)
        if (existingTransactions.length > 0) {
          // We have an existing transaction for this library item. Use it.
          this.tracker.trackEvent(this.tracker.CATEGORIES.RESUME_LOCATION_TRANSACTION, this.tracker.ACTIONS.CLICK, 'TransactionID', existingTransactions[0].id)
          return Promise.resolve({ data: existingTransactions[0] })
        } else {
          // Create a new transaction and return it
          this.tracker.trackEvent(this.tracker.CATEGORIES.NEW_LOCATION_TRANSACTION, this.tracker.ACTIONS.CLICK)
          return this.$http.post('/service/library/transaction', {
            libraryId: selectedLibraryItem.identifier,
            userId: this.state.loggedInUser.id
          })
        }
      })
      .then((result) => {
        this.currentTransaction = result.data
        return this.$http.get(`/service/library/transaction/${this.currentTransaction.id}/transaction_features`)
      })
      .then((result) => {
        // We have a list of features. Replace them in the objectIdToProperties map.
        this.objectIdToProperties = {}
        this.objectIdToMapObject = {}
        // Filter out all non-deleted features - we do not want to create map objects for deleted features.
        var features = result.data
          .filter((item) => item.crudAction !== 'delete')
          .map((item) => item.feature)
        this.deletedFeatures = result.data.filter((item) => item.crudAction === 'delete')
        // Put the iconUrl in the features list
        features.forEach((item) => item.iconUrl = '/images/map_icons/aro/households_modified.png')
        // Important: Create the map objects first. The events raised by the map object editor will
        // populate the objectIdToMapObject object when the map objects are created
        this.createMapObjects && this.createMapObjects(features)
        // We now have objectIdToMapObject populated.
        features.forEach((feature) => {
          var locationProperties = new LocationProperties()
          locationProperties.numberOfLocations = feature.attributes.number_of_households
          this.objectIdToProperties[feature.objectId] = locationProperties
        })
      })
      .catch((err) => {
        this.state.selectedDisplayMode.next(this.state.displayModes.VIEW)
        this.$timeout()
        console.warn(err)
      })
  }

  getFeaturesCount () {
    // For this count we should show the deleted features too
    return (Object.keys(this.objectIdToProperties).length + this.deletedFeatures.length)
  }

  commitTransaction () {
    if (!this.currentTransaction) {
      console.error('No current transaction. We should never be in this state. Aborting commit...')
    }

    this.isCommiting = true
    // All modifications will already have been saved to the server. Commit the transaction.
    this.tracker.trackEvent(this.tracker.CATEGORIES.COMMIT_LOCATION_TRANSACTION, this.tracker.ACTIONS.CLICK, 'TransactionID', this.currentTransaction.id)
    this.$http.put(`/service/library/transaction/${this.currentTransaction.id}`)
      .then((result) => {
        // Transaction has been committed, start a new one
        this.isCommiting = false
        // Do not recreate tiles and/or data cache. That will be handled by the tile invalidation messages from aro-service
        Object.keys(this.objectIdToMapObject).forEach(objectId => this.tileDataService.removeFeatureToExclude(objectId))
        this.resumeOrCreateTransaction()
      })
      .catch((err) => {
        this.currentTransaction = null
        this.isCommiting = false
        this.state.recreateTilesAndCache()
        this.state.activeViewModePanel = this.state.viewModePanels.LOCATION_INFO // Close out this panel
        this.$timeout()
        console.error(err)
      })
  }

  getObjectIconUrl () {
    // Hardcoded for now
    return Promise.resolve('/images/map_icons/aro/households_modified.png')
  }

  getObjectSelectedIconUrl () {
    // Hardcoded for now
    return Promise.resolve('/images/map_icons/aro/households_selected.png')
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
        this.tracker.trackEvent(this.tracker.CATEGORIES.DISCARD_LOCATION_TRANSACTION, this.tracker.ACTIONS.CLICK, 'TransactionID', this.currentTransaction.id)
        this.$http.delete(`/service/library/transaction/${this.currentTransaction.id}`)
          .then((result) => {
            // Transaction has been discarded, start a new one
            this.state.recreateTilesAndCache()
            return this.resumeOrCreateTransaction()
          })
          .catch((err) => {
            this.currentTransaction = null
            this.state.activeViewModePanel = this.state.viewModePanels.LOCATION_INFO // Close out this panel
            this.$timeout()
            console.error(err)
          })
      }
    })
  }

  // Sets the last-used number-of-locations property so we can use it for new locations
  setLastUsedNumberOfLocations (newValue) {
    this.lastUsedNumberOfLocations = +newValue < 1 ? 1 : +newValue
  }

  // Marks the properties of the selected location as dirty (changed).
  markSelectedLocationPropertiesDirty () {
    if (this.selectedMapObject) {
      var objectProperties = this.objectIdToProperties[this.selectedMapObject.objectId]
      objectProperties.isDirty = true
    }
  }

  // Saves the properties of the selected location to aro-service
  saveSelectedLocationAndProperties () {
    if (this.selectedMapObject) {
      var selectedMapObject = this.selectedMapObject // May change while the $http.post() is returning
      var locationObject = this.formatLocationForService(selectedMapObject.objectId)
      this.$http.put(`/service/library/transaction/${this.currentTransaction.id}/features`, locationObject)
        .then((result) => {
          this.objectIdToProperties[selectedMapObject.objectId].isDirty = false
          this.$timeout()
        })
        .catch((err) => console.error(err))
    }
  }

  // Formats a location (based on the objectId) so that it can be sent in calls to aro-service
  formatLocationForService (objectId) {
    var mapObject = this.objectIdToMapObject[objectId]
    var objectProperties = this.objectIdToProperties[objectId]

    var featureObj = {
      objectId: objectId,
      geometry: {
        type: 'Point',
        coordinates: [mapObject.position.lng(), mapObject.position.lat()] // Note - longitude, then latitude
      },
      attributes: {
        number_of_households: objectProperties.numberOfLocations
      },
      dataType: 'location',
      workflowState: WorkflowState.CREATED.name
    }

    if (!mapObject.feature.hasOwnProperty('attributes')) {
      mapObject.feature.attributes = {}
    }

    // featureObj.attributes = mapObject.feature.attributes
    Object.keys(mapObject.feature.attributes).forEach((key) => {
      if (mapObject.feature.attributes[key] != null && mapObject.feature.attributes[key] != 'null' &&
        key != 'number_of_households') {
        featureObj.attributes[key] = mapObject.feature.attributes[key]
      }
    })

    return featureObj
  }

  handleObjectCreated (mapObject, usingMapClick, feature) {
    var numberOfLocations = this.lastUsedNumberOfLocations // use last used number of locations until commit
    if (feature.attributes && feature.attributes.number_of_households) {
      numberOfLocations = +feature.attributes.number_of_households
    }
    this.objectIdToProperties[mapObject.objectId] = new LocationProperties(feature.workflow_state_id, numberOfLocations)
    this.objectIdToMapObject[mapObject.objectId] = mapObject
    var locationObject = this.formatLocationForService(mapObject.objectId)
    // The marker is editable if the state is not LOCKED or INVALIDATED
    const isEditable = !((feature.workflow_state_id & WorkflowState.LOCKED.id) ||
                          (feature.workflow_state_id & WorkflowState.INVALIDATED.id))

    if (isEditable) {
      this.$http.post(`/service/library/transaction/${this.currentTransaction.id}/features`, locationObject)
    }
    this.$timeout()
  }

  handleSelectedObjectChanged (mapObject) {
    if (!this.isExpandLocAttributes) this.selectedMapObject = mapObject
    this.$timeout()
  }

  handleObjectModified (mapObject) {
    var locationObject = this.formatLocationForService(mapObject.objectId)
    this.$http.post(`/service/library/transaction/${this.currentTransaction.id}/features`, locationObject)
      .then((result) => {
        this.objectIdToProperties[mapObject.objectId].isDirty = false
        this.$timeout()
      })
      .catch((err) => console.error(err))
  }

  handleObjectDeleted (mapObject) {
    this.$http.delete(`/service/library/transaction/${this.currentTransaction.id}/features/${mapObject.objectId}`)
    this.deleteCreatedMapObjectWithId && this.deleteCreatedMapObjectWithId(mapObject.objectId) // Delete location from map
  }

  deleteSelectedObject () {
    // Ask the map to delete the selected object. If successful, we will get a callback where we can delete the object from aro-service.
    if (this.selectedMapObject) {
      this.deleteObjectWithId && this.deleteObjectWithId(this.selectedMapObject.objectId)
    }
  }

  isBoundaryCreationAllowed (mapObject) {
    return false
  }

  editLocationAttributes (index, updatedKey, updatedVal) {
    // attribute key is updated
    if (updatedKey != Object.keys(this.objectIdToMapObject[this.selectedMapObject.objectId].feature.attributes)[index]) {
      // delete key and insert updated key,value
      var key = Object.keys(this.objectIdToMapObject[this.selectedMapObject.objectId].feature.attributes)[index]

      this.objectIdToMapObject[this.selectedMapObject.objectId].feature.attributes[updatedKey] =
        this.objectIdToMapObject[this.selectedMapObject.objectId].feature.attributes[key]

      delete this.objectIdToMapObject[this.selectedMapObject.objectId].feature.attributes[key]
    } else {
      // key is not updated, just update value
      this.objectIdToMapObject[this.selectedMapObject.objectId].feature.attributes[updatedKey] = updatedVal
    }
  }

  deleteLocationAttributes (index, key, val) {
    var keypairToDelete = Object.keys(this.objectIdToMapObject[this.selectedMapObject.objectId].feature.attributes)[index]
    delete this.objectIdToMapObject[this.selectedMapObject.objectId].feature.attributes[keypairToDelete]
  }

  addLocationAttributes () {
    this.objectIdToMapObject[this.selectedMapObject.objectId].feature.attributes['att'] = 'value'
  }

  getAttributes (search, list) {
    var newAttr = list.slice()
    if (search && newAttr.indexOf(search) === -1) {
      newAttr.unshift(search)
    }
    return newAttr
  }

  getAttributesKey (search) {
    return this.getAttributes(search, this.availableAttributesKeyList)
  }

  getAttributesValue (search) {
    return this.getAttributes(search, this.availableAttributesValueList)
  }

  checkCanCreateObject (feature, usingMapClick) {
    // For frontier client check If households layer is enabled or not, If not enabled don't allow to create a object
    if (this.state.configuration.ARO_CLIENT === 'frontier' && !feature.isExistingObject) {
      var hhLocationLayer = this.locationLayers.filter((locationType) => locationType.label === 'Residential')[0]

      if (!hhLocationLayer.checked) {
        swal({
          title: 'Layer is turned off',
          text: 'You are trying to add a location but the layer is currently turned off. Please turn on the location layer and try again.',
          type: 'error'
        })
        return false
      } else {
        return true
      }
    } else {
      return true
    }
  }

  modalShown () {
    this.isExpandLocAttributes = true
  }

  modalHide () {
    this.isExpandLocAttributes = false
  }

  mapStateToThis (reduxState) {
    return {
      locationLayers: getLocationLayersList(reduxState),
      dataItems: reduxState.plan.dataItems
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      selectAllLocationLayers: (locationLayers) => {
        locationLayers.forEach((layer) => {
          // First set the visibility of the current layer
          dispatch(MapLayerActions.setLayerVisibility(layer, true))
        })
      }
    }
  }
}

LocationEditorController.$inject = ['$timeout', '$http', '$ngRedux', 'state', 'tracker', 'tileDataService']

let locationEditor = {
  templateUrl: '/components/sidebar/view/location-editor.html',
  bindings: {
    mapGlobalObjectName: '@'
  },
  controller: LocationEditorController
}

export default locationEditor
