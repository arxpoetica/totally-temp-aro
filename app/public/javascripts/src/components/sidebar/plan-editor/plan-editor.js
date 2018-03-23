class EditableMapObject {

  constructor(map, feature, eventHandlers) {
    // Object description
    // feature = {
    //   objectId: 'xyz',  // Globally unique object ID
    //   geometries: [{
    //     key: 'asdf', // Sub-key for the geometry. Has to be unique within this object
    //     type: 'point',
    //     coordinates: google.maps.LatLng() // Basically whatever we can pass to maps creation
    //     draggable: true, //or false
    //     icon: 'icon'  // For point geometries
    //   } ..... ],
    // }

    // Event handlers - optional, specify only the ones you want to subscribe to
    // eventHandlers = {
    //   onCreate,
    //   onDragStart,
    //   onDragEnd,
    //   onChangeGeometry,
    //   onChangeProperty,
    //   onMouseDown
    // }
    this.eventHandlers = eventHandlers
    this.setFeature(feature)

    // Raise the onCreate event
    this.eventHandlers.onCreate && this.eventHandlers.onCreate(this)
  }

  setFeature(feature) {
    // Clear any previously created geometries
    if (this.mapGeometries) {
      Object.keys(this.mapGeometries).forEach((geometryKey) => {
        this.mapGeometries[geometryKey].setMap(null)
      })
    }
    this.mapGeometries = {}
    this.feature = feature
    if (feature) {
      this.createMapGeometries(map)
    }
  }

  createMapGeometries(map) {
    this.mapGeometries = {}
    Object.keys(this.feature.geometries).forEach((geometryKey) => {
      this.createMapObject(map, geometryKey, this.feature.geometries[geometryKey])
    })
  }

  createMapObject(map, geometryKey, geometry) {

    // Create the map object
    var mapObject = null
    switch(geometry.type) {
      case 'point':
        mapObject = new google.maps.Marker({
          position: geometry.coordinates,
          icon: geometry.icon,
          draggable: geometry.draggable,
          map: map,
          editableMapObject: this
        })
      break;

      case 'polygon':
        mapObject = new google.maps.Polygon({
          paths: geometry.polygonPath,
          strokeColor: '#FF1493',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#FF1493',
          fillOpacity: 0.4,
          clickable: true,
          draggable: geometry.draggable
        })
        mapObject.setMap(map)

      break;

      default:
        throw `createMapObject() does not support geometries with type ${this.feature.geometry.type}`
    }
    
    // Subscribe to map object events
    mapObject.addListener('dragstart', (event) => this.eventHandlers.onDragStart && this.eventHandlers.onDragStart(this, mapObject, event))
    mapObject.addListener('dragend', (event) => this.eventHandlers.onDragEnd && this.eventHandlers.onDragEnd(this, mapObject, event))
    mapObject.addListener('mousedown', (event) => this.eventHandlers.onMouseDown && this.eventHandlers.onMouseDown(this, mapObject, event))

    this.mapGeometries[geometryKey] = mapObject
  }
}

class PlanEditorController {
  
  constructor(state, $http, $timeout, configuration) {
    this.state = state
    this.$http = $http
    this.$timeout = $timeout
    this.configuration = configuration
    this.editorModes = Object.freeze({
      ADD: 'ADD',
      DELETE: 'DELETE',
      MOVE: 'MOVE',
      EDIT_BOUNDARY: 'EDIT_BOUNDARY'
    })
    this.selectedEditorMode = this.editorModes.ADD
    this.initializeEquipmentProperties()
    this.coverageRadius = 10000 // Feet!
    this.createdEditableObjects = []
    this.uuidStore = []
    this.getUUIDsFromServer()

    this.currentTransaction = null
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
        this.$timeout()
      })
      .catch((err) => console.error(err))
  }

  initializeEquipmentProperties() {
    this.siteIdentifier = ''
    this.siteName = ''
    this.siteTypes = ['Remote Terminal']
    this.selectedSiteType = this.siteTypes[0]
    this.deploymentDate = '03/18'
    this.equipments = [
      'Generic ADSL2+ DSLAM',
      'Generic ADSL2+ P DSLAM',
      'Generic ADSL-B DSLAM',
      'Generic ADSL DSLAM',
      'Generic VDSL-B DSLAM',
      'Generic VDSL DSLAM'
    ]
    this.selectedEquipment = this.equipments[0]
  }

  exitPlanEditMode() {
    this.currentTransaction = null
    this.state.selectedDisplayMode.next(this.state.displayModes.VIEW)
    this.state.activeViewModePanel = this.state.viewModePanels.LOCATION_INFO
    this.$timeout()
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

  $onInit() {
    // We should have a map variable at this point
    if (!window[this.mapGlobalObjectName]) {
      console.error('ERROR: Location Editor component initialized, but a map object is not available at this time.')
      return
    }

    this.mapRef = window[this.mapGlobalObjectName]
    var self = this
    this.clickListener = google.maps.event.addListener(this.mapRef, 'click', function(event) {
      self.handleMapClick(event)
    })
  }

  calculateCoverage(editableMapObject) {
    var position = editableMapObject.mapGeometries.CENTER_POINT.position
    // Get the POST body for optimization based on the current application state
    var optimizationBody = this.state.getOptimizationBody()
    // Replace analysis_type and add a point and radius
    optimizationBody.analysis_type = 'COVERAGE'
    optimizationBody.point = {
      type: 'Point',
      coordinates: [position.lng(), position.lat()]
    }
    // Always send radius in meters to the back end
    optimizationBody.radius = this.coverageRadius * this.configuration.units.length_units_to_meters

    this.$http.post('/service/v1/network-analysis/boundary', optimizationBody)
    .then((result) => {
      // Format the result so we can use it to create a polygon
      var polygonPath = []
      result.data.polygon.coordinates[0].forEach((polygonVertex) => {
        polygonPath.push({
          lat: polygonVertex[1],
          lng: polygonVertex[0]
        })
      })
      var feature = editableMapObject.feature
      feature.geometries.COVERAGE_BOUNDARY = {
        type: 'polygon',
        polygonPath: polygonPath,
        draggable: false
      }
      editableMapObject.setFeature(feature)
    })
    .catch((err) => console.error(err))
  }

  handleMapClick(event) {
    if (this.selectedEditorMode === this.editorModes.ADD) {
      // We are in "Add entity" mode
      var CENTER_KEY = 'point'
      var equipmentFeature = {
        objectId: this.getUUID(),
        geometries: {
          CENTER_POINT: {
            type: 'point',
            coordinates: event.latLng,
            draggable: true,
            icon: '/images/map_icons/aro/plan_equipment.png'
          }
        }
      }
      var handlers = {
        onCreate: (editableMapObject) => {
          this.createdEditableObjects.push(editableMapObject)
          this.calculateCoverage(editableMapObject)
          // Format the object and send it over to aro-service
          var coords = editableMapObject.feature.geometries.CENTER_POINT.coordinates
          var serviceFeature = {
            objectId: editableMapObject.feature.objectId,
            geometry: {
              type: 'Point',
              coordinates: [coords.lng(), coords.lat()] // Note - longitude, then latitude
            }
          }
          this.$http.post(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`, serviceFeature)
        },
        onMouseDown: (editableMapObject, geometry, event) => {
          if (this.selectedEditorMode === this.editorModes.DELETE) {
            // Remove all geometries from map
            editableMapObject.setFeature(null)
            // Format the object and send it over to aro-service
            var coords = editableMapObject.feature.geometries.CENTER_POINT.coordinates
            var serviceFeature = {
              objectId: editableMapObject.feature.objectId,
              geometry: {
                type: 'Point',
                coordinates: [coords.lng(), coords.lat()] // Note - longitude, then latitude
              }
            }
            this.$http.delete(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`, serviceFeature)
          }
        },
        onDragEnd: (editableMapObject, geometry, event) => {
          // Update the coordinates in the feature
          editableMapObject.feature.geometries.CENTER_POINT.coordinates = event.latLng
          this.calculateCoverage(editableMapObject)
          // Format the object and send it over to aro-service
          var coords = editableMapObject.feature.geometries.CENTER_POINT.coordinates
          var serviceFeature = {
            objectId: editableMapObject.feature.objectId,
            geometry: {
              type: 'Point',
              coordinates: [coords.lng(), coords.lat()] // Note - longitude, then latitude
            }
          }
          this.$http.put(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`, serviceFeature)
        }
      }
      var mapObject = new EditableMapObject(this.mapRef, equipmentFeature, handlers)
    }
  }

  // Sets the editor mode, and subscribes/unsubscribes from map events
  setEditorMode(newMode) {
    this.selectedEditorMode = newMode
  }

  $onDestroy() {

    // Remove listener
    google.maps.event.removeListener(this.clickListener)

    // Remove created objects from map
    this.createdEditableObjects.forEach((editableObject) => {
      Object.keys(editableObject.mapGeometries).forEach((geometryKey) => {
        var mapObject = editableObject.mapGeometries[geometryKey]
        mapObject.setMap(null)
      })
    })
    this.createdEditableObjects = []

  }
}

PlanEditorController.$inject = ['state', '$http', '$timeout', 'configuration']

let planEditor = {
  templateUrl: '/components/sidebar/plan-editor/plan-editor.html',
  bindings: {
    mapGlobalObjectName: '@'
  },
  controller: PlanEditorController
}

export default planEditor