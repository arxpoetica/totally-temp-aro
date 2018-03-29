class EditableMapObject {

  constructor(map, feature, eventHandlers) {
    // Object description
    // feature = {
    //   objectId: 'xyz',  // Globally unique object ID
    //   geometry: {
    //     type: 'Point',
    //     coordinates: google.maps.LatLng() // Basically whatever we can pass to maps creation
    //     draggable: true, //or false
    //     icon: 'icon'  // For point geometries
    //   },
    //   mapOptions: {
    //     draggable: true, // or false
    //     icon: 'icon' // For point geometries
    //  }
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
    this.setFeature(map, feature)

    // Raise the onCreate event
    this.eventHandlers.onCreate && this.eventHandlers.onCreate(this)
  }

  setFeature(map, feature) {
    // Clear any previously created geometries
    if (this.mapGeomety) {
      this.mapGeometry.setMap(null)
    }
    this.mapGeometry = {}
    this.feature = feature
    if (feature) {
      this.createMapGeometry(map)
    }
  }

  createMapGeometry(map) {

    // Create the map object
    switch(this.feature.geometry.type) {
      case 'Point':
        this.mapGeometry = new google.maps.Marker({
          position: new google.maps.LatLng(this.feature.geometry.coordinates[1], this.feature.geometry.coordinates[0]),
          icon: this.feature.mapOptions.icon,
          draggable: this.feature.mapOptions.draggable,
          map: map,
          editableMapObject: this
        })
      break;

      case 'Polygon':
        var polygonPath = []
        this.feature.geometry.coordinates[0].forEach((polygonVertex) => {
          polygonPath.push({
            lat: polygonVertex[1],
            lng: polygonVertex[0]
          })
        })
        this.mapGeometry = new google.maps.Polygon({
          paths: polygonPath,
          strokeColor: '#FF1493',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#FF1493',
          fillOpacity: 0.4,
          clickable: true,
          draggable: this.feature.mapOptions.draggable
        })
        this.mapGeometry.setMap(map)

      break;

      default:
        throw `createMapObject() does not support geometries with type ${this.feature.geometry.type}`
    }
    
    // Subscribe to map object events
    this.mapGeometry.addListener('dragstart', (event) => this.eventHandlers.onDragStart && this.eventHandlers.onDragStart(this, this.mapGeometry, event))
    this.mapGeometry.addListener('dragend', (event) => this.eventHandlers.onDragEnd && this.eventHandlers.onDragEnd(this, this.mapGeometry, event))
    this.mapGeometry.addListener('mousedown', (event) => this.eventHandlers.onMouseDown && this.eventHandlers.onMouseDown(this, this.mapGeometry, event))
  }
}

class EquipmentProperties {
  constructor() {
    this.siteIdentifier = ''
    this.siteName = ''
    this.siteTypes = ['Remote Terminal']
    this.selectedSiteType = this.siteTypes[0]
    this.deploymentDate = '03/18'
    this.equipmentTypes = [
      'Generic ADSL2+ DSLAM',
      'Generic ADSL2+ P DSLAM',
      'Generic ADSL-B DSLAM',
      'Generic ADSL DSLAM',
      'Generic VDSL-B DSLAM',
      'Generic VDSL DSLAM'
    ]
    this.selectedEquipmentType = this.equipmentTypes[0]
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
    this.coverageRadius = 10000 // Feet!
    this.createdEditableObjects = []
    this.uuidStore = []
    this.getUUIDsFromServer()

    this.CAF_BOUNDARY_ID = null
    this.$http.get('/service/boundary_type')
    .then((result) => {
      this.CAF_BOUNDARY_ID = result.data.filter((item) => item.description === 'CAF2')[0].id
    })

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
        this.createMapObjectsForCurrentTransaction()
        this.$timeout()
      })
      .catch((err) => console.error(err))
  }

  // Creates map objects for the current transaction
  createMapObjectsForCurrentTransaction() {
    // First remove any existing map objects
    this.removeCreatedMapObjects()

    // Get a list of objects for the current transaction
    this.$http.get(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`)
      .then((result) => {
        // Feature attributes are currently stored only as key-value pairs in service. Use defaults
        // for the array elements
        var defaultAttributes = new EquipmentProperties()
        result.data.forEach((equipmentFeature) => {
          equipmentFeature.attributes.siteTypes = defaultAttributes.siteTypes
          equipmentFeature.attributes.equipmentTypes = defaultAttributes.equipmentTypes
          this.createMapObject(null, equipmentFeature, false)
        })
        this.$timeout()
      })
      .catch((err) => console.error(err))
  }

  exitPlanEditMode() {
    this.currentTransaction = null
    this.state.recreateTilesAndCache()
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
      self.createMapObject(event, null, true)
    })
  }

  calculateCoverage(editableMapObject) {
    // Get the POST body for optimization based on the current application state
    var optimizationBody = this.state.getOptimizationBody()
    // Replace analysis_type and add a point and radius
    optimizationBody.analysis_type = 'COVERAGE'
    optimizationBody.point = {
      type: 'Point',
      coordinates: editableMapObject.feature.geometry.coordinates
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
      var boundaryFeature = {
        objectId: this.getUUID(),
        geometry: result.data.polygon,
        mapOptions: {
          draggable: false
        }
      }
      var polygonEventHandlers = []
      var handlers = {
        onCreate: (boundaryMapObject, geometry, event) => {
          this.createdEditableObjects.push(boundaryMapObject)
          this.saveBoundaryToService(boundaryMapObject, editableMapObject.feature.objectId)
        },
        onMouseDown: (editableMapObject, geometry, event) => {
          // Make the geometry editable
          if (this.selectedEditorMode === this.editorModes.EDIT_BOUNDARY) {
            geometry.setEditable(true)
          }
        }
      }
      var boundaryMapObject = new EditableMapObject(this.mapRef, boundaryFeature, handlers)
      var self = this
      boundaryMapObject.mapGeometry.getPaths().forEach(function(path, index){
        google.maps.event.addListener(path, 'insert_at', function(){
          self.updatePolygonInFeature(boundaryMapObject.mapGeometry, boundaryMapObject)
          self.saveBoundaryToService(boundaryMapObject, editableMapObject.feature.objectId)
        });
        google.maps.event.addListener(path, 'remove_at', function(){
          self.updatePolygonInFeature(boundaryMapObject.mapGeometry, boundaryMapObject)
          self.saveBoundaryToService(boundaryMapObject, editableMapObject.feature.objectId)
        });
        google.maps.event.addListener(path, 'set_at', function(){
          self.updatePolygonInFeature(boundaryMapObject.mapGeometry, boundaryMapObject)
          self.saveBoundaryToService(boundaryMapObject, editableMapObject.feature.objectId)
        });
      });
      google.maps.event.addListener(boundaryMapObject.mapGeometry, 'dragend', function(){
        self.updatePolygonInFeature(boundaryMapObject.mapGeometry, boundaryMapObject)
        self.saveBoundaryToService(boundaryMapObject, editableMapObject.feature.objectId)
      });
    })
    .catch((err) => console.error(err))
  }

  updatePolygonInFeature(polygon, editableMapObject) {
    var allPaths = []
    polygon.getPaths().forEach((path) => {
      var pathPoints = []
      path.forEach((latLng) => pathPoints.push(latLng.lng(), latLng.lat()))
      allPaths.push(pathPoints)
    })
    editableMapObject.mapGeometry.coordinates = allPaths
  }

  saveBoundaryToService(editableMapObject, networkEquipmentObjectId) {
    // Save the boundary to aro-service
    var serviceFeature = {
      objectId: editableMapObject.feature.objectId,
      geometry: editableMapObject.feature.geometry,
      attributes: {
        network_node_type: 'dslam',
        boundary_type_id: this.CAF_BOUNDARY_ID, // Assume that we have it at this point
        network_node_object_id: networkEquipmentObjectId
      }
    }
    this.$http.post(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment_boundary`, serviceFeature)
  }

  selectMapObject(newObjectToSelect) {
    if (this.selectedMapObject) {
      this.selectedMapObject.mapGeometry.setIcon('/images/map_icons/aro/plan_equipment.png')
    }
    this.selectedMapObject = newObjectToSelect
    if (this.selectedMapObject) {
      this.selectedMapObject.mapGeometry.setIcon('/images/map_icons/aro/plan_equipment_selected.png')
    }
    this.$timeout()
  }

  createMapObject(event, feature, calculateCoverage) {
    if (this.selectedEditorMode === this.editorModes.ADD) {
      // We are in "Add entity" mode
      // We may have a feature sent in. If it is, use the properties of that feature
      var equipmentFeature = null
      if (feature) {
        equipmentFeature = feature
        equipmentFeature.mapOptions = {
          draggable: true,
          icon: '/images/map_icons/aro/plan_equipment.png'
        }
      } else {
        equipmentFeature = {
          objectId: this.getUUID(),
          geometry: {
              type: 'Point',
              coordinates: [event.latLng.lng(), event.latLng.lat()]
          },
          mapOptions: {
            draggable: true,
            icon: '/images/map_icons/aro/plan_equipment.png'
          },
          attributes: new EquipmentProperties()
        }
      }
      var handlers = {
        onCreate: (editableMapObject) => {
          this.createdEditableObjects.push(editableMapObject)
          if (calculateCoverage) {
            this.calculateCoverage(editableMapObject)
          }
          this.selectMapObject(editableMapObject)
          // Format the object and send it over to aro-service
          var serviceFeature = {
            objectId: editableMapObject.feature.objectId,
            geometry: editableMapObject.feature.geometry,
            categoryType: 'dslam',
            attributes: {
              siteIdentifier: editableMapObject.feature.attributes.siteIdentifier,
              siteName: editableMapObject.feature.attributes.siteName,
              selectedSiteType: editableMapObject.feature.attributes.selectedSiteType,
              deploymentDate: editableMapObject.feature.attributes.deploymentDate,
              selectedEquipmentType: editableMapObject.feature.attributes.selectedEquipmentType
            }
          }
          this.$http.post(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`, serviceFeature)
        },
        onMouseDown: (editableMapObject, geometry, event) => {
          if (this.selectedEditorMode === this.editorModes.DELETE) {
            // Format the object and send it over to aro-service
            this.$http.delete(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment/${editableMapObject.feature.objectId}`)
            // Remove all geometries from map
            editableMapObject.setFeature(null)
            this.selectMapObject(null)
          } else if (this.selectedEditorMode === this.editorModes.EDIT_BOUNDARY) {
            throw 'editable boundaryNot supported'
            editableMapObject.mapGeometries.COVERAGE_BOUNDARY.setEditable(true)
          } else {
            this.selectMapObject(editableMapObject)
          }
        },
        onDragEnd: (editableMapObject, geometry, event) => {
          // Update the coordinates in the feature
          editableMapObject.feature.geometry.coordinates = [event.latLng.lng(), event.latLng.lat()]
          this.calculateCoverage(editableMapObject)
          this.saveFeatureAttributes(editableMapObject.feature)
        }
      }
      var mapObject = new EditableMapObject(this.mapRef, equipmentFeature, handlers)
    }
  }

  // Saves the attributes of the given feature into aro-service
  saveFeatureAttributes(feature) {

    if (!this.currentTransaction) {
      console.error('saveFeatureAttributes() - No current transaction. This should never happen.')
      return
    } else if (!feature) {
      console.error('saveFeatureAttributes() - No feature provided.')
      return
    }

    // Format the object and send it over to aro-service
    var serviceFeature = {
      objectId: feature.objectId,
      geometry: feature.geometry,
      categoryType: 'dslam',
      attributes: {
        siteIdentifier: feature.attributes.siteIdentifier,
        siteName: feature.attributes.siteName,
        selectedSiteType: feature.attributes.selectedSiteType,
        deploymentDate: feature.attributes.deploymentDate,
        selectedEquipmentType: feature.attributes.selectedEquipmentType
      }
    }
    this.$http.put(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`, serviceFeature)
  }

  // Sets the editor mode, and subscribes/unsubscribes from map events
  setEditorMode(newMode) {
    this.selectedEditorMode = newMode
    if (newMode != this.editorModes.EDIT_BOUNDARY && this.selectedMapObject && this.selectedMapObject.mapGeometry.type === 'Polygon') {
      this.selectedMapObject.mapGeometry.setEditable(false)
    }
  }

  removeCreatedMapObjects() {
    // Remove created objects from map
    this.createdEditableObjects.forEach((editableObject) => {
      editableObject.mapGeometry.setMap(null)
    })
    this.createdEditableObjects = []
  }

  $onDestroy() {
    // Remove listener
    google.maps.event.removeListener(this.clickListener)
    this.removeCreatedMapObjects()
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