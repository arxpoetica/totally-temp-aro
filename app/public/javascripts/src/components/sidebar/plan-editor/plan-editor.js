import EquipmentProperties from './equipment-properties'
import BoundaryProperties from './boundary-properties'
import Constants from '../../common/constants'
import AroFeatureFactory from '../../../service-typegen/dist/AroFeatureFactory'
import EquipmentFeature from '../../../service-typegen/dist/EquipmentFeature'


class PlanEditorController {

  constructor($timeout, $http, $element, state, configuration) {
    this.$timeout = $timeout
    this.$http = $http
    this.$element = $element
    this.state = state
    this.configuration = configuration
    this.selectedMapObject = null
    //this.selectedEquipmentInfo = {}
    this.objectIdToProperties = {}
    this.objectIdToMapObject = {}
    this.boundaryIdToEquipmentId = {}
    this.equipmentIdToBoundaryId = {}
    this.boundaryCoverageById = {}
    this.objectIdsToHide = new Set()
    this.subnetMapObjects = {}
    this.currentTransaction = null
    this.lastSelectedEquipmentType = 'Generic ADSL'
    this.lastUsedBoundaryDistance = 10000
    this.Constants = Constants
    this.deleteObjectWithId = null // A function into the child map object editor, requesting the specified map object to be deleted
    this.isComponentDestroyed = false // Useful for cases where the user destroys the component while we are generating boundaries
    this.isWorkingOnCoverage = false
    this.uuidStore = []
    this.autoRecalculateSubnet = true
    this.stickyAssignment = true
    this.coSearchType = 'SERVICE_AREA'
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
      'central_office',
      'dslam',
      'fiber_distribution_hub',
      'fiber_distribution_terminal',
      'cell_5g',
      'splice_point',
      'bulk_distribution_terminal'
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
    // We should have a map variable at this point
    if (!window[this.mapGlobalObjectName]) {
      console.error('ERROR: Map Object Editor component initialized, but a map object is not available at this time.')
      return
    }
    this.mapRef = window[this.mapGlobalObjectName]

    // Select the first transaction in the list
    this.resumeOrCreateTransaction()
  }

  resumeOrCreateTransaction() {
    this.removeMapObjects && this.removeMapObjects()
    this.currentTransaction = null
    // See if we have an existing transaction for the currently selected location library
    this.$http.get(`/service/plan-transaction?user_id=${this.state.loggedInUser.id}`)
      .then((result) => {
        if (result.data.length > 0) {
          // At least one transaction exists. Return it
          return Promise.resolve({
            data: result.data[0]
          })
        } else {
          // Create a new transaction and return it.
          return this.$http.post(`/service/plan-transactions`, { userId: this.state.loggedInUser.id, planId: this.state.plan.getValue().id })
        }
      }).then((result) => {
        this.currentTransaction = result.data
        return this.$http.get(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`)
      }).then((result) => {
        // We have a list of features. Replace them in the objectIdToProperties map.
        this.objectIdToProperties = {}
        this.objectIdToMapObject = {}
        this.equipmentIdToBoundaryId = {}
        this.boundaryIdToEquipmentId = {}
        // Save the iconUrls in the list of objects returned from aro-service
        result.data.forEach((item) => item.iconUrl = this.configuration.networkEquipment.equipments[item.networkNodeType].iconUrl)
        // Important: Create the map objects first. The events raised by the map object editor will
        // populate the objectIdToMapObject object when the map objects are created
        this.createMapObjects && this.createMapObjects(result.data)
        // We now have objectIdToMapObject populated.
        result.data.forEach((feature) => {
          const attributes = feature.attributes
          var networkNodeEquipment = AroFeatureFactory.createObject(feature).networkNodeEquipment
          const properties = new EquipmentProperties(attributes.siteIdentifier, attributes.siteName,
                                                     feature.networkNodeType, attributes.selectedEquipmentType, networkNodeEquipment)
          this.objectIdToProperties[feature.objectId] = properties
        })
        return this.$http.get(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment_boundary`)
      }).then((result) => {
        // Save the properties for the boundary
        result.data.forEach((feature) => {
          const attributes = feature.attributes
          const distance = Math.round(attributes.distance * this.configuration.units.meters_to_length_units)
          const properties = new BoundaryProperties(+attributes.boundary_type_id, attributes.selected_site_move_update,
                                                    attributes.selected_site_boundary_generation, distance,
                                                    attributes.spatialEdgeType, attributes.directed)
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
    const edgeOptions = JSON.parse(eventArgs.dropEvent.dataTransfer.getData(Constants.DRAG_DROP_ENTITY_DETAILS_KEY))
    this.deleteBoundary(boundaryObjectId)
    
    this.calculateCoverage(equipmentMapObject, edgeOptions.spatialEdgeType, edgeOptions.directed)
  }
  
  
  onRequestCalculateCoverage(){
    if (this.selectedMapObject && !this.isMarker(this.selectedMapObject)){
      var boundaryId = this.selectedMapObject.objectId 
      var objectId = this.boundaryIdToEquipmentId[boundaryId]
      var mapObject = this.objectIdToMapObject[objectId]
      var spatialEdgeType = this.objectIdToProperties[objectId].spatialEdgeType
      this.deleteBoundary(boundaryId)
      this.calculateCoverage(mapObject, spatialEdgeType);
    }
  }
  
  calculateCoverage(mapObject, spatialEdgeType, directed) {
    // Get the POST body for optimization based on the current application state
    var optimizationBody = this.state.getOptimizationBody()
    // Replace analysis_type and add a point and radius
    optimizationBody.analysis_type = 'COVERAGE'
    optimizationBody.point = {
      type: 'Point',
      coordinates: [mapObject.position.lng(), mapObject.position.lat()]
    }
    optimizationBody.spatialEdgeType = spatialEdgeType;
    optimizationBody.directed = directed  // directed analysis if thats what the user wants
    // Always send radius in meters to the back end
    optimizationBody.radius = this.lastUsedBoundaryDistance * this.configuration.units.length_units_to_meters

    var equipmentObjectId = mapObject.objectId
    this.isWorkingOnCoverage = true
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
                                                        optimizationBody.spatialEdgeType, optimizationBody.directed)
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
            spatialEdgeType: boundaryProperties.spatialEdgeType,
            directed: boundaryProperties.directed
          }
        }
        this.objectIdToProperties[feature.objectId] = boundaryProperties
        this.boundaryIdToEquipmentId[feature.objectId] = equipmentObjectId
        this.equipmentIdToBoundaryId[equipmentObjectId] = feature.objectId
        this.createMapObjects && this.createMapObjects([feature])
        
        this.digestBoundaryCoverage(feature.objectId, result.data)
        this.isWorkingOnCoverage = false
      })
      .catch((err) => {
        console.error(err)
        this.isWorkingOnCoverage = false
      })
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
      if ('feet' == this.configuration.units.length_units) location.distance *= 3.28084
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
  }
  
  getCensusTagsForBoundaryCoverage(objectId){
    var censusBlockIds = Object.keys(this.boundaryCoverageById[objectId].censusBlockCountById)
    
    if (censusBlockIds.length > 0){
      //id eq 61920 or id eq 56829
      // we can't ask for more than about 100 at a time so we'll have to split up the batches 
      var filter = ''
      var filterSets = []
      for (var cbI=0; cbI<censusBlockIds.length; cbI++){
        var setIndex = Math.floor( cbI / 100)
        if ("string" != typeof filterSets[setIndex]){
          filterSets[setIndex] = ''
        }else{
          filterSets[setIndex] += ' or '
        }
        filterSets[setIndex] += 'id eq '+censusBlockIds[cbI]
      }
      
      var censusBlockPromises = []
      for (var promiseI=0; promiseI<filterSets.length; promiseI++){
        var entityListUrl = `/service/odata/censusBlocksEntity?$select=id,tagInfo&$filter=${filterSets[promiseI]}`
        censusBlockPromises.push(this.$http.get(entityListUrl))
      }
      Promise.all(censusBlockPromises).then((results) => {
        var rows = []
        for (var resultI=0; resultI<results.length; resultI++){
          rows = rows.concat(results[resultI].data)
        }
        var censusTagsByCat = {}
        // iterate through each censusblock
        for (var rowI=0; rowI<rows.length; rowI++){
          var row = rows[rowI]
          var tagInfo = this.formatCensusBlockData(row.tagInfo)
          
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
                // ToDo: check that this.censusCategories[catId].tags[tagId] exists! 
                var isError = false
                
                if ( !this.censusCategories.hasOwnProperty(catId) ){
                  isError = true
                  console.error(`Unrecognized census category Id: ${catId} on census block with Id: ${row.id}`)
                }else if( !this.censusCategories[catId].tags.hasOwnProperty(tagId) ){
                  isError = true
                  console.error(`Unrecognized census tag Id: ${tagId} on census block with Id: ${row.id}`)
                }else{
                  censusTagsByCat[catId].tags[tagId] = {}
                  censusTagsByCat[catId].tags[tagId].description = this.censusCategories[catId].tags[tagId].description
                  censusTagsByCat[catId].tags[tagId].colourHash = this.censusCategories[catId].tags[tagId].colourHash
                  censusTagsByCat[catId].tags[tagId].count = 0
                }
              }
              if (!isError) censusTagsByCat[catId].tags[tagId].count += this.boundaryCoverageById[objectId].censusBlockCountById[row.id]
            })
            
          })
        }
        this.boundaryCoverageById[objectId].censusTagsByCat = censusTagsByCat
        this.$timeout()
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
    var ctx = this.$element.find('canvas.plan-editor-bounds-dist-chart')[0].getContext('2d')
    
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
    
    var coverageChart = new Chart(ctx, {
      type: 'bar',
      data: settingsData,
      options: options
    });
  }
  
  // --- //
  
  objKeys(obj){
    if ('undefined' == typeof obj) obj = {}
    return Object.keys(obj)
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
      networkNodeType: objectProperties.siteNetworkNodeType,
      attributes: {
        siteIdentifier: objectProperties.siteIdentifier,
        siteName: objectProperties.siteName,
        selectedEquipmentType: objectProperties.selectedEquipmentType
      },
      dataType: 'equipment', 
      networkNodeEquipment: objectProperties.networkNodeEquipment
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
    
    var objectProperties = this.objectIdToProperties[ this.boundaryIdToEquipmentId[objectId] ]
    const boundaryProperties = this.objectIdToProperties[objectId]
    var serviceFeature = {
      objectId: objectId,
      geometry: {
        type: 'Polygon',
        coordinates: allPaths
      },
      attributes: {
        network_node_type: objectProperties.siteNetworkNodeType,
        boundary_type_id: boundaryProperties.selectedSiteBoundaryTypeId,
        selected_site_move_update: boundaryProperties.selectedSiteMoveUpdate,
        selected_site_boundary_generation: boundaryProperties.selectedSiteBoundaryGeneration,
        network_node_object_id: this.boundaryIdToEquipmentId[objectId],
        spatialEdgeType: boundaryProperties.spatialEdgeType,
        directed: boundaryProperties.directed
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
    return this.getNetworkConfig(this.selectedMapObject.objectId)
  }
  
  getSelectedBoundaryNetworkConfig() {
    return this.getNetworkConfig(this.boundaryIdToEquipmentId[this.selectedMapObject.objectId])
  }
  
  getNetworkConfig(objectId){
    if (!this.objectIdToProperties.hasOwnProperty(objectId)) {
      return
    }
    var layers = this.configuration.networkEquipment.equipments
    var networkNodeType = this.objectIdToProperties[objectId].siteNetworkNodeType
    
    // ToDo: there are discrepancies in out naming, fix that
    if ('fiber_distribution_hub' == networkNodeType) networkNodeType = 'fdh' 
    if ('fiber_distribution_terminal' == networkNodeType) networkNodeType = 'fdt' 
    if ('cell_5g' == networkNodeType) networkNodeType = 'fiveg_site'
    return layers[networkNodeType]
  }
  
  isMarker(mapObject) {
    return mapObject && mapObject.icon
  }

  handleObjectCreated(mapObject, usingMapClick, feature) {
    this.objectIdToMapObject[mapObject.objectId] = mapObject
    if (usingMapClick && this.isMarker(mapObject)) {
      // This is a equipment marker and not a boundary. We should have a better way of detecting this
      var isNew = true
      if (feature.isExistingObject) {
        // clone of existing or planned equipment
        const planId = this.state.plan.getValue().id
        // Add modified features to vector tiles and do the rendering, etc.
        this.state.clearTileCachePlanOutputs()
        this.state.loadModifiedFeatures(planId)
          .then(() => {
            this.state.requestRecreateTiles.next({})
            this.state.requestMapLayerRefresh.next({})
            return this.$http.get(`/service/plan-feature/${planId}/equipment/${mapObject.objectId}?userId=${this.state.loggedInUser.id}`)
          })
          .then((result) => {
            var attributes = result.data.attributes
            const equipmentFeature = AroFeatureFactory.createObject(result.data)
            var networkNodeEquipment = equipmentFeature.networkNodeEquipment
            this.objectIdToProperties[mapObject.objectId] = new EquipmentProperties(networkNodeEquipment.siteInfo.siteClli, networkNodeEquipment.siteInfo.siteName,
                                                                                    equipmentFeature.networkNodeType, null, networkNodeEquipment)
            var equipmentObject = this.formatEquipmentForService(mapObject.objectId)
            this.$http.post(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`, equipmentObject)
              .then(() => this.$http.get(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`))
              .then((result) => {
                // Always assign subnet parent on object creation, even if we are not creating a route. This way, if the user
                // later turns on auto-recalculate, it will generate the entire subnet.
                var currentEquipmentWithSubnetId = result.data.filter((item) => item.objectId === equipmentObject.objectId)[0]
                return this.assignSubnetParent(currentEquipmentWithSubnetId)
              })
              .then(() => {
                if (this.autoRecalculateSubnet) {
                  this.recalculateSubnetForEquipmentChange(feature)
                }
              })
              .catch((err) => console.error(err))
            this.$timeout()
          })
          .catch((err) => console.error(err))
      } else {
        // nope it's new
        var blankNetworkNodeEquipment = AroFeatureFactory.createObject({dataType:"equipment"}).networkNodeEquipment
        this.objectIdToProperties[mapObject.objectId] = new EquipmentProperties('', '', feature.networkNodeType, this.lastSelectedEquipmentType, blankNetworkNodeEquipment)
        var equipmentObject = this.formatEquipmentForService(mapObject.objectId)
        this.$http.post(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`, equipmentObject)
          .then(() => this.$http.get(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`))
          .then((result) => {
            // Always assign subnet parent on object creation, even if we are not creating a route. This way, if the user
            // later turns on auto-recalculate, it will generate the entire subnet.
            var currentEquipmentWithSubnetId = result.data.filter((item) => item.objectId === equipmentObject.objectId)[0]
            return this.assignSubnetParent(currentEquipmentWithSubnetId)
          })
          .then(() => {
            if (this.autoRecalculateSubnet) {
              this.recalculateSubnetForEquipmentChange(feature)
            }
          })
          .catch((err) => console.error(err))
      }
    } else if (!this.isMarker(mapObject)) {
      // If the user has drawn the boundary, we will have an associated object in the "feature" attributes. Save associations.
      if (usingMapClick && feature && feature.attributes && feature.attributes.network_node_object_id) {
        // If the associated equipment has a boundary associated with it, first delete *that* boundary
        var existingBoundaryId = this.equipmentIdToBoundaryId[feature.attributes.network_node_object_id]
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
    if (null == this.currentTransaction) return
    this.selectedMapObject = mapObject
    this.$timeout()
  }

  handleObjectModified(mapObject) {
    if (this.isMarker(mapObject)) {
      // This is a equipment marker and not a boundary. We should have a better way of detecting this
      this.$http.get(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`)
        .then((result) => {
          var equipmentObject = result.data.filter((item) => item.objectId === mapObject.objectId)[0]
          equipmentObject.geometry.coordinates = [mapObject.position.lng(), mapObject.position.lat()] // Note - longitude, then latitude
          return this.$http.post(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`, equipmentObject)
        })
        .then((result) => {
          this.objectIdToProperties[mapObject.objectId].isDirty = false
          if (this.autoRecalculateSubnet) {
            const equipmentToRecalculate = {
              objectId: mapObject.objectId,
              networkNodeType: this.objectIdToProperties[mapObject.objectId].siteNetworkNodeType,
              geometry: {
                coordinates: [mapObject.position.lng(), mapObject.position.lat()]
              }
            }
            this.recalculateSubnetForEquipmentChange(equipmentToRecalculate)
          }
          this.$timeout()
        })
        .catch((err) => console.error(err))

      // Get the associated boundary (if any)
      const boundaryObjectId = this.equipmentIdToBoundaryId[mapObject.objectId]
      if (boundaryObjectId) {
        // We have a boundary object. Delete it and recalculate coverage only if the boundary properties say to do so.
        const boundaryProperties = this.objectIdToProperties[boundaryObjectId]
        if (boundaryProperties.selectedSiteMoveUpdate === 'Auto-redraw') {
          this.deleteBoundary(boundaryObjectId)
          this.calculateCoverage(mapObject, boundaryProperties.spatialEdgeType, boundaryProperties.directed)
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
        .then(() => {
          return this.autoRecalculateSubnet
                 ? this.$http.get(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`)
                 : Promise.resolve()
        })
        .then((result) => {
          if (result && result.data.length > 0) {
            // There is at least one piece of equipment in the transaction. Use that for routing
            this.recalculateSubnetForEquipmentChange(result.data[0])
          } else {
            // There is no equipment left in the transaction. Just remove the subnet map objects
            this.clearAllSubnetMapObjects()
          }
        })
        .catch((err) => console.error(err))
      // If this is an equipment, delete its associated boundary (if any)
      const boundaryObjectId = this.equipmentIdToBoundaryId[mapObject.objectId]
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

  assignSubnetParent(equipmentFeature) {
    const searchBody = {
      nodeType: equipmentFeature.networkNodeType,
      point: {
        type: "Point",
        coordinates: equipmentFeature.geometry.coordinates
      },
      searchType: this.coSearchType
    }
    var closestCentralOfficeId = null
    return this.$http.post(`/service/plan-transaction/${this.currentTransaction.id}/subnets-search`, searchBody)
      .then((result) => {
        closestCentralOfficeId = result.data.objectId
        equipmentFeature.subnetId = closestCentralOfficeId
        return this.$http.put(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`, equipmentFeature)
      })
      .then(() => Promise.resolve(closestCentralOfficeId))
  }

  recalculateSubnetForEquipmentChange(equipmentFeature) {
    var recalculatedSubnets = {}
    var setOfCOIds = new Set()
    var equipmentObject = this.formatEquipmentForService(equipmentFeature.objectId)
    var closestCentralOfficeId = null
    return this.$http.get(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`)
      .then((result) => {
        var currentEquipmentWithSubnetId = result.data.filter((item) => item.objectId === equipmentFeature.objectId)[0]
        if (this.stickyAssignment && currentEquipmentWithSubnetId.subnetId) {
          // "Sticky" assignment means that once we assign a RT to a CO, the assignment does not change
          return Promise.resolve(currentEquipmentWithSubnetId.subnetId)
        } else {
          // Either we don't have a "Sticky" assignment, OR this is the first time we are calculating assignment
          return this.assignSubnetParent(currentEquipmentWithSubnetId)
        }
      })
      .then((closestCO) => {
        closestCentralOfficeId = closestCO
        // Delete subnet features for all central offices
        var lastResult = Promise.resolve()
        Object.keys(this.subnetMapObjects).forEach((centralOfficeObjectId) => {
          lastResult = lastResult.then(() => this.$http.delete(`/service/plan-transaction/${this.currentTransaction.id}/subnet-feature/${centralOfficeObjectId}`))
        })
        return lastResult
      })
      .then((result) => {
        // Recalculate for all central offices
        const recalcBody = {
          subNets: []
        }
        Object.keys(this.subnetMapObjects).forEach((centralOfficeObjectId) => setOfCOIds.add(centralOfficeObjectId))
        setOfCOIds.add(closestCentralOfficeId)
        setOfCOIds.forEach((centralOfficeObjectId) => recalcBody.subNets.push({ objectId: centralOfficeObjectId }))
        return this.$http.post(`/service/plan-transaction/${this.currentTransaction.id}/subnets-recalc`, recalcBody)
      })
      .then((result) => {
        var lastResult = Promise.resolve()
        setOfCOIds.forEach((centralOfficeObjectId) => {
          lastResult = lastResult.then((result) => {
            if (result) {
              recalculatedSubnets[result.data.objectId] = result
            }
            return this.$http.get(`/service/plan-transaction/${this.currentTransaction.id}/subnet-feature/${centralOfficeObjectId}`)
          })
        })
        lastResult = lastResult.then((result) => {
          recalculatedSubnets[result.data.objectId] = result
          return Promise.resolve()
        })
        return lastResult
      })
      .then(() => {
        this.clearAllSubnetMapObjects()
        Object.keys(recalculatedSubnets).forEach((centralOfficeObjectId) => {
          // We have the fiber in result.data.subnetLinks
          const subnetKey = `${centralOfficeObjectId}`
          this.subnetMapObjects[subnetKey] = []
          const result = recalculatedSubnets[centralOfficeObjectId]
          result.data.subnetLinks.forEach((subnetLink) => {
            subnetLink.geometry.coordinates.forEach((line) => {
              var polylineGeometry = []
              line.forEach((lineCoordinate) => polylineGeometry.push({ lat: lineCoordinate[1], lng: lineCoordinate[0] }))
              var subnetLineMapObject = new google.maps.Polyline({
                path: polylineGeometry,
                strokeColor: '#0000FF',
                strokeWeight: 2,
                map: this.mapRef
              })
              this.subnetMapObjects[subnetKey].push(subnetLineMapObject)
            })
          })
        })
      })
      .catch((err) => console.error(err))
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

  clearAllSubnetMapObjects() {
    Object.keys(this.subnetMapObjects).forEach((key) => {
      this.subnetMapObjects[key].forEach((subnetLineMapObject) => subnetLineMapObject.setMap(null))
    })
    this.subnetMapObjects = {}
  }

  // Returns a promise that resolves to the iconUrl for a given object id
  getObjectIconUrl(eventArgs) {
    if (eventArgs.objectKey === Constants.MAP_OBJECT_CREATE_KEY_NETWORK_NODE_TYPE) {
      // The value we have been passed is a network node type. Return the icon directly.
      return Promise.resolve(this.configuration.networkEquipment.equipments[eventArgs.objectValue].iconUrl)
    } else if (eventArgs.objectKey === Constants.MAP_OBJECT_CREATE_KEY_OBJECT_ID) {
      const planId = this.state.plan.getValue().id
      // /images/map_icons/aro/plan_equipment.png
      return this.$http.get(`/service/plan-feature/${planId}/equipment/${eventArgs.objectValue}?userId=${this.state.loggedInUser.id}`)
        .then((result) => {
          const networkNodeType = result.data.networkNodeType
          return Promise.resolve(this.configuration.networkEquipment.equipments[networkNodeType].iconUrl)
        })
        .catch((err) => console.error(err))
    }
    return Promise.reject(`Unknown object key ${eventArgs.objectKey}`)
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

    this.clearAllSubnetMapObjects()
  }
}

PlanEditorController.$inject = ['$timeout', '$http', '$element', 'state', 'configuration']

let planEditor = {
  templateUrl: '/components/sidebar/plan-editor/plan-editor.html',
  bindings: {
    mapGlobalObjectName: '@'
  },
  controller: PlanEditorController
}

export default planEditor
