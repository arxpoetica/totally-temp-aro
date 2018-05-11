import EquipmentProperties from './equipment-properties'
import BoundaryProperties from './boundary-properties'
import Constants from '../../common/constants'

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
    this.boundaryCoverageById = {}
    this.objectIdsToHide = new Set()
    this.currentTransaction = null
    this.lastSelectedEquipmentType = 'Generic ADSL'
    this.lastUsedBoundaryDistance = 10000
    this.Constants = Constants
    this.deleteObjectWithId = null // A function into the child map object editor, requesting the specified map object to be deleted
    this.isComponentDestroyed = false // Useful for cases where the user destroys the component while we are generating boundaries
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
    
    this.censusCategories = this.state.censusCategories.getValue()
    this.state.censusCategories.subscribe((newValue) => {
      this.censusCategories = newValue
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
        this.equipmentIdToBoundaryId = {}
        this.boundaryIdToEquipmentId = {}
        // Important: Create the map objects first. The events raised by the map object editor will
        // populate the objectIdToMapObject object when the map objects are created
        this.createMapObjects && this.createMapObjects(result.data)
        // We now have objectIdToMapObject populated.
        result.data.forEach((feature) => {
          const attributes = feature.attributes
          const properties = new EquipmentProperties(attributes.siteIdentifier, attributes.siteName,
                                                     'dslam', attributes.selectedEquipmentType)
          this.objectIdToProperties[feature.objectId] = properties
        })
        return this.$http.get(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment_boundary`)
      })
      .then((result) => {
        // Save the properties for the boundary
        result.data.forEach((feature) => {
          console.log(feature)
          const attributes = feature.attributes
          const distance = Math.round(attributes.distance * this.configuration.units.meters_to_length_units)
          const properties = new BoundaryProperties(+attributes.boundary_type_id, attributes.selected_site_move_update,
                                                    attributes.selected_site_boundary_generation, distance,
                                                    attributes.spatialEdgeType)
          this.objectIdToProperties[feature.objectId] = properties
          
        })
        // Save the equipment and boundary ID associations
        result.data.forEach((boundaryFeature) => {
          var equipmentId = boundaryFeature.attributes.network_node_object_id
          var boundaryId = boundaryFeature.objectId
          this.equipmentIdToBoundaryId[equipmentId] = boundaryId
          this.boundaryIdToEquipmentId[boundaryId] = equipmentId
        })
        this.updateObjectIdsToHide()
        // We have a list of equipment boundaries. Populate them in the map object
        this.createMapObjects && this.createMapObjects(result.data)
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
    var equipmentMapObject = this.objectIdToMapObject[eventArgs.targetObjectId]
    if (!equipmentMapObject) {
      console.error(`And object was dropped on marker with id ${eventArgs.targetObjectId}, but this id does not exist in this.objectIdToMapObject`)
      return
    }
    // Delete the associated boundary if it exists
    const boundaryObjectId = this.equipmentIdToBoundaryId[equipmentMapObject.objectId]
    const spatialEdgeType = eventArgs.dropEvent.dataTransfer.getData(Constants.DRAG_DROP_ENTITY_DETAILS_KEY)
    //if (boundaryObjectId) {
    //  delete this.equipmentIdToBoundaryId[equipmentMapObject.objectId]
    //  delete this.boundaryIdToEquipmentId[boundaryObjectId]
    //  this.deleteObjectWithId && this.deleteObjectWithId(boundaryObjectId)
    //}
    this.deleteBoundary(boundaryObjectId)
    
    this.calculateCoverage(equipmentMapObject, spatialEdgeType)
  }
  
  
  
  
  
  
  
  
  
  
  
  
  onRequestCalculateCoverage(){
    
    if (this.selectedMapObject && !this.isMarker(this.selectedMapObject)){
      var boundaryId = this.selectedMapObject.objectId 
      var objectId = this.boundaryIdToEquipmentId[boundaryId]
      var mapObject = this.objectIdToMapObject[objectId]
      var spatialEdgeType = this.objectIdToProperties[objectId].spatialEdgeType
      console.log(mapObject)
      this.deleteBoundary(boundaryId)
      this.calculateCoverage(mapObject, spatialEdgeType);
    }
  }
  
  calculateCoverage(mapObject, spatialEdgeType) {
    // Get the POST body for optimization based on the current application state
    var optimizationBody = this.state.getOptimizationBody()
    // Replace analysis_type and add a point and radius
    optimizationBody.analysis_type = 'COVERAGE'
    optimizationBody.point = {
      type: 'Point',
      coordinates: [mapObject.position.lng(), mapObject.position.lat()]
    }
    optimizationBody.spatialEdgeType = spatialEdgeType;
    optimizationBody.directed = (spatialEdgeType === Constants.SPATIAL_EDGE_COPPER)  // directed analysis if we are using copper networks
    // Always send radius in meters to the back end
    optimizationBody.radius = this.lastUsedBoundaryDistance * this.configuration.units.length_units_to_meters

    var equipmentObjectId = mapObject.objectId
    this.$http.post('/service/v1/network-analysis/boundary', optimizationBody)
      .then((result) => {
        // The user may have destroyed the component before we get here. In that case, just return
        if (this.isComponentDestroyed) {
          console.warn('Plan editor was closed while a boundary was being calculated')
          return
        }
        // Construct a feature that we will pass to the map object editor, which will create the map object
        var boundaryProperties = new BoundaryProperties(this.state.selectedBoundaryType.id, 'Auto-redraw', 'Road Distance',
                                                        Math.round(optimizationBody.radius * this.configuration.units.meters_to_length_units),
                                                        optimizationBody.spatialEdgeType)
        var feature = {
          objectId: this.getUUID(),
          geometry: {
            type: 'Polygon',
            coordinates: result.data.polygon.coordinates
          },
          attributes: {
            network_node_type: 'dslam',
            boundary_type_id: boundaryProperties.selectedSiteBoundaryTypeId,
            selected_site_move_update: boundaryProperties.selectedSiteMoveUpdate,
            selected_site_boundary_generation: boundaryProperties.selectedSiteBoundaryGeneration,
            network_node_object_id: equipmentObjectId, // This is the Network Equipment that this boundary is associated with
            spatialEdgeType: boundaryProperties.spatialEdgeType
          }
        }
        this.objectIdToProperties[feature.objectId] = boundaryProperties
        this.boundaryIdToEquipmentId[feature.objectId] = equipmentObjectId
        this.equipmentIdToBoundaryId[equipmentObjectId] = feature.objectId
        this.createMapObjects && this.createMapObjects([feature])
        
        this.digestBoundaryCoverage(feature.objectId, result.data)
        //this.showCoverageChart(feature.objectId)
        
        console.log(result)
      })
      .catch((err) => console.error(err))
  }
  
  
  digestBoundaryCoverage(objectId, boundaryData){
    var boundsCoverage = {}
    boundsCoverage.boundaryData = boundaryData
    var locations = []
    var censusBlockCountById = {}
    var barChartData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    
    for (var localI=0; localI<boundaryData.coverageInfo.length; localI++){
      var location = boundaryData.coverageInfo[localI]
      if ("number" != typeof location.distance) continue // skip these 
      
      locations.push(location)
      if (!censusBlockCountById.hasOwnProperty(location.censusBlockId)){
        censusBlockCountById[location.censusBlockId] = 0
      }
      censusBlockCountById[location.censusBlockId]++
      var dist = location.distance
      var barIndex = Math.floor(dist / 1000)
      if (barIndex >= barChartData.length || 'undefined' == typeof barChartData[barIndex]){
        barChartData[barIndex] = 0
      }
      barChartData[barIndex]++
    }
    
    
    boundsCoverage.boundaryData.coverageInfo = locations
    boundsCoverage.censusBlockCountById = censusBlockCountById
    boundsCoverage.barChartData = barChartData
    
    this.boundaryCoverageById[objectId] = boundsCoverage
    
    this.getCensusTagsForBoundaryCoverage(objectId)
    
    console.log(boundsCoverage.censusBlockCountById)
  }
  
  getCensusTagsForBoundaryCoverage(objectId){
    console.log(this.censusCategories)
    //this.boundaryCoverageById[objectId]
    
    var censusBlockIds = Object.keys(this.boundaryCoverageById[objectId].censusBlockCountById)
    if (censusBlockIds.length > 0){
      //id eq 61920 or id eq 56829
      var filter = ''
      for (var cbI=0; cbI<censusBlockIds.length; cbI++){
        if (cbI>0){
          filter += ' or '
        }
        filter += 'id eq '+censusBlockIds[cbI]
      }
      var entityListUrl = `/service/odata/censusBlocksEntity?$select=id,tagInfo&$filter=${filter}`
      this.$http.get(entityListUrl).then((results) => {
        console.log(results)
        var censusTagsByCat = {}
        // iterate through each censusblock
        for (var rowI=0; rowI<results.data.length; rowI++){
          var row = results.data[rowI]
          console.log(row)
          var tagInfo = this.formatCensusBlockData(row.tagInfo)
          console.log(tagInfo)
          
          // iterate through each category of the CB
          Object.keys(tagInfo).forEach((catId) => {
            var tagIds = tagInfo[catId]
            if (!censusTagsByCat.hasOwnProperty(catId)){
              censusTagsByCat[catId] = {}
              censusTagsByCat[catId].description = this.censusCategories[catId].description
              censusTagsByCat[catId].tags = {}
            }
            
            // iterate through each tag of the category 
            tagIds.forEach((tagId) => {
              if (!censusTagsByCat[catId].tags.hasOwnProperty(tagId)){
                censusTagsByCat[catId].tags[tagId] = {}
                censusTagsByCat[catId].tags[tagId].description = this.censusCategories[catId].tags[tagId].description
                censusTagsByCat[catId].tags[tagId].count = 0
              }
              console.log(this.boundaryCoverageById[objectId].censusBlockCountById[row.id])
              censusTagsByCat[catId].tags[tagId].count += this.boundaryCoverageById[objectId].censusBlockCountById[row.id]
            })
            
          })
        }
        
        console.log(censusTagsByCat)
        this.boundaryCoverageById[objectId].censusTagsByCat = censusTagsByCat
      })
      
    }else{
      this.boundaryCoverageById[objectId].censusTagsByCat = {}
    }
  }
  
  // ToDo: very similar to the code in tile-data-service.js
  formatCensusBlockData(tagData){
    var sepA = ';'
    var sepB = ':'
    var kvPairs = tagData.split( sepA )
    var tags = {}
    kvPairs.forEach((pair) => {
      var kv = pair.split( sepB )
      // incase there are extra ':'s in the value we join all but the first together 
      if ("" != kv[0]) tags[ ""+kv[0] ] = kv.slice(1)
    }) 
    return tags 
  }
  
  showCoverageChart(){
    var objectId = this.selectedMapObject.objectId
    //this.boundaryCoverageById[objectId]
    var ctx = document.getElementById('plan-editor-bounds-dist-chart').getContext('2d');
    
    var data = this.boundaryCoverageById[objectId].barChartData
    var labels = []
    for (var i=0; i<data.length; i++){
      labels.push((i+1)*1000)
    }
    
    var settingsData = {
      labels: labels,
      datasets: [{
          label: "residential",
          backgroundColor: '#76c793',
          borderColor: '#76c793',
          data: data
      }]
    }
    
    var options = {
      title: {
        display: true,
        text: 'Locations by Distance'
      },
      legend: {
        display: true,
        position: 'bottom'
      }, 
      scales: {
        yAxes: [{
          scaleLabel: {
            display: true,
            labelString: 'locations'
          }
        }], 
        xAxes: [{
          scaleLabel: {
            display: true,
            labelString: 'distance, '+this.configuration.units.length_units, 
            gridLines: {
              offsetGridLines: false
            }
          }
        }]
      }     
    }
    
    console.log(data)
    var coverageChart = new Chart(ctx, {
      type: 'bar',
      data: settingsData,
      options: options
    });
  }
  
  
  
  // --- //
  
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

  // Marks the properties of the selected equipment boundary as dirty (changed).
  markSelectedBoundaryPropertiesDirty() {
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
      networkNodeType: 'dslam',
      attributes: {
        siteIdentifier: objectProperties.siteIdentifier,
        siteName: objectProperties.siteName,
        selectedEquipmentType: objectProperties.selectedEquipmentType
      },
      dataType: 'equipment'
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

    const boundaryProperties = this.objectIdToProperties[objectId]
    var serviceFeature = {
      objectId: objectId,
      geometry: {
        type: 'Polygon',
        coordinates: allPaths
      },
      attributes: {
        network_node_type: 'dslam',
        boundary_type_id: boundaryProperties.selectedSiteBoundaryTypeId,
        selected_site_move_update: boundaryProperties.selectedSiteMoveUpdate,
        selected_site_boundary_generation: boundaryProperties.selectedSiteBoundaryGeneration,
        network_node_object_id: this.boundaryIdToEquipmentId[objectId],
        spatialEdgeType: boundaryProperties.spatialEdgeType
      },
      dataType: 'equipment_boundary'
    }
    return serviceFeature
  }

  // Saves the properties of the selected location to aro-service
  saveSelectedEquipmentProperties() {
    if (this.selectedMapObject && this.isMarker(this.selectedMapObject)) {
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

  // Saves the properties of the selected boundary to aro-service
  saveSelectedBoundaryProperties() {
    if (this.selectedMapObject && !this.isMarker(this.selectedMapObject)) {
      var selectedMapObject = this.selectedMapObject  // May change while the $http.post() is returning
      var boundaryObjectForService = this.formatBoundaryForService(selectedMapObject.objectId)
      this.$http.put(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment_boundary`, boundaryObjectForService)
        .then((result) => {
          this.objectIdToProperties[selectedMapObject.objectId].isDirty = false
          this.$timeout()
        })
        .catch((err) => console.error(err))
    }
  }

  // Returns the configuration of the currently selected network type
  getSelectedNetworkConfig() {
    var layers = this.configuration.networkEquipment.equipments
    var networkNodeType = this.objectIdToProperties[this.selectedMapObject.objectId].siteNetworkNodeType
    return layers[networkNodeType]
  }

  isMarker(mapObject) {
    return mapObject && mapObject.icon
  }

  handleObjectCreated(mapObject, usingMapClick, feature) {
    this.objectIdToMapObject[mapObject.objectId] = mapObject
    if (usingMapClick && this.isMarker(mapObject)) {
      // This is a equipment marker and not a boundary. We should have a better way of detecting this
      this.objectIdToProperties[mapObject.objectId] = new EquipmentProperties('', '', 'dslam', this.lastSelectedEquipmentType)
      var equipmentObject = this.formatEquipmentForService(mapObject.objectId)
      this.$http.post(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`, equipmentObject)
    } else if (!this.isMarker(mapObject)) {
      // If the user has drawn the boundary, we will have an associated object in the "feature" attributes. Save associations.
      if (usingMapClick && feature && feature.attributes && feature.attributes.network_node_object_id) {
        // If the associated equipment has a boundary associated with it, first delete *that* boundary
        var existingBoundaryId = this.equipmentIdToBoundaryId[feature.attributes.network_node_object_id]
        
        //if (existingBoundaryId) {
        //  delete this.equipmentIdToBoundaryId[feature.attributes.network_node_object_id]
        //  delete this.boundaryIdToEquipmentId[existingBoundaryId]
        //  this.deleteObjectWithId && this.deleteObjectWithId(existingBoundaryId)
        //  existingBoundaryId = null
        //}
        this.deleteBoundary(existingBoundaryId)
        existingBoundaryId = null
        
        this.objectIdToProperties[mapObject.objectId] = new BoundaryProperties(this.state.selectedBoundaryType.id, 'Auto-redraw', 'Road Distance', 0)
        this.boundaryIdToEquipmentId[mapObject.objectId] = feature.attributes.network_node_object_id
        this.equipmentIdToBoundaryId[feature.attributes.network_node_object_id] = mapObject.objectId
      }
      var serviceFeature = this.formatBoundaryForService(mapObject.objectId)
      this.$http.post(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment_boundary`, serviceFeature)
        .catch((err) => console.error(err))
    }
    this.updateObjectIdsToHide()
    this.$timeout()
  }
  
  
  
  
  
  deleteBoundary(boundaryId){
    if (!boundaryId) return
    var eqId = this.boundaryIdToEquipmentId[boundaryId]
    delete this.equipmentIdToBoundaryId[eqId]
    delete this.boundaryIdToEquipmentId[boundaryId]
    this.deleteObjectWithId && this.deleteObjectWithId(boundaryId)
  }
  
  handleSelectedObjectChanged(mapObject) {
    console.log(mapObject)
    this.selectedMapObject = mapObject
    this.$timeout()
  }

  handleObjectModified(mapObject) {
    if (this.isMarker(mapObject)) {
      // This is a equipment marker and not a boundary. We should have a better way of detecting this
      var equipmentObject = this.formatEquipmentForService(mapObject.objectId)
      this.$http.post(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`, equipmentObject)
        .then((result) => {
          this.objectIdToProperties[mapObject.objectId].isDirty = false
          this.$timeout()
        })
        .catch((err) => console.error(err))
      // Get the associated boundary (if any)
      const boundaryObjectId = this.equipmentIdToBoundaryId[mapObject.objectId]
      if (boundaryObjectId) {
        // We have a boundary object. Delete it and recalculate coverage only if the boundary properties say to do so.
        const boundaryProperties = this.objectIdToProperties[boundaryObjectId]
        if (boundaryProperties.selectedSiteMoveUpdate === 'Auto-redraw') {
          //delete this.equipmentIdToBoundaryId[mapObject.objectId]
          //delete this.boundaryIdToEquipmentId[boundaryObjectId]
          //this.deleteObjectWithId && this.deleteObjectWithId(boundaryObjectId)
          this.deleteBoundary(boundaryObjectId)
          
          this.calculateCoverage(mapObject, boundaryProperties.spatialEdgeType)
        }
      }
    } else {
      // This is a boundary feature. If it is modified, change the update style to 'Don't update'
      const boundaryProperties = this.objectIdToProperties[mapObject.objectId]
      boundaryProperties.selectedSiteMoveUpdate = 'Don\'t update'
      this.$timeout()
      var serviceFeature = this.formatBoundaryForService(mapObject.objectId)
      this.$http.put(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment_boundary`, serviceFeature)
        .catch((err) => console.error(err))
    }
  }

  handleObjectDeleted(mapObject) {
    if (this.isMarker(mapObject)) {
      // This is a equipment marker and not a boundary. We should have a better way of detecting this
      this.$http.delete(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment/${mapObject.objectId}`)
      // If this is an equipment, delete its associated boundary (if any)
      const boundaryObjectId = this.equipmentIdToBoundaryId[mapObject.objectId]
      //if (boundaryObjectId) {
        //delete this.equipmentIdToBoundaryId[mapObject.objectId]
        //delete this.boundaryIdToEquipmentId[boundaryObjectId]
        //this.deleteObjectWithId && this.deleteObjectWithId(boundaryObjectId)
        // No need to delete from the server, we will get another delete event for the boundary.
      //}
      this.deleteBoundary(boundaryObjectId)
    } else {
      this.$http.delete(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment_boundary/${mapObject.objectId}`)
    }
  }

  handleSiteBoundaryTypeChanged() {
    this.saveSelectedBoundaryProperties() // I don't like to do this, but the boundary type affects the visibility of the boundary, so best to save it here.
    this.updateObjectIdsToHide()
  }
  
  toggleSiteBoundary() {
    //if(this.state.showSiteBoundary && this.selectedBoundaryType) {
      this.state.viewSettingsChanged.next()
    //} 
  }
  
  updateObjectIdsToHide() {
    this.objectIdsToHide = new Set()
    Object.keys(this.objectIdToProperties).forEach((objectId) => {
      var properties = this.objectIdToProperties[objectId]
      if ((properties instanceof BoundaryProperties)  // This is a boundary property
          && (this.state.selectedBoundaryType.id !== properties.selectedSiteBoundaryTypeId  // The selected boundary id does not match this objects boundary id
              || !this.state.showSiteBoundary)) {     // The checkbox for showing site boundaries is not selected
        this.objectIdsToHide.add(objectId)
      }
    })
  }

  $doCheck() {
    // Doing it this way because we don't have a better way to detect when state.selectedBoundaryType has changed
    if (this.state.selectedBoundaryType.id !== this.cachedSelectedBoundaryTypeId
        || this.state.showSiteBoundary !== this.cachedShowSiteBoundary) {
      // Selected boundary type has changed. See if we want to hide any boundary objects
      this.updateObjectIdsToHide()
      this.cachedSelectedBoundaryTypeId = this.state.selectedBoundaryType.id
      this.cachedShowSiteBoundary = this.state.showSiteBoundary
    }
  }

  $onDestroy() {
    // Useful for cases where the boundary is still generating, but the component has been destroyed. We do not want to create map objects in that case.
    this.isComponentDestroyed = true
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
