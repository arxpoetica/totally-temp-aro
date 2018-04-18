import EquipmentProperties from './equipment-properties'
import BoundaryAttributes from './boundary-attributes'

class PlanEditorController {

  constructor($timeout, $http, state, configuration) {
    this.$timeout = $timeout
    this.$http = $http
    this.state = state
    this.configuration = configuration
    this.selectedMapObject = null
    this.objectIdToProperties = {}
    this.objectIdToMapObject = {}
    this.boundaryIdToEquipmentId = {}
    this.equipmentIdToBoundaryId = {}
    this.showDragHelpText = true
    this.currentTransaction = null
    this.lastSelectedEquipmentType = 'Generic ADSL'
    this.coverageRadius = 10000 // In user units (e.g. Feet)
    this.deleteObjectWithId = null // A function into the child map object editor, requesting the specified map object to be deleted
    this.uuidStore = []
    this.getUUIDsFromServer()
    // Create a list of all the network node types that we MAY allow the user to edit (add onto the map)
    this.allEditableNetworkNodeTypes = [
      'central_office',
      'dslam',
      'fiber_distribution_hub',
      'fiber_distribution_terminal',
      'cell_5g',
      'splice_point',
      'bulk_distribution_terminal'
    ]
    // Create a list of enabled network node types that we WILL allow the user to drag onto the map
    this.enabledNetworkNodeTypes = [
      'dslam'
    ]
  }

  // Get a list of UUIDs from the server
  getUUIDsFromServer() {
    const numUUIDsToFetch = 20
    this.$http.get(`/service/library/uuids/${numUUIDsToFetch}`)
    .then((result) => {
      this.uuidStore = this.uuidStore.concat(result.data)
    })
    .catch((err) => console.error(err))
  }

  // Get a UUID from the store
  getUUID() {
    if (this.uuidStore.length < 7) {
      // We are running low on UUIDs. Get some new ones from aro-service while returning one of the ones that we have
      this.getUUIDsFromServer()
    }
    return this.uuidStore.pop()
  }

  registerObjectDeleteCallback(deleteObjectWithIdCallback) {
    this.deleteObjectWithId = deleteObjectWithIdCallback
  }

  registerCreateMapObjectsCallback(createMapObjects) {
    this.createMapObjects = createMapObjects
  }

  registerRemoveMapObjectsCallback(removeMapObjects) {
    this.removeMapObjects = removeMapObjects
  }

  $onInit() {
    // Select the first boundary in the list
    this.selectedBoundaryType = this.state.boundaryTypes[0]
    this.resumeOrCreateTransaction()
    this.$timeout(() => this.showDragHelpText = false, 6000)  // Hide help text after a while
  }

  resumeOrCreateTransaction() {
    this.removeMapObjects && this.removeMapObjects()
    this.currentTransaction = null
    // See if we have an existing transaction for the currently selected location library
    this.$http.get(`/service/plan-transaction?user_id=${this.state.getUserId()}`)
      .then((result) => {
        if (result.data.length > 0) {
          // At least one transaction exists. Return it
          return Promise.resolve({
            data: result.data[0]
          })
        } else {
          // Create a new transaction and return it.
          return this.$http.post(`/service/plan-transactions`, { userId: this.state.getUserId(), planId: this.state.plan.getValue().id })
        }
      })
      .then((result) => {
        this.currentTransaction = result.data
        return this.$http.get(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`)
      })
      .then((result) => {
        // We have a list of features. Replace them in the objectIdToProperties map.
        this.objectIdToProperties = {}
        this.objectIdToMapObject = {}
        this.equipmentIdToBoundaryId = {}
        this.boundaryIdToEquipmentId = {}
        // Important: Create the map objects first. The events raised by the map object editor will
        // populate the objectIdToMapObject object when the map objects are created
        this.createMapObjects && this.createMapObjects(result.data)
        // We now have objectIdToMapObject populated.
        result.data.forEach((feature) => {
          const attributes = feature.attributes
          const properties = new EquipmentProperties(attributes.siteIdentifier, attributes.siteName,
                                                     'planned_remote_terminal', attributes.selectedEquipmentType)
          this.objectIdToProperties[feature.objectId] = properties
        })
        return this.$http.get(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment_boundary`)
      })
      .then((result) => {
        // We have a list of equipment boundaries. Populate them in the map object
        this.createMapObjects && this.createMapObjects(result.data)
        // Save the equipment and boundary ID associations
        result.data.forEach((boundaryFeature) => {
          var equipmentId = boundaryFeature.attributes.network_node_object_id
          var boundaryId = boundaryFeature.objectId
          this.equipmentIdToBoundaryId[equipmentId] = boundaryId
          this.boundaryIdToEquipmentId[boundaryId] = equipmentId
        })
      })
      .catch((err) => console.error(err))
  }

  getFeaturesCount() {
    return Object.keys(this.objectIdToProperties).length
  }

  exitPlanEditMode() {
    this.currentTransaction = null
    this.state.recreateTilesAndCache()
    this.state.selectedDisplayMode.next(this.state.displayModes.VIEW)
    this.state.activeViewModePanel = this.state.viewModePanels.LOCATION_INFO
    this.$timeout()
  }

  handleObjectDroppedOnMarker(eventArgs) {
    console.log('-----------__ In plan editor')
    console.log(eventArgs)
    var equipmentMapObject = this.objectIdToMapObject[eventArgs.targetObjectId]
    if (!equipmentMapObject) {
      console.error(`And object was dropped on marker with id ${eventArgs.targetObjectId}, but this id does not exist in this.objectIdToMapObject`)
      return
    }
    this.calculateCoverage(equipmentMapObject)
  }

  calculateCoverage(mapObject) {
    // Get the POST body for optimization based on the current application state
    var optimizationBody = this.state.getOptimizationBody()
    // Replace analysis_type and add a point and radius
    optimizationBody.analysis_type = 'COVERAGE'
    optimizationBody.point = {
      type: 'Point',
      coordinates: [mapObject.position.lng(), mapObject.position.lat()]
    }
    // Always send radius in meters to the back end
    optimizationBody.radius = this.coverageRadius * this.configuration.units.length_units_to_meters

    var equipmentObjectId = mapObject.objectId
    this.$http.post('/service/v1/network-analysis/boundary', optimizationBody)
      .then((result) => {
        // Construct a feature that we will pass to the map object editor, which will create the map object
        var feature = {
          objectId: this.getUUID(),
          geometry: {
            type: 'Polygon',
            coordinates: result.data.polygon.coordinates
          },
          attributes: {
            network_node_type: 'dslam',
            boundary_type_id: this.selectedBoundaryType.id,
            network_node_object_id: equipmentObjectId // This is the Network Equipment that this boundary is associated with
          }
        }
        this.boundaryIdToEquipmentId[feature.objectId] = equipmentObjectId
        this.equipmentIdToBoundaryId[equipmentObjectId] = feature.objectId
        this.createMapObjects && this.createMapObjects([feature])
      })
      .catch((err) => console.error(err))
  }

  commitTransaction() {
    if (!this.currentTransaction) {
      console.error('No current transaction. We should never be in this state. Aborting commit...')
    }

    this.$http.put(`/service/plan-transactions/${this.currentTransaction.id}`)
      .then((result) => {
        // Committing will close the transaction. To keep modifying, open a new transaction
        this.exitPlanEditMode()
      })
      .catch((err) => {
        console.error(err)
        this.exitPlanEditMode()
      })
  }

  discardTransaction() {
    swal({
      title: 'Discard transaction?',
      text: `Are you sure you want to discard transaction with ID ${this.currentTransaction.id}`,
      type: 'warning',
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Yes, discard',
      cancelButtonText: 'No',
      showCancelButton: true,
      closeOnConfirm: true
    }, (deleteTransaction) => {
      if (deleteTransaction) {
        // The user has confirmed that the transaction should be deleted
        this.$http.delete(`/service/plan-transactions/transaction/${this.currentTransaction.id}`)
        .then((result) => {
          this.exitPlanEditMode()
        })
        .catch((err) => {
          console.error(err)
          this.exitPlanEditMode()
        })
      }
    })
  }

  // Marks the properties of the selected equipment as dirty (changed).
  markSelectedEquipmentPropertiesDirty() {
    if (this.selectedMapObject) {
      var objectProperties = this.objectIdToProperties[this.selectedMapObject.objectId]
      objectProperties.isDirty = true
      this.lastSelectedEquipmentType = objectProperties.selectedEquipmentType || this.lastSelectedEquipmentType
    }
  }

  // Formats the equipment specified by the objectId so that it can be sent to aro-service for saving
  formatEquipmentForService(objectId) {
    // Format the object and send it over to aro-service
    var mapObject = this.objectIdToMapObject[objectId]
    var objectProperties = this.objectIdToProperties[objectId]
    var serviceFeature = {
      objectId: objectId,
      geometry: {
        type: 'Point',
        coordinates: [mapObject.position.lng(), mapObject.position.lat()] // Note - longitude, then latitude
      },
      categoryType: 'dslam',
      attributes: {
        siteIdentifier: objectProperties.siteIdentifier,
        siteName: objectProperties.siteName,
        selectedEquipmentType: objectProperties.selectedEquipmentType
      }
    }
    return serviceFeature
  }

  // Formats the boundary specified by the objectId so that it can be sent to aro-service for saving
  formatBoundaryForService(objectId) {
    // Format the object and send it over to aro-service
    var boundaryMapObject = this.objectIdToMapObject[objectId]
    var allPaths = []
    boundaryMapObject.getPaths().forEach((path) => {
      var pathPoints = []
      path.forEach((latLng) => pathPoints.push([latLng.lng(), latLng.lat()]))
      allPaths.push(pathPoints)
    })

    var serviceFeature = {
      objectId: objectId,
      geometry: {
        type: 'Polygon',
        coordinates: allPaths
      },
      attributes: {
        network_node_type: 'dslam',
        boundary_type_id: this.selectedBoundaryType.id,
        network_node_object_id: this.boundaryIdToEquipmentId[objectId]
      }
    }
    return serviceFeature
  }

  // Saves the properties of the selected location to aro-service
  saveSelectedEquipmentProperties() {
    if (this.selectedMapObject) {
      var selectedMapObject = this.selectedMapObject  // May change while the $http.post() is returning
      var equipmentObjectForService = this.formatEquipmentForService(selectedMapObject.objectId)
      this.$http.put(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`, equipmentObjectForService)
        .then((result) => {
          this.objectIdToProperties[selectedMapObject.objectId].isDirty = false
          this.$timeout()
        })
        .catch((err) => console.error(err))
    }
  }

  // Returns the configuration of the currently selected network type
  getSelectedNetworkConfig() {
    var layers = this.configuration.networkEquipment.equipmentList.planned.layers
    var networkNodeType = this.objectIdToProperties[this.selectedMapObject.objectId].siteNetworkNodeType
    return layers[networkNodeType]
  }

  handleObjectCreated(mapObject, usingMapClick) {
    this.objectIdToProperties[mapObject.objectId] = new EquipmentProperties('', '', 'planned_remote_terminal', this.lastSelectedEquipmentType)
    this.objectIdToMapObject[mapObject.objectId] = mapObject
    if (usingMapClick && mapObject.icon && mapObject.position) {
      // This is a equipment marker and not a boundary. We should have a better way of detecting this
      var equipmentObject = this.formatEquipmentForService(mapObject.objectId)
      this.$http.post(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`, equipmentObject)
      // this.calculateCoverage(mapObject)
    } else if (!mapObject.icon && !mapObject.position) {
      // This is a boundary marker. This will be created without map clicks. Save it.
      var serviceFeature = this.formatBoundaryForService(mapObject.objectId)
      this.$http.post(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment_boundary`, serviceFeature)
        .catch((err) => console.error(err))
    }
    this.$timeout()
  }

  handleSelectedObjectChanged(mapObject) {
    this.selectedMapObject = mapObject
    this.$timeout()
  }

  handleObjectModified(mapObject) {
    if (mapObject.icon && mapObject.position) {
      // This is a equipment marker and not a boundary. We should have a better way of detecting this
      var equipmentObject = this.formatEquipmentForService(mapObject.objectId)
      this.$http.post(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`, equipmentObject)
        .then((result) => {
          this.objectIdToProperties[mapObject.objectId].isDirty = false
          this.$timeout()
        })
        .catch((err) => console.error(err))
      // Delete the associated boundary
      const boundaryObjectId = this.equipmentIdToBoundaryId[mapObject.objectId]
      if (boundaryObjectId) {
        delete this.equipmentIdToBoundaryId[mapObject.objectId]
        delete this.boundaryIdToEquipmentId[boundaryObjectId]
        this.deleteObjectWithId && this.deleteObjectWithId(boundaryObjectId)
      }
      this.calculateCoverage(mapObject)
    } else {
      // This is a boundary feature
      var serviceFeature = this.formatBoundaryForService(mapObject.objectId)
      this.$http.put(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment_boundary`, serviceFeature)
        .catch((err) => console.error(err))
    }
  }

  handleObjectDeleted(mapObject) {
    if (mapObject.icon && mapObject.position) {
      // This is a equipment marker and not a boundary. We should have a better way of detecting this
      this.$http.delete(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment/${mapObject.objectId}`)
      // If this is an equipment, delete its associated boundary (if any)
      if (mapObject.icon && mapObject.position) {
        const boundaryObjectId = this.equipmentIdToBoundaryId[mapObject.objectId]
        if (boundaryObjectId) {
          delete this.equipmentIdToBoundaryId[mapObject.objectId]
          delete this.boundaryIdToEquipmentId[boundaryObjectId]
          this.deleteObjectWithId && this.deleteObjectWithId(boundaryObjectId)
          // No need to delete from the server, we will get another delete event for the boundary.
        }
      }
    } else {
      this.$http.delete(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment_boundary/${mapObject.objectId}`)
    }
  }

  deleteSelectedObject() {
    // Ask the map to delete the selected object. If successful, we will get a callback where we can delete the object from aro-service.
    if (this.selectedMapObject) {
      // Delete the selected map object
      this.deleteObjectWithId && this.deleteObjectWithId(this.selectedMapObject.objectId)
    }
  }
}

PlanEditorController.$inject = ['$timeout', '$http', 'state', 'configuration']

let planEditor = {
  templateUrl: '/components/sidebar/plan-editor/plan-editor.html',
  bindings: {
    mapGlobalObjectName: '@'
  },
  controller: PlanEditorController
}

export default planEditor
