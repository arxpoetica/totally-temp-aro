class EquipmentProperties {
  constructor(siteIdentifier, siteName, selectedSiteType, deploymentDate, selectedEquipmentType) {
    this.siteIdentifier = siteIdentifier || ''
    this.siteName = siteName || ''
    this.siteTypes = ['Remote Terminal']
    this.selectedSiteType = selectedSiteType || this.siteTypes[0]
    this.deploymentDate = deploymentDate || '04/18'
    this.equipmentTypes = [
      'Generic ADSL2+ DSLAM',
      'Generic ADSL2+ P DSLAM',
      'Generic ADSL-B DSLAM',
      'Generic ADSL DSLAM',
      'Generic VDSL-B DSLAM',
      'Generic VDSL DSLAM'
    ]
    this.selectedEquipmentType = selectedEquipmentType || this.equipmentTypes[0]
    this.isDirty = false
  }
}

class PlanEditorController {

  constructor($timeout, $http, state) {
    this.$timeout = $timeout
    this.$http = $http
    this.state = state
    this.selectedMapObject = null
    this.objectIdToProperties = {}
    this.objectIdToMapObject = {}
    this.currentTransaction = null
    this.requestSelectedObjectDelete = null // A function into the child map object editor, requesting the specified map object to be deleted
  }

  registerObjectDeleteCallback(objectDeleteCallback) {
    this.requestSelectedObjectDelete = objectDeleteCallback
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
        // Important: Create the map objects first. The events raised by the map object editor will
        // populate the objectIdToMapObject object when the map objects are created
        this.createMapObjects && this.createMapObjects(result.data)
        // We now have objectIdToMapObject populated.
        result.data.forEach((feature) => {
          const attributes = feature.attributes
          const properties = new EquipmentProperties(attributes.siteIdentifier, attributes.siteName, attributes.selectedSiteType,
                                                     attributes.deploymentDate, attributes.selectedEquipmentType)
          this.objectIdToProperties[feature.objectId] = properties
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
        selectedSiteType: objectProperties.selectedSiteType,
        deploymentDate: objectProperties.deploymentDate,
        selectedEquipmentType: objectProperties.selectedEquipmentType
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

  handleObjectCreated(mapObject) {
    this.objectIdToProperties[mapObject.objectId] = new EquipmentProperties()
    this.objectIdToMapObject[mapObject.objectId] = mapObject
    var equipmentObject = this.formatEquipmentForService(mapObject.objectId)
    this.$http.post(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`, equipmentObject)
    this.$timeout()
  }

  handleSelectedObjectChanged(mapObject) {
    this.selectedMapObject = mapObject
    this.$timeout()
  }

  handleObjectModified(mapObject) {
    var equipmentObject = this.formatEquipmentForService(mapObject.objectId)
    this.$http.post(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`, equipmentObject)
      .then((result) => {
        this.objectIdToProperties[mapObject.objectId].isDirty = false
        this.$timeout()
      })
      .catch((err) => console.error(err))
  }

  handleObjectDeleted(mapObject) {
    this.$http.delete(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment/${mapObject.objectId}`)
  }

  deleteSelectedObject() {
    // Ask the map to delete the selected object. If successful, we will get a callback where we can delete the object from aro-service.
    this.requestSelectedObjectDelete && this.requestSelectedObjectDelete()
  }
}

// class PlanEditorController {
  
//   constructor(state, $http, $timeout, tileDataService, configuration) {
//     this.state = state
//     this.$http = $http
//     this.$timeout = $timeout
//     this.tileDataService = tileDataService
//     this.configuration = configuration
//     this.coverageRadius = 10000 // Feet!
//     this.createdEditableObjects = []
//     this.uuidStore = []
//     this.getUUIDsFromServer()

//     this.currentTransaction = null
//     this.$http.get(`/service/plan-transaction?user_id=${this.state.getUserId()}`)
//       .then((result) => {
//         if (result.data.length > 0) {
//           // At least one transaction exists. Return it
//           return Promise.resolve({
//             data: result.data[0]
//           })
//         } else {
//           // Create a new transaction and return it.
//           return this.$http.post(`/service/plan-transactions`, { userId: this.state.getUserId(), planId: this.state.plan.getValue().id })
//         }
//       })
//       .then((result) => {
//         this.currentTransaction = result.data
//         this.createMapObj ectsForCurrentTransaction()
//         this.$timeout()
//       })
//       .catch((err) => console.error(err))
//   }

//   // Creates map objects for the current transaction
//   createMapObjectsForCurrentTransaction() {
//     // First remove any existing map objects
//     this.removeCreatedMapObjects()

//     // Get a list of objects for the current transaction
//     this.$http.get(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`)
//       .then((result) => {
//         // Feature attributes are currently stored only as key-value pairs in service. Use defaults
//         // for the array elements
//         var defaultAttributes = new EquipmentProperties()
//         result.data.forEach((equipmentFeature) => {
//           equipmentFeature.attributes.siteTypes = defaultAttributes.siteTypes
//           equipmentFeature.attributes.equipmentTypes = defaultAttributes.equipmentTypes
//           this.createMapObject(null, equipmentFeature, false)
//         })
//         this.$timeout()
//       })
//       .catch((err) => console.error(err))
//   }

//   exitPlanEditMode() {
//     this.currentTransaction = null
//     this.state.recreateTilesAndCache()
//     this.state.selectedDisplayMode.next(this.state.displayModes.VIEW)
//     this.state.activeViewModePanel = this.state.viewModePanels.LOCATION_INFO
//     this.$timeout()
//   }

//   commitTransaction() {
//     if (!this.currentTransaction) {
//       console.error('No current transaction. We should never be in this state. Aborting commit...')
//     }

//     this.$http.put(`/service/plan-transactions/${this.currentTransaction.id}`)
//       .then((result) => {
//         // Committing will close the transaction. To keep modifying, open a new transaction
//         this.exitPlanEditMode()
//       })
//       .catch((err) => {
//         console.error(err)
//         this.exitPlanEditMode()
//       })
//   }

//   discardTransaction() {
//     swal({
//       title: 'Discard transaction?',
//       text: `Are you sure you want to discard transaction with ID ${this.currentTransaction.id}`,
//       type: 'warning',
//       confirmButtonColor: '#DD6B55',
//       confirmButtonText: 'Yes, discard',
//       cancelButtonText: 'No',
//       showCancelButton: true,
//       closeOnConfirm: true
//     }, (deleteTransaction) => {
//       if (deleteTransaction) {
//         // The user has confir`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment/med that the transaction should be deleted
//         this.$http.delete(`/service/plan-transactions/transaction/${this.currentTransaction.id}`)
//         .then((result) => {
//           this.exitPlanEditMode()
//         })
//         .catch((err) => {
//           console.error(err)
//           this.exitPlanEditMode()
//         })
//       }
//     })
//   }

//   // Get a list of UUIDs from the server
//   getUUIDsFromServer() {
//     const numUUIDsToFetch = 20
//     this.$http.get(`/service/library/uuids/${numUUIDsToFetch}`)
//     .then((result) => {
//       this.uuidStore = this.uuidStore.concat(result.data)
//     })
//     .catch((err) => console.error(err))
//   }

//   // Get a UUID from the store
//   getUUID() {
//     if (this.uuidStore.length < 7) {
//       // We are running low on UUIDs. Get some new ones from aro-service while returning one of the ones that we have
//       this.getUUIDsFromServer()
//     }
//     return this.uuidStore.pop()
//   }

//   $onInit() {
//     // We should have a map variable at this point
//     if (!window[this.mapGlobalObjectName]) {
//       console.error('ERROR: Location Editor component initialized, but a map object is not available at this time.')
//       return
//     }

//     this.mapRef = window[this.mapGlobalObjectName]
//     var self = this
//     // Note we are using skip(1) to skip the initial value (that is fired immediately) from the RxJS stream.
//     this.mapFeaturesSelectedEventObserver = this.state.mapFeaturesSelectedEvent.skip(1).subscribe((event) => {
//       this.handleMapEntitySelected(event)
//     })

//     // Select the first boundary in the list
//     this.selectedBoundaryType = this.state.boundaryTypes[0]
//   }

//   handleMapEntitySelected(event) {
//     if (!event || !event.latLng) {
//       return
//     }
//     if (!event.equipmentFeatures || event.equipmentFeatures.length === 0) {
//       // The map was clicked on, but there was no location under the cursor. Create a new one.
//       this.createMapObject(event, null, true)
//     } else {
//       // The map was clicked on, and there was a location under the cursor
//       var feature = {
//         objectId: event.equipmentFeatures[0].object_id,
//         geometry: {
//           type: 'Point',
//           coordinates: [event.latLng.lng(), event.latLng.lat()]
//         },
//         mapOptions: {
//           draggable: true,
//           icon: '/images/map_icons/aro/plan_equipment.png'
//         },
//         attributes: new EquipmentProperties()
//       }
//       this.createMapObject(event, feature, false)

//       // Stop rendering this location in the tile
//       this.tileDataService.addFeatureToExclude(feature.objectId)
//       this.state.requestMapLayerRefresh.next({})
//     }
//   }

//   calculateCoverage(editableMapObject) {
//     // Get the POST body for optimization based on the current application state
//     var optimizationBody = this.state.getOptimizationBody()
//     // Replace analysis_type and add a point and radius
//     optimizationBody.analysis_type = 'COVERAGE'
//     optimizationBody.point = {
//       type: 'Point',
//       coordinates: editableMapObject.feature.geometry.coordinates
//     }
//     // Always send radius in meters to the back end
//     optimizationBody.radius = this.coverageRadius * this.configuration.units.length_units_to_meters

//     this.$http.post('/service/v1/network-analysis/boundary', optimizationBody)
//     .then((result) => {
//       // Format the result so we can use it to create a polygon
//       var polygonPath = []
//       result.data.polygon.coordinates[0].forEach((polygonVertex) => {
//         polygonPath.push({
//           lat: polygonVertex[1],
//           lng: polygonVertex[0]
//         })
//       })
//       var boundaryFeature = {
//         objectId: this.getUUID(),
//         associatedNetworkNodeId: editableMapObject.feature.objectId,
//         geometry: result.data.polygon,
//         mapOptions: {
//           draggable: false
//         }
//       }
//       var polygonEventHandlers = []
//       var handlers = {
//         onCreate: (boundaryMapObject, geometry, event) => {
//           this.createdEditableObjects.push(boundaryMapObject)
//           this.saveBoundaryToService(boundaryMapObject, editableMapObject.feature.objectId)
//         },
//         onMouseDown: (editableMapObject, geometry, event) => {
//           if (geometry.getEditable()) {
//             // Geometry is already editable. Nothing to do.
//             return
//           }
//           // Remove the editable flag on all created object's geometries
//           this.createdEditableObjects.forEach((createdEditableObject) => {
//             if (createdEditableObject.mapGeometry && createdEditableObject.feature.geometry.type === 'Polygon') {
//               createdEditableObject.mapGeometry.setEditable(false)
//             }
//           })
//           // Make the geometry editable
//           geometry.setEditable(true)
//         }
//       }
//       var boundaryMapObject = new EditableMapObject(this.mapRef, boundaryFeature, handlers)
//       var self = this
//       boundaryMapObject.mapGeometry.getPaths().forEach(function(path, index){
//         google.maps.event.addListener(path, 'insert_at', function(){
//           self.updatePolygonInFeature(boundaryMapObject.mapGeometry, boundaryMapObject)
//           self.saveBoundaryToService(boundaryMapObject, editableMapObject.feature.objectId)
//         });
//         google.maps.event.addListener(path, 'remove_at', function(){
//           self.updatePolygonInFeature(boundaryMapObject.mapGeometry, boundaryMapObject)
//           self.saveBoundaryToService(boundaryMapObject, editableMapObject.feature.objectId)
//         });
//         google.maps.event.addListener(path, 'set_at', function(){
//           self.updatePolygonInFeature(boundaryMapObject.mapGeometry, boundaryMapObject)
//           self.saveBoundaryToService(boundaryMapObject, editableMapObject.feature.objectId)
//         });
//       });
//       google.maps.event.addListener(boundaryMapObject.mapGeometry, 'dragend', function(){
//         self.updatePolygonInFeature(boundaryMapObject.mapGeometry, boundaryMapObject)
//         self.saveBoundaryToService(boundaryMapObject, editableMapObject.feature.objectId)
//       });
//     })
//     .catch((err) => console.error(err))
//   }

//   updatePolygonInFeature(polygon, editableMapObject) {
//     var allPaths = []
//     polygon.getPaths().forEach((path) => {
//       var pathPoints = []
//       path.forEach((latLng) => pathPoints.push([latLng.lng(), latLng.lat()]))
//       allPaths.push(pathPoints)
//     })
//     editableMapObject.feature.geometry = {
//       type: 'Polygon',
//       coordinates: allPaths
//     }
//   }

//   saveBoundaryToService(editableMapObject, networkEquipmentObjectId) {
//     // Save the boundary to aro-service
//     var serviceFeature = {
//       objectId: editableMapObject.feature.objectId,
//       geometry: editableMapObject.feature.geometry,
//       attributes: {
//         network_node_type: 'dslam',
//         boundary_type_id: this.selectedBoundaryType.id,
//         network_node_object_id: networkEquipmentObjectId
//       }
//     }
//     this.$http.post(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment_boundary`, serviceFeature)
//   }

//   selectMapObject(newObjectToSelect) {
//     if (this.selectedMapObject) {
//       this.selectedMapObject.mapGeometry.setIcon('/images/map_icons/aro/plan_equipment.png')
//     }
//     this.selectedMapObject = newObjectToSelect
//     if (this.selectedMapObject) {
//       this.selectedMapObject.mapGeometry.setIcon('/images/map_icons/aro/plan_equipment_selected.png')
//     }
//     this.$timeout()
//   }

//   createMapObject(event, feature, calculateCoverage) {
//     // We are in "Add entity" mode
//     // We may have a feature sent in. If it is, use the properties of that feature
//     var equipmentFeature = null
//     if (feature) {
//       equipmentFeature = feature
//       equipmentFeature.mapOptions = {
//         draggable: true,
//         icon: '/images/map_icons/aro/plan_equipment.png'
//       }
//     } else {
//       equipmentFeature = {
//         objectId: this.getUUID(),
//         geometry: {
//             type: 'Point',
//             coordinates: [event.latLng.lng(), event.latLng.lat()]
//         },
//         mapOptions: {
//           draggable: true,
//           icon: '/images/map_icons/aro/plan_equipment.png'
//         },
//         attributes: new EquipmentProperties()
//       }
//     }
//     var handlers = {
//       onCreate: (editableMapObject) => {
//         this.createdEditableObjects.push(editableMapObject)
//         if (calculateCoverage) {
//           this.calculateCoverage(editableMapObject)
//         }
//         this.selectMapObject(editableMapObject)
//         // Format the object and send it over to aro-service
//         var serviceFeature = {
//           objectId: editableMapObject.feature.objectId,
//           geometry: editableMapObject.feature.geometry,
//           categoryType: 'dslam',
//           attributes: {
//             siteIdentifier: editableMapObject.feature.attributes.siteIdentifier,
//             siteName: editableMapObject.feature.attributes.siteName,
//             selectedSiteType: editableMapObject.feature.attributes.selectedSiteType,
//             deploymentDate: editableMapObject.feature.attributes.deploymentDate,
//             selectedEquipmentType: editableMapObject.feature.attributes.selectedEquipmentType
//           }
//         }
//         this.$http.post(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`, serviceFeature)
//       },
//       onMouseDown: (editableMapObject, geometry, event) => {
//         this.selectMapObject(editableMapObject)
//       },
//       onDragEnd: (editableMapObject, geometry, event) => {
//         // Update the coordinates in the feature
//         editableMapObject.feature.geometry.coordinates = [event.latLng.lng(), event.latLng.lat()]
//         // Remove the boundary geometry associated with this map object (if any)
//         const nodeObjectId = editableMapObject.feature.objectId
//         var indexToDelete = -1
//         this.createdEditableObjects.forEach((mapObj, index) => {
//           if (mapObj.feature.associatedNetworkNodeId === nodeObjectId) {
//             // Remove this boundary
//             mapObj.mapGeometry.setMap(null)
//             indexToDelete = index
//           }
//         })
//         if (indexToDelete >= 0) {
//           var deletedObject = this.createdEditableObjects.splice(indexToDelete, 1)[0]
//           this.$http.delete(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment_boundary/${deletedObject.feature.objectId}`)
//         }
//         this.calculateCoverage(editableMapObject)
//         this.saveFeatureAttributes(editableMapObject.feature)
//       }
//     }
//     var mapObject = new EditableMapObject(this.mapRef, equipmentFeature, handlers)
//   }

//   deleteSelectedObject() {
//     if (!this.selectedMapObject) {
//       console.error('No object selected on map. deleteSelectedObject() should never have been called!')
//       return
//     }
//     // Format the object and send it over to aro-service
//     this.$http.delete(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment/${this.selectedMapObject.feature.objectId}`)
//     // Remove all geometries from map
//     var mapObjectToDelete = this.selectedMapObject
//     // Remove the boundary geometry associated with this map object (if any)
//     const nodeObjectId = mapObjectToDelete.feature.objectId
//     var indexToDelete = -1
//     this.createdEditableObjects.forEach((mapObj, index) => {
//       if (mapObj.feature && mapObj.feature.associatedNetworkNodeId === nodeObjectId) {
//         // Remove this boundary
//         mapObj.mapGeometry.setMap(null)
//         indexToDelete = index
//       }
//     })
//     if (indexToDelete >= 0) {
//       var deletedObject = this.createdEditableObjects.splice(indexToDelete, 1)[0]
//       this.$http.delete(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment_boundary/${deletedObject.feature.objectId}`)
//     }
//     // Delete the equipment
//     this.selectMapObject(null)
//     mapObjectToDelete.mapGeometry.setMap(null)
//     mapObjectToDelete.setFeature(null)
//   }

//   onFeatureAttributeChanged(feature) {
//     feature.attributes.isDirty = true
//   }

//   // Saves the attributes of the given feature into aro-service
//   saveFeatureAttributes(feature) {

//     if (!this.currentTransaction) {
//       console.error('saveFeatureAttributes() - No current transaction. This should never happen.')
//       return
//     } else if (!feature) {
//       console.error('saveFeatureAttributes() - No feature provided.')
//       return
//     }

//     // Format the object and send it over to aro-service
//     var serviceFeature = {
//       objectId: feature.objectId,
//       geometry: feature.geometry,
//       categoryType: 'dslam',
//       attributes: {
//         siteIdentifier: feature.attributes.siteIdentifier,
//         siteName: feature.attributes.siteName,
//         selectedSiteType: feature.attributes.selectedSiteType,
//         deploymentDate: feature.attributes.deploymentDate,
//         selectedEquipmentType: feature.attributes.selectedEquipmentType
//       }
//     }
//     this.$http.put(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`, serviceFeature)
//       .then(() => feature.attributes.isDirty = false)
//       .catch((err) => console.error(err))
//   }

//   removeCreatedMapObjects() {
//     // Remove created objects from map
//     this.createdEditableObjects.forEach((editableObject) => {
//       editableObject.mapGeometry.setMap(null)
//     })
//     this.createdEditableObjects = []
//   }

//   $onDestroy() {
//     //unsubscribe map click observer
//     this.mapFeaturesSelectedEventObserver.unsubscribe();
//     this.removeCreatedMapObjects()
//   }
// }

PlanEditorController.$inject = ['$timeout', '$http', 'state']

let planEditor = {
  templateUrl: '/components/sidebar/plan-editor/plan-editor.html',
  bindings: {
    mapGlobalObjectName: '@'
  },
  controller: PlanEditorController
}

// class EditableMapObject {

//   constructor(map, feature, eventHandlers) {
//     // Object description
//     // feature = {
//     //   objectId: 'xyz',  // Globally unique object ID
//     //   geometry: {
//     //     type: 'Point',
//     //     coordinates: google.maps.LatLng() // Basically whatever we can pass to maps creation
//     //     draggable: true, //or false
//     //     icon: 'icon'  // For point geometries
//     //   },
//     //   mapOptions: {
//     //     draggable: true, // or false
//     //     icon: 'icon' // For point geometries
//     //  }
//     // }

//     // Event handlers - optional, specify only the ones you want to subscribe to
//     // eventHandlers = {
//     //   onCreate,
//     //   onDragStart,
//     //   onDragEnd,
//     //   onChangeGeometry,
//     //   onChangeProperty,
//     //   onMouseDown
//     // }
//     this.eventHandlers = eventHandlers
//     this.setFeature(map, feature)

//     // Raise the onCreate event
//     this.eventHandlers.onCreate && this.eventHandlers.onCreate(this)
//   }

//   setFeature(map, feature) {
//     // Clear any previously created geometries
//     if (this.mapGeomety) {
//       this.mapGeometry.setMap(null)
//     }
//     this.mapGeometry = {}
//     this.feature = feature
//     if (feature) {
//       this.createMapGeometry(map)
//     }
//   }

//   createMapGeometry(map) {

//     // Create the map object
//     switch(this.feature.geometry.type) {
//       case 'Point':
//         this.mapGeometry = new google.maps.Marker({
//           position: new google.maps.LatLng(this.feature.geometry.coordinates[1], this.feature.geometry.coordinates[0]),
//           icon: this.feature.mapOptions.icon,
//           draggable: this.feature.mapOptions.draggable,
//           map: map,
//           editableMapObject: this
//         })
//       break;

//       case 'Polygon':
//         var polygonPath = []
//         this.feature.geometry.coordinates[0].forEach((polygonVertex) => {
//           polygonPath.push({
//             lat: polygonVertex[1],
//             lng: polygonVertex[0]
//           })
//         })
//         this.mapGeometry = new google.maps.Polygon({
//           paths: polygonPath,
//           strokeColor: '#FF1493',
//           strokeOpacity: 0.8,
//           strokeWeight: 2,
//           fillColor: '#FF1493',
//           fillOpacity: 0.4,
//           clickable: true,
//           draggable: this.feature.mapOptions.draggable
//         })
//         this.mapGeometry.setMap(map)

//       break;

//       default:
//         throw `createMapObject() does not support geometries with type ${this.feature.geometry.type}`
//     }
    
//     // Subscribe to map object events
//     this.mapGeometry.addListener('dragstart', (event) => this.eventHandlers.onDragStart && this.eventHandlers.onDragStart(this, this.mapGeometry, event))
//     this.mapGeometry.addListener('dragend', (event) => this.eventHandlers.onDragEnd && this.eventHandlers.onDragEnd(this, this.mapGeometry, event))
//     this.mapGeometry.addListener('mousedown', (event) => this.eventHandlers.onMouseDown && this.eventHandlers.onMouseDown(this, this.mapGeometry, event))
//   }
// }


export default planEditor
