import EquipmentProperties from './equipment-properties'
import BoundaryProperties from './boundary-properties'
import Constants from '../../common/constants'
import AroFeatureFactory from '../../../service-typegen/dist/AroFeatureFactory'
import TrackedEquipment from '../../../service-typegen/dist/TrackedEquipment'
import EquipmentComponent from '../../../service-typegen/dist/EquipmentComponent'
import EquipmentFeature from '../../../service-typegen/dist/EquipmentFeature'
import EquipmentBoundaryFeature from '../../../service-typegen/dist/EquipmentBoundaryFeature'
// import MarketableEquipment from '../../../service-typegen/dist/MarketableEquipment'
import TileUtilities from '../../tiles/tile-utilities.js'
import PlanEditorActions from '../../../react/components/plan-editor/plan-editor-actions'

class PlanEditorController {
  constructor ($timeout, $http, $element, $filter, $ngRedux, state, Utils, tileDataService, tracker) {
    this.$timeout = $timeout
    this.$http = $http
    this.$element = $element
    this.$filter = $filter
    this.state = state
    this.utils = Utils
    this.tileDataService = tileDataService
    this.tracker = tracker
    this.selectedMapObject = null
    this.selectedMapObjectLat = null
    this.selectedMapObjectLng = null
    // this.selectedEquipmentInfo = {}
    this.objectIdToProperties = {}
    this.objectIdToMapObject = {}
    this.objectIdToOriginalAttributes = {}
    this.boundaryIdToEquipmentId = {}
    this.equipmentIdToBoundaryId = {}
    this.boundaryCoverageById = {}
    this.objectIdsToHide = new Set()
    this.computedBoundaries = new Set() // Object ids for boundaries that we have computed
    this.subnetMapObjects = {}
    this.lastSelectedEquipmentType = 'Generic ADSL'
    this.lastUsedBoundaryDistance = 10000
    this.Constants = Constants
    this.deleteObjectWithId = null // A function into the child map object editor, requesting the specified map object to be deleted
    this.isComponentDestroyed = false // Useful for cases where the user destroys the component while we are generating boundaries
    this.isWorkingOnCoverage = false
    this.autoRecalculateSubnet = true
    this.stickyAssignment = true
    this.coSearchType = 'SERVICE_AREA'
    this.viewEventFeature = {}
    this.viewSiteBoundaryEventFeature = {}
    this.viewFeature = {}
    this.viewBoundaryProps = null
    this.viewIconUrl = ''
    this.viewLabel = ''
    this.isEditFeatureProps = true
    this.isBoundaryEditMode = false
    this.mapObjectEditorComms = {}
    this.networkNodeSBTypes = {}
    // Create a list of all the network node types that we MAY allow the user to edit (add onto the map)
    const editableNetworkNodeTypes = [
      'central_office',
      'dslam',
      'fiber_distribution_hub',
      'fiber_distribution_terminal',
      'cell_5g',
      'splice_point',
      'bulk_distribution_terminal',
      'loop_extender',
      'network_anchor',
      'multiple_dwelling_unit',
      'network_connector',
      'location_connector'
    ]
    this.allEditableNetworkNodeTypes = []
    this.state.configuration.perspective.networkEquipment.areVisible.forEach((equipmentType) => {
      if (editableNetworkNodeTypes.indexOf(equipmentType) >= 0) {
        this.allEditableNetworkNodeTypes.push(equipmentType)
      }
    })

    this.coverageOutput = {}
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this.mergeToTarget.bind(this))
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

  registerCreateEditableExistingMapObject (createEditableExistingMapObject) {
    this.createEditableExistingMapObject = createEditableExistingMapObject
  }

  registerDeleteCreatedMapObject (deleteCreatedMapObject) {
    this.deleteCreatedMapObjectWithId = deleteCreatedMapObject
  }

  $onInit () {
    // We should have a map variable at this point
    if (!window[this.mapGlobalObjectName]) {
      console.error('ERROR: Map Object Editor component initialized, but a map object is not available at this time.')
      return
    }
    this.mapRef = window[this.mapGlobalObjectName]

    // Select the first transaction in the list
    this.resumeOrCreateTransaction(this.planId, this.userId)
  }

  onCurrentTransactionChanged () {
    this.removeMapObjects && this.removeMapObjects()
    var transactionFeatures = []
    // See if we have an existing transaction for the currently selected location library
    // Moved resume or create transaction to state so can get current transaction is accessed by other components
    return this.$http.get(`/service/plan-transactions/${this.currentTransaction.id}/transaction-features/equipment`)
      .then((result) => {
        // We have a list of features. Replace them in the objectIdToProperties map.
        this.objectIdToProperties = {}
        this.objectIdToMapObject = {}
        this.equipmentIdToBoundaryId = {}
        this.boundaryIdToEquipmentId = {}
        // Filter out all non-deleted features - we do not want to create map objects for deleted features.
        transactionFeatures = result.data
          .filter((item) => item.crudAction !== 'delete')
          .map((item) => item.feature)
        // Save the iconUrls in the list of objects returned from aro-service
        transactionFeatures.forEach((feature) => { feature.iconUrl = this.state.configuration.networkEquipment.equipments[feature.networkNodeType].iconUrl })
        // Important: Create the map objects first. The events raised by the map object editor will
        // populate the objectIdToMapObject object when the map objects are created
        this.createMapObjects && this.createMapObjects(transactionFeatures)
        // We now have objectIdToMapObject populated.
        var typedEquipmentNodes = []
        transactionFeatures.forEach((feature) => {
          const attributes = feature.attributes
          const typedEquipmentNode = AroFeatureFactory.createObject(feature)
          var networkNodeEquipment = typedEquipmentNode.networkNodeEquipment
          typedEquipmentNodes.push(typedEquipmentNode)
          const properties = new EquipmentProperties(attributes.siteIdentifier, attributes.siteName, feature.networkNodeType,
            attributes.selectedEquipmentType, networkNodeEquipment, feature.deploymentType)
          this.objectIdToProperties[feature.objectId] = properties
        })
        this.addEquipmentNodes(typedEquipmentNodes)
        transactionFeatures.forEach((feature) => {
          this.getViewObjectSBTypes(feature.objectId)
        })
        return this.$http.get(`/service/plan-transactions/${this.currentTransaction.id}/transaction-features/equipment_boundary`)
      }).then((result) => {
        // Save the properties for the boundary
        result.data.forEach((item) => {
          const attributes = item.feature.attributes
          const properties = new BoundaryProperties(+attributes.boundary_type_id, attributes.selected_site_move_update,
            attributes.selected_site_boundary_generation,
            attributes.spatialEdgeType, attributes.directed, attributes.network_node_type, item.feature.deploymentType)
          this.objectIdToProperties[item.feature.objectId] = properties
          this.objectIdToOriginalAttributes[item.feature.objectId] = attributes
        })
        // Save the equipment and boundary ID associations
        result.data.forEach((item) => {
          var equipmentId = item.feature.attributes.network_node_object_id
          var boundaryId = item.feature.objectId
          this.equipmentIdToBoundaryId[equipmentId] = boundaryId
          this.boundaryIdToEquipmentId[boundaryId] = equipmentId
        })
        this.updateObjectIdsToHide()
        // We have a list of equipment boundaries. Populate them in the map object
        // Filter out all non-deleted features - we do not want to create map objects for deleted features.
        var features = result.data
          .filter((item) => item.crudAction !== 'delete')
          .map((item) => item.feature)
        this.createMapObjects && this.createMapObjects(features)
        // If we have at least one transaction feature, do a recalculate subnet on it. Pass in all connected COs in the transaction.
        if (transactionFeatures.length > 0) {
          var allCentralOfficeIds = new Set()
          transactionFeatures.forEach((item) => !!item.subnetId && allCentralOfficeIds.add(item.subnetId))
          this.recalculateSubnetForEquipmentChange(transactionFeatures[0], Array.from(allCentralOfficeIds))
        }
      })
      .catch((err) => {
      // Log the error, then get out of "plan edit" mode.
        this.state.selectedDisplayMode.next(this.state.displayModes.VIEW)
        this.$timeout()
        console.error(err)
      })
  }

  getFeaturesCount () {
    return Object.keys(this.objectIdToProperties).length
  }

  exitPlanEditMode () {
    // You should no longer hide any of the object ids that have been committed or discarded
    var planId = this.state.plan.id
    Object.keys(this.objectIdToProperties).forEach((objectId) => {
      this.tileDataService.removeFeatureToExclude(objectId)
    })

    // this.currentTransaction = null
    this.state.loadModifiedFeatures(planId)
    this.state.selectedDisplayMode.next(this.state.displayModes.VIEW)
    this.state.activeViewModePanel = this.state.viewModePanels.LOCATION_INFO
    this.$timeout()
  }

  handleObjectDroppedOnMarker (eventArgs) {
    var equipmentMapObject = this.objectIdToMapObject[eventArgs.targetObjectId]
    if (!equipmentMapObject) {
      console.error(`And object was dropped on marker with id ${eventArgs.targetObjectId}, but this id does not exist in this.objectIdToMapObject`)
      return
    }
    // Delete the associated boundary if it exists
    const boundaryObjectId = this.equipmentIdToBoundaryId[equipmentMapObject.objectId]
    const edgeOptions = JSON.parse(eventArgs.dropEvent.dataTransfer.getData(Constants.DRAG_DROP_ENTITY_DETAILS_KEY))
    this.deleteBoundary(boundaryObjectId)

    this.calculateAutoBoundary(equipmentMapObject, edgeOptions.spatialEdgeType, edgeOptions.directed)
  }

  // --- similar code to equipmentDetailController.js combine <------------------------------------------------------------<<<

  onRequestCalculateAutoBoundary () {
    if (this.selectedMapObject && !this.isMarker(this.selectedMapObject)) {
      var boundaryId = this.selectedMapObject.objectId
      var objectId = this.boundaryIdToEquipmentId[boundaryId]
      var mapObject = this.objectIdToMapObject[objectId]
      var spatialEdgeType = this.objectIdToProperties[objectId].spatialEdgeType
      this.deleteBoundary(boundaryId)
      this.calculateAutoBoundary(mapObject, spatialEdgeType)
    }
  }

  onRequestCalculateCoverage () {
    if (this.selectedMapObject && !this.isMarker(this.selectedMapObject)) {
      var mapObject = this.selectedMapObject
      // ToDo: fix. more of these terrible discrepancies
      var networkObjectId = mapObject.feature.networkObjectId
      if (typeof networkObjectId === 'undefined') {
        networkObjectId = mapObject.feature.attributes.network_node_object_id
      }

      var equipmentPoint = {
        type: 'Point',
        coordinates: []
      }

      if (this.objectIdToMapObject.hasOwnProperty(networkObjectId)) {
        // we have an edited version of the equipment point
        equipmentPoint.coordinates = [this.objectIdToMapObject[networkObjectId].position.lng(), this.objectIdToMapObject[networkObjectId].position.lat()]
        this.calculateCoverage(mapObject, equipmentPoint)
      } else {
        // we do not have an edited version of the equipment point, get ti from the server
        var planId = this.state.plan.id
        this.$http.get(`/service/plan-feature/${planId}/equipment/${networkObjectId}?userId=${this.state.loggedInUser.id}`)
          .then((result) => {
            equipmentPoint = result.data.geometry
            this.calculateCoverage(mapObject, equipmentPoint)
          })
      }
    }
  }

  // Note: similar code as calculateCoverage(), not sure we can combine them
  calculateAutoBoundary (mapObject, spatialEdgeType, directed) {
    // Get the POST body for optimization based on the current application state
    var optimizationBody = this.state.getOptimizationBody()
    // Replace analysis_type and add a point and radius
    optimizationBody.boundaryCalculationType = 'FIXED_RADIUS'
    optimizationBody.analysis_type = 'COVERAGE'
    optimizationBody.point = {
      type: 'Point',
      coordinates: [mapObject.position.lng(), mapObject.position.lat()]
    }
    optimizationBody.spatialEdgeType = spatialEdgeType
    optimizationBody.directed = directed // directed analysis if thats what the user wants
    // Always send radius in meters to the back end
    optimizationBody.radius = this.lastUsedBoundaryDistance * this.state.configuration.units.length_units_to_meters

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
          optimizationBody.spatialEdgeType, optimizationBody.directed, mapObject.featureType)
        // ToDo: this should use AroFeatureFactory
        var feature = {
          objectId: this.utils.getUUID(),
          networkNodeType: boundaryProperties.networkNodeType,
          networkObjectId: equipmentObjectId,
          geometry: {
            type: 'Polygon',
            coordinates: result.data.polygon.coordinates
          },
          boundaryTypeId: boundaryProperties.selectedSiteBoundaryTypeId,
          attributes: {
            network_node_type: boundaryProperties.networkNodeType,
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
        this.computedBoundaries.add(feature.objectId)
        this.createMapObjects && this.createMapObjects([feature])

        this.digestBoundaryCoverage(feature, result.data, true)

        this.isWorkingOnCoverage = false
        this.state.planEditorChanged.next(true) // recaluculate plansummary
      })
      .catch((err) => {
        console.error(err)
        this.isWorkingOnCoverage = false
      })
  }

  // Note: similar code as calculateAutoBoundary(), not sure we can combine them
  calculateCoverage (mapObject, equipmentPoint, directed) {
    // Get the POST body for optimization based on the current application state
    var optimizationBody = this.state.getOptimizationBody()
    // Replace analysis_type and add a point and radius
    optimizationBody.boundaryCalculationType = 'FIXED_POLYGON'
    optimizationBody.analysis_type = 'COVERAGE'

    optimizationBody.point = equipmentPoint
    // Get the polygon from the mapObject, not mapObject.feature.geometry, as the user may have edited the map object
    optimizationBody.polygon = this.polygonPathsToWKT(mapObject.getPaths())

    // optimizationBody.spatialEdgeType = spatialEdgeType;
    optimizationBody.directed = directed // directed analysis if thats what the user wants
    
    var equipmentObjectId = mapObject.objectId
    this.isWorkingOnCoverage = true
    this.$http.post('/service/v1/network-analysis/boundary', optimizationBody)
      .then((result) => {
      // The user may have destroyed the component before we get here. In that case, just return
        if (this.isComponentDestroyed) {
          console.warn('Plan editor was closed while a boundary was being calculated')
          return
        }
        this.computedBoundaries.add(mapObject.feature.objectId)
        this.digestBoundaryCoverage(mapObject.feature, result.data, true)

        this.isWorkingOnCoverage = false
      })
      .catch((err) => {
        console.error(err)
        this.isWorkingOnCoverage = false
      })
  }

  digestBoundaryCoverage (feature, coverageData, forceUpdate) {
    if (typeof forceUpdate === 'undefined') forceUpdate = false
    this.coverageOutput = { 'feature': feature, 'data': coverageData, 'forceUpdate': forceUpdate }
  }

  objKeys (obj) {
    if (typeof obj === 'undefined') obj = {}
    return Object.keys(obj)
  }

  // Marks the properties of the selected equipment as dirty (changed).
  markSelectedEquipmentPropertiesDirty () {
    if (this.selectedMapObject) {
      var objectProperties = this.objectIdToProperties[this.selectedMapObject.objectId]
      objectProperties.isDirty = true
      this.lastSelectedEquipmentType = objectProperties.selectedEquipmentType || this.lastSelectedEquipmentType
    }
    this.$timeout()
  }

  // Marks the properties of the selected equipment boundary as dirty (changed).
  markSelectedBoundaryPropertiesDirty () {
    if (this.selectedMapObject) {
      var objectProperties = this.objectIdToProperties[this.selectedMapObject.objectId]
      objectProperties.isDirty = true
    }
  }

  // Formats the equipment specified by the objectId so that it can be sent to aro-service for saving
  formatEquipmentForService (objectId) {
    // Format the object and send it over to aro-service
    var mapObject = this.objectIdToMapObject[objectId]
    // console.log(mapObject)
    var objectProperties = this.objectIdToProperties[objectId]
    var serviceFeature = {
      objectId: objectId,
      geometry: {
        type: 'Point',
        coordinates: [mapObject.position.lng().toFixed(6), mapObject.position.lat().toFixed(6)] // Note - longitude, then latitude
      },
      networkNodeType: objectProperties.siteNetworkNodeType,
      attributes: {
        siteIdentifier: objectProperties.siteIdentifier,
        siteName: objectProperties.siteName,
        selectedEquipmentType: objectProperties.selectedEquipmentType
      },
      dataType: 'equipment',
      networkNodeEquipment: objectProperties.networkNodeEquipment,
      deploymentType: objectProperties.deploymentType
    }
    if (objectProperties.targetType) {
      serviceFeature.target_type = objectProperties.targetType
    }
    // console.log(serviceFeature.geometry)
    return serviceFeature
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
      type: 'Polygon',
      coordinates: allPaths
    }
  }

  // Formats the boundary specified by the objectId so that it can be sent to aro-service for saving
  formatBoundaryForService (objectId, networkNodeType) {
    // Format the object and send it over to aro-service
    var boundaryMapObject = this.objectIdToMapObject[objectId]

    // The site network node type can be in our map of obj-to-properties, OR it can be passed in (useful
    // in case we are editing existing boundaries, in which case the associated network node is not in our map)
    var objectProperties = this.objectIdToProperties[this.boundaryIdToEquipmentId[objectId]]
    var siteNetworkNodeType = objectProperties ? objectProperties.siteNetworkNodeType : networkNodeType
    var boundaryProperties = this.objectIdToProperties[objectId]
    if (typeof siteNetworkNodeType === 'undefined') siteNetworkNodeType = boundaryProperties.networkNodeType

    // ToDo: this should use AroFeatureFactory
    const originalAttributes = this.objectIdToOriginalAttributes[objectId]
    const customAttributes = {
      boundary_type_id: boundaryProperties.selectedSiteBoundaryTypeId,
      network_node_type: siteNetworkNodeType,
      selected_site_move_update: boundaryProperties.selectedSiteMoveUpdate,
      selected_site_boundary_generation: boundaryProperties.selectedSiteBoundaryGeneration,
      network_node_object_id: this.boundaryIdToEquipmentId[objectId],
      spatialEdgeType: boundaryProperties.spatialEdgeType,
      directed: boundaryProperties.directed
    }
    const attributes = Object.assign({}, originalAttributes, customAttributes)
    var serviceFeature = {
      objectId: objectId,
      networkNodeType: siteNetworkNodeType,
      networkObjectId: this.boundaryIdToEquipmentId[objectId],
      geometry: this.polygonPathsToWKT(boundaryMapObject.getPaths()),
      boundaryTypeId: boundaryProperties.selectedSiteBoundaryTypeId,
      attributes: attributes,
      dataType: 'equipment_boundary',
      deploymentType: boundaryProperties.deploymentType
    }
    return serviceFeature
  }

  // Saves the properties of the selected location to aro-service
  saveSelectedEquipmentProperties () {
    if (this.selectedMapObject && this.isMarker(this.selectedMapObject)) {
      var selectedMapObject = this.selectedMapObject // May change while the $http.post() is returning
      var equipmentObjectForService = this.formatEquipmentForService(selectedMapObject.objectId)
      this.selectedMapObjectLat = +this.$element.find('#selectedMapObjectLat')[0].value
      this.selectedMapObjectLng = +this.$element.find('#selectedMapObjectLng')[0].value
      this.setSelectedMapObjectLoc()
      // save the mapobject location if changed
      if (this.selectedMapObjectLat && this.selectedMapObjectLat > -90 && this.selectedMapObjectLat < 90) {
        equipmentObjectForService.geometry.coordinates[1] = this.selectedMapObjectLat.toFixed(6)
      }
      if (this.selectedMapObjectLng && this.selectedMapObjectLng > -180 && this.selectedMapObjectLng < 180) {
        equipmentObjectForService.geometry.coordinates[0] = this.selectedMapObjectLng.toFixed(6)
      }
      this.$http.put(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`, equipmentObjectForService)
        .then((result) => {
          this.objectIdToProperties[selectedMapObject.objectId].isDirty = false
          this.$timeout()
        })
        .catch((err) => console.error(err))
    }
  }

  // Saves the properties of the selected boundary to aro-service
  saveSelectedBoundaryProperties () {
    if (this.selectedMapObject && !this.isMarker(this.selectedMapObject)) {
      var selectedMapObject = this.selectedMapObject // May change while the $http.post() is returning
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
  getSelectedNetworkConfig () {
    if (!this.selectedMapObject) return
    return this.getNetworkConfig(this.selectedMapObject.objectId)
  }

  getSelectedBoundaryNetworkConfig () {
    return this.selectedMapObject && this.getNetworkConfig(this.boundaryIdToEquipmentId[this.selectedMapObject.objectId])
  }

  getNetworkConfig (objectId) {
    if (!this.objectIdToProperties.hasOwnProperty(objectId)) {
      return
    }
    var layers = this.state.configuration.networkEquipment.equipments
    var networkNodeType = this.objectIdToProperties[objectId].siteNetworkNodeType

    // ToDo: there are discrepancies in out naming, fix that
    // if ('fiber_distribution_hub' == networkNodeType) networkNodeType = 'fdh'
    // if ('fiber_distribution_terminal' == networkNodeType) networkNodeType = 'fdt'
    // if ('cell_5g' == networkNodeType) networkNodeType = 'fiveg_site'
    return layers[networkNodeType]
  }

  isMarker (mapObject) {
    return mapObject && mapObject.icon
  }

  // ToDo: change this out for a dynamic version
  getNewListItem (type) {
    if (type == 'plannedEquipment' || type == 'subComponents') {
      return new EquipmentComponent()
    }

    if (type == 'existingEquipment') {
      return new TrackedEquipment()
    }

    if (type == 'marketableEquipments') {
      console.log('marketableEquipments is no more')
      // return new MarketableEquipment()
    }
  }

  updateSelectedState (selectedFeature, featureId) {
    // tell state
    var newSelection = this.state.cloneSelection()
    newSelection.editable.equipment = {}
    if (typeof selectedFeature !== 'undefined' && typeof featureId !== 'undefined') {
      newSelection.editable.equipment[ featureId ] = selectedFeature
    }
    this.state.selection = newSelection
  }

  clearViewSelection () {
    this.viewEventFeature = {}
    this.viewFeature = {}
    this.viewIconUrl = ''
    this.viewLabel = ''
    this.isEditFeatureProps = true
    this.isBoundaryEditMode = false
    this.updateSelectedState()
  }

  displayViewObject (feature, iconUrl) {
    // First deselect all equipment and boundary features
    this.viewEventFeature = this.viewFeature = this.viewLabel = this.viewIconUrl = null
    this.isEditFeatureProps = false
    this.viewSiteBoundaryEventFeature = this.viewBoundaryProps = null
    this.isBoundaryEditMode = false
    if (feature.type && feature.type === "equipment_boundary.select") {
      var newSelection = this.state.cloneSelection()
      newSelection.details.siteBoundaryId = feature.objectId
      this.state.selection = newSelection
      this.displaySiteBoundaryViewObject(feature, iconUrl)      
    }
    else
      this.displayEquipmentViewObject(feature,iconUrl)
  }

  displayEditObject(feature) {
    if (feature.type && feature.type === "equipment_boundary.select")
      return this.displaySiteBoundaryViewObject(feature)
        .then((result) => {
          return this.editViewSiteBoundaryObject()
        })
    else
      return this.displayEquipmentViewObject(feature)
        .then((result) => {
          return this.editViewObject()
        })
  }

  displayEquipmentViewObject(feature, iconUrl) {
    return new Promise((resolve, reject) => {
      var planId = this.state.plan.id
      this.$http.get(`/service/plan-feature/${planId}/equipment/${feature.objectId}?userId=${this.state.loggedInUser.id}`)
        .then((result) => {
          if (result.data.hasOwnProperty('geometry')) {
            this.viewEventFeature = feature
            // use feature's coord NOT the event's coords
            this.viewEventFeature.geometry.coordinates = result.data.geometry.coordinates
            this.viewFeature = AroFeatureFactory.createObject(result.data)
            var viewConfig = this.state.configuration.networkEquipment.equipments[this.viewFeature.networkNodeType]
            this.viewLabel = viewConfig.label
            this.viewIconUrl = viewConfig.iconUrl
            this.isEditFeatureProps = false
            // this.updateSelectedState(feature, feature.objectId)
            this.getViewObjectSBTypes(feature.objectId)
          } else {
            // clear selection
            this.clearViewSelection()
          }
          resolve()
        }).catch((err) => {
          console.error(err)
          reject()
        })
    })
  }

  displaySiteBoundaryViewObject(feature, iconUrl) {
    return new Promise((resolve, reject) => {
      var planId = this.state.plan.id
      this.$http.get(`/service/plan-feature/${planId}/equipment_boundary/${feature.objectId}?userId=${this.state.loggedInUser.id}`)
        .then((result) => {
          this.objectIdToOriginalAttributes[feature.objectId] = result.data.attributes
          if (result.data.hasOwnProperty('geometry')) {
            this.viewSiteBoundaryEventFeature = result.data
            this.viewSiteBoundaryEventFeature.attributes = this.viewSiteBoundaryEventFeature.attributes || {}
            this.viewSiteBoundaryEventFeature.attributes.network_node_object_id = this.viewSiteBoundaryEventFeature.networkObjectId
            this.viewSiteBoundaryEventFeature.attributes.networkNodeType = this.viewSiteBoundaryEventFeature.networkNodeType
            this.viewSiteBoundaryEventFeature.isExistingObject = true

            // use feature's coord NOT the event's coords
            var boundaryProps = AroFeatureFactory.createObject(result.data)

            this.viewBoundaryProps = new BoundaryProperties(boundaryProps.boundaryTypeId, 'Auto-redraw', 'Road Distance',
              null, null, boundaryProps.attributes, boundaryProps.deploymentType)

            this.viewBoundaryProps.selectedSiteBoundaryType =
              this.state.boundaryTypes.filter((boundary) => boundary.id === this.viewBoundaryProps.selectedSiteBoundaryTypeId)[0]

            this.isBoundaryEditMode = false
          } else {
            // clear selection
            this.clearViewSelection()
          }
          resolve()
        }).catch((err) => {
          console.error(err)
          reject()
        })
    })
  }

  getViewObjectSBTypes (objectId) {
    // Get SB types of a equipment
    !this.networkNodeSBTypes.hasOwnProperty(objectId) &&
    this.$http.get(`/service/odata/NetworkBoundaryEntity?$select=boundaryType&$filter=networkNodeObjectId eq guid'${objectId}' and deleted eq false&$top=${this.state.boundaryTypes.length}`)
      .then((result) => {
        this.networkNodeSBTypes[objectId] = result.data
      })
  }

  networkNodeHasSBType (objectId) {
    return this.networkNodeSBTypes.hasOwnProperty(objectId) &&
      this.networkNodeSBTypes[objectId].filter(boundary => boundary.boundaryType === this.state.selectedBoundaryType.id).length > 0
  }

  isBoundaryCreationAllowed (mapObject) {
    // temporary allow all
    return true
    // Dont allow adding a same boundary type if exists
    // return this.state.showSiteBoundary && mapObject && mapObject.objectId && !this.networkNodeHasSBType(mapObject.objectId)
  }

  refreshViewObjectSBTypes (boundaryObjectId) {
    // as transaction is not commited yet, remove boundaryType of equipment from networkNodeSBTypes list
    this.$http.get(`/service/odata/NetworkBoundaryEntity?$select=boundaryType,networkNodeObjectId&$filter=objectId eq guid'${boundaryObjectId}' and deleted eq false&$top=100`)
      .then((result) => {
      // remove deleted boundaries before commiting the transaction
        var siteInfo = result.data[0]
        var currentSiteBoundaries = this.networkNodeSBTypes[siteInfo.networkNodeObjectId].filter(ele => ele.boundaryType !== siteInfo.boundaryType)
        this.networkNodeSBTypes[result.data[0].networkNodeObjectId] = currentSiteBoundaries
      })
  }

  editViewObject () {
    this.createEditableExistingMapObject && this.createEditableExistingMapObject(this.viewEventFeature, this.viewIconUrl)
  }

  editViewSiteBoundaryObject () {
    this.createEditableExistingMapObject && this.createEditableExistingMapObject(this.viewSiteBoundaryEventFeature, null)    
  }

  handleObjectCreated (mapObject, usingMapClick, feature, deleteExistingBoundary) {
    this.objectIdToMapObject[mapObject.objectId] = mapObject
    if (usingMapClick && this.isMarker(mapObject)) {
      // This is a equipment marker and not a boundary. We should have a better way of detecting this
      var isNew = true
      if (feature.isExistingObject) {
        // clone of existing or planned equipment
        const planId = this.state.plan.id
        // Add modified features to vector tiles and do the rendering, etc.
        this.state.loadModifiedFeatures(planId)
          .then(() => {
            this.state.requestMapLayerRefresh.next(null)
            return this.$http.get(`/service/plan-feature/${planId}/equipment/${mapObject.objectId}?userId=${this.state.loggedInUser.id}`)
          })
          .then((result) => {
            var attributes = result.data.attributes
            // console.log(result.data)
            const equipmentFeature = AroFeatureFactory.createObject(result.data)
            this.addEquipmentNodes([equipmentFeature])
            var networkNodeEquipment = equipmentFeature.networkNodeEquipment

            var equipmentProperties = new EquipmentProperties(networkNodeEquipment.siteInfo.siteClli, networkNodeEquipment.siteInfo.siteName,
              equipmentFeature.networkNodeType, null, networkNodeEquipment, result.data.deploymentType, result.data.target_type)
            // this.objectIdToProperties[mapObject.objectId] = new EquipmentProperties(networkNodeEquipment.siteInfo.siteClli, networkNodeEquipment.siteInfo.siteName,
            //                                                                        equipmentFeature.networkNodeType, null, networkNodeEquipment, result.data.deploymentType)
            this.objectIdToProperties[mapObject.objectId] = equipmentProperties
            var equipmentObject = this.formatEquipmentForService(mapObject.objectId)
            this.$http.post(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`, equipmentObject)
              .then(() => this.$http.get(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`))
              .then((result) => {
              // Always assign subnet parent on object creation, even if we are not creating a route. This way, if the user
              // later turns on auto-recalculate, it will generate the entire subnet.
                var currentEquipmentWithSubnetId = result.data.filter((item) => item.objectId === equipmentObject.objectId)[0]
                if (this.networkNodeTypeCanHaveSubnet(equipmentFeature.networkNodeType)) {
                  return this.assignSubnetParent(currentEquipmentWithSubnetId)
                } else {
                  return Promise.reject({ softReject: true, message: `Network node type ${equipmentFeature.networkNodeType} does not support subnet calculation.` })
                }
              })
              .then(() => {
                if (this.autoRecalculateSubnet) {
                  this.recalculateSubnetForEquipmentChange(feature, Object.keys(this.subnetMapObjects))
                }
              })
              .catch((err) => {
                if (err.softReject) {
                  console.info(err.message)
                } else {
                  console.error(err)
                }
              })
            this.getViewObjectSBTypes(mapObject.objectId)
            this.$timeout()
          })
          .catch((err) => console.error(err))
      } else {
        // nope it's new
        const equipmentNode = AroFeatureFactory.createObject({ dataType: 'equipment' })
        equipmentNode.objectId = mapObject.objectId
        this.addEquipmentNodes([equipmentNode])
        var blankNetworkNodeEquipment = equipmentNode.networkNodeEquipment
        this.objectIdToProperties[mapObject.objectId] = new EquipmentProperties('', '', feature.networkNodeType, this.lastSelectedEquipmentType, blankNetworkNodeEquipment, 'PLANNED', 'sewer')
        var equipmentObject = this.formatEquipmentForService(mapObject.objectId)
        this.$http.post(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`, equipmentObject)
          .then(() => this.$http.get(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`))
          .then((result) => {
          // Always assign subnet parent on object creation, even if we are not creating a route. This way, if the user
          // later turns on auto-recalculate, it will generate the entire subnet.
            var currentEquipmentWithSubnetId = result.data.filter((item) => item.objectId === equipmentObject.objectId)[0]
            if (this.networkNodeTypeCanHaveSubnet(feature.networkNodeType)) {
              return this.assignSubnetParent(currentEquipmentWithSubnetId)
            } else {
              return Promise.reject({ softReject: true, message: `Network node type ${feature.networkNodeType} does not support subnet calculation.` })
            }
          })
          .then(() => {
            if (this.autoRecalculateSubnet) {
              this.recalculateSubnetForEquipmentChange(feature, Object.keys(this.subnetMapObjects))
            }
          })
          .catch((err) => {
            if (err.softReject) {
              console.info(err.message)
            } else {
              console.error(err)
            }
          })
      }
    } else if (!this.isMarker(mapObject)) {
      // If the user has drawn the boundary, we will have an associated object in the "feature" attributes. Save associations.
      if (usingMapClick && feature && feature.attributes && feature.attributes.network_node_object_id) {
        // If the associated equipment has a boundary associated with it, first delete *that* boundary
        var existingBoundaryId = this.equipmentIdToBoundaryId[feature.attributes.network_node_object_id]
        deleteExistingBoundary && this.deleteBoundary(existingBoundaryId)
        deleteExistingBoundary && !existingBoundaryId && this.getAndDeleteAssociatedEquSiteBoundary(feature.attributes.network_node_object_id, this.state.selectedBoundaryType.id)
        existingBoundaryId = null

        this.objectIdToProperties[mapObject.objectId] = new BoundaryProperties(this.state.selectedBoundaryType.id, 'Auto-redraw', 'Road Distance',
          null, null, feature.attributes.networkNodeType, feature.deploymentType)
        this.boundaryIdToEquipmentId[mapObject.objectId] = feature.attributes.network_node_object_id
        this.equipmentIdToBoundaryId[feature.attributes.network_node_object_id] = mapObject.objectId
      }
      var networkNodeType = feature && feature.attributes && feature.attributes.networkNodeType
      if (typeof networkNodeType === 'undefined') networkNodeType = feature && feature.networkNodeType
      var serviceFeature = this.formatBoundaryForService(mapObject.objectId, networkNodeType)

      if (!this.computedBoundaries.has(mapObject.objectId)) {
        // Refresh map tiles ONLY if this is not a boundary that we have computed. The other case is when the user clicks to edit an existing boundary
        this.state.requestMapLayerRefresh.next(null)
      }
      this.$http.post(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment_boundary`, serviceFeature)
        .catch((err) => console.error(err))
    }
    this.updateObjectIdsToHide()
    this.$timeout()
  }

  deleteBoundary (boundaryId) {
    if (!boundaryId) return
    var eqId = this.boundaryIdToEquipmentId[boundaryId]
    delete this.equipmentIdToBoundaryId[eqId]
    delete this.boundaryIdToEquipmentId[boundaryId]
    this.deleteObjectWithId && this.deleteObjectWithId(boundaryId)
    this.deleteCreatedMapObjectWithId && this.deleteCreatedMapObjectWithId(boundaryId) // Delete Boundary from map
  }

  handleSelectedObjectChanged (mapObject) {
    if (this.currentTransaction === null) return
    if (mapObject != null) {
      this.updateSelectedState()
      this.isEditFeatureProps = true
      this.isBoundaryEditMode = true
      this.selectedObjectId = mapObject.objectId || mapObject.object_id
    } else {
      this.selectedObjectId = null
    }

    this.selectedMapObject = mapObject

    var lat = mapObject && mapObject.position && mapObject.position.lat()
    var lng = mapObject && mapObject.position && mapObject.position.lng()
    this.selectedMapObjectLat = mapObject && mapObject.position && +this.$filter('number')(+lat, 6)
    this.selectedMapObjectLng = mapObject && mapObject.position && +this.$filter('number')(+lng, 6)

    // debug
    // console.log(this.selectedMapObject)
    /*
    if (null != this.selectedMapObject){
      console.log( this.selectedMapObject )
      console.log( this.objectIdToProperties[this.selectedMapObject.objectId] )
      console.log( this.objectIdToProperties[this.selectedMapObject.objectId].networkNodeEquipment.getDisplayProperties() )
    }
    // */
    console.log(this.getSelectedNetworkConfig())

    this.$timeout()
  }

  handleObjectModified (mapObject, isManualEdit) {
    if (this.isMarker(mapObject)) {
      if (!isManualEdit) {
        var lat = mapObject && mapObject.position && mapObject.position.lat()
        var lng = mapObject && mapObject.position && mapObject.position.lng()
        this.selectedMapObjectLat = mapObject && mapObject.position && +this.$filter('number')(+lat, 6)
        this.selectedMapObjectLng = mapObject && mapObject.position && +this.$filter('number')(+lng, 6)
      }
      // This is a equipment marker and not a boundary. We should have a better way of detecting this
      this.$http.get(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`)
        .then((result) => {
          var equipmentObject = result.data.filter((item) => item.objectId === mapObject.objectId)[0]
          equipmentObject.geometry.coordinates = [mapObject.position.lng().toFixed(6), mapObject.position.lat().toFixed(6)] // Note - longitude, then latitude
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
            this.recalculateSubnetForEquipmentChange(equipmentToRecalculate, Object.keys(this.subnetMapObjects))
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
          this.calculateAutoBoundary(mapObject, boundaryProperties.spatialEdgeType, boundaryProperties.directed)
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

  handleObjectDeleted (mapObject) {
    if (this.isMarker(mapObject)) {
      // This is a equipment marker and not a boundary. We should have a better way of detecting this
      this.checkIfBoundaryExists(mapObject)
        .then((deleteObject) => {
          if (deleteObject) {
            this.deleteCreatedMapObjectWithId(mapObject.objectId) // Delete the marker from map
            this.deleteMarker(mapObject) // Delete the marker
          }
        })
    } else {
      this.deleteCreatedMapObjectWithId(mapObject.objectId) // Delete the boundary from map
      this.$http.delete(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment_boundary/${mapObject.objectId}`)
        .then(() => {
          this.refreshViewObjectSBTypes(mapObject.objectId) // refresh network node SB type
          this.state.planEditorChanged.next(true) // recaluculate plansummary
        })
    }
  }

  deleteMarker (mapObject) {
    this.$http.delete(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment/${mapObject.objectId}`)
      .then(() => {
        return this.autoRecalculateSubnet
          ? this.$http.get(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`)
          : Promise.resolve()
      })
      .then((result) => {
        if (result && result.data.length > 0) {
          // There is at least one piece of equipment in the transaction. Use that for routing
          this.recalculateSubnetForEquipmentChange(result.data[0], Object.keys(this.subnetMapObjects))
        } else {
          // There is no equipment left in the transaction. Just remove the subnet map objects
          this.clearAllSubnetMapObjects()
        }
        this.state.planEditorChanged.next(true) // recaluculate plansummary
      })
      .catch((err) => console.error(err))
    // If this is an equipment, delete its associated boundary (if any)
    const boundaryObjectId = this.equipmentIdToBoundaryId[mapObject.objectId]
    if (!boundaryObjectId) {
      this.state.boundaryTypes.forEach((boundaryType) => {
        boundaryType.name !== 'fiveg_coverage' && this.getAndDeleteAssociatedEquSiteBoundary(mapObject.objectId,boundaryType.id)        
      })
    } else {
      this.deleteBoundary(boundaryObjectId) // boundary is in edit mode
    }
  }

  getAndDeleteAssociatedEquSiteBoundary (objectId, boundaryTypeId) {
    // Get the associated boundary (boundary is not in edit mode)
    this.$http.get(`/service/odata/NetworkBoundaryEntity?$select=objectId&$filter=networkNodeObjectId eq guid'${objectId}' and deleted eq false and boundaryType eq ${boundaryTypeId}&$top=${this.state.boundaryTypes.length}`)
    .then((result) => {
      if (result.data.length > 0) {
        // Delete the boundary assocaited to equipment if exists
        result.data.forEach((boundary) => {
          var boundaryId = boundary.objectId
          this.deleteBoundaryInNonEditMode(boundaryId)
        })
      }
    })
  }

  deleteBoundaryInNonEditMode(boundaryId) {
    this.$http.delete(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment_boundary/${boundaryId}`)
    .then(() => {
      // Once commited boundary will be deleted until then it's excluded from showing on the map
      this.tileDataService.addFeatureToExclude(boundaryId)
      this.state.requestMapLayerRefresh.next(null)
      this.refreshViewObjectSBTypes(boundaryId) // refresh network node SB type
      this.state.planEditorChanged.next(true) // recaluculate plansummary
    })
  }

  handleSiteBoundaryTypeChanged () {
    this.saveSelectedBoundaryProperties() // I don't like to do this, but the boundary type affects the visibility of the boundary, so best to save it here.
    this.updateObjectIdsToHide()
  }

  toggleSiteBoundary () {
    // if(this.state.showSiteBoundary && this.selectedBoundaryType) {
    // this.isBoundaryCreationAllowed(this.selectedMapObject)
    this.state.viewSettingsChanged.next()
    // }
  }

  // Returns true if the specified network node type can have a subnet
  networkNodeTypeCanHaveSubnet (networkNodeType) {
    return (networkNodeType !== 'fiber_distribution_terminal') && (networkNodeType !== 'splice_point')
  }

  assignSubnetParent (equipmentFeature) {
    const searchBody = {
      nodeType: equipmentFeature.networkNodeType,
      point: {
        type: 'Point',
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

  recalculateSubnetForEquipmentChange (equipmentFeature, subnetsToDelete) {
    // console.log(equipmentFeature)
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
          if (this.networkNodeTypeCanHaveSubnet(equipmentFeature.networkNodeType)) {
            return this.assignSubnetParent(currentEquipmentWithSubnetId)
          } else {
            return Promise.reject({ softReject: true, message: `Network node type ${equipmentFeature.networkNodeType} does not support subnet calculation.` })
          }
        }
      })
      .then((closestCO) => {
        closestCentralOfficeId = closestCO
        // Delete subnet features for all specified central offices.
        var lastResult = Promise.resolve()
        subnetsToDelete.forEach((centralOfficeObjectId) => {
          lastResult = lastResult.then(() => this.$http.delete(`/service/plan-transaction/${this.currentTransaction.id}/subnet-feature/${centralOfficeObjectId}`))
        })
        return lastResult
      })
      .then((result) => {
      // Recalculate for all central offices
        const recalcBody = {
          subNets: []
        }
        subnetsToDelete.forEach((centralOfficeObjectId) => setOfCOIds.add(centralOfficeObjectId))
        setOfCOIds.add(closestCentralOfficeId)
        setOfCOIds.forEach((centralOfficeObjectId) => recalcBody.subNets.push({ objectId: centralOfficeObjectId }))
        return this.$http.post(`/service/plan-transaction/${this.currentTransaction.id}/subnets-recalc`, recalcBody)
      })
      .then((result) => {
        var lastResult = Promise.resolve()
        setOfCOIds.forEach((centralOfficeObjectId) => {
          lastResult = lastResult.then((result) => {
            if (result && result.data.objectId) {
              recalculatedSubnets[result.data.objectId] = result
            }
            return this.$http.get(`/service/plan-transaction/${this.currentTransaction.id}/subnet-feature/${centralOfficeObjectId}`)
          })
        })
        lastResult = lastResult.then((result) => {
          if (result && result.data.objectId) {
            recalculatedSubnets[result.data.objectId] = result
          }
          return Promise.resolve()
        })
        return lastResult
      })
      .then(() => {
        this.clearAllSubnetMapObjects()
        this.state.planEditorChanged.next(true)
        Object.keys(recalculatedSubnets).forEach((centralOfficeObjectId) => {
        // We have the fiber in result.data.subnetLinks
          const subnetKey = `${centralOfficeObjectId}`
          this.subnetMapObjects[subnetKey] = []
          const result = recalculatedSubnets[centralOfficeObjectId]
          if (result.data.hasOwnProperty('subnetLinks')) {
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
          }
        })
      })
      .catch((err) => {
        if (err.softReject) {
          console.info(err.message)
        } else {
          console.error(err)
        }
      })
  }

  updateObjectIdsToHide () {
    this.objectIdsToHide = new Set()
    Object.keys(this.objectIdToProperties).forEach((objectId) => {
      var properties = this.objectIdToProperties[objectId]
      if ((properties instanceof BoundaryProperties) && // This is a boundary property
          (this.state.selectedBoundaryType.id !== properties.selectedSiteBoundaryTypeId || // The selected boundary id does not match this objects boundary id
              !this.state.showSiteBoundary)) { // The checkbox for showing site boundaries is not selected
        this.objectIdsToHide.add(objectId)
      }
    })
  }

  clearAllSubnetMapObjects () {
    Object.keys(this.subnetMapObjects).forEach((key) => {
      this.subnetMapObjects[key].forEach((subnetLineMapObject) => subnetLineMapObject.setMap(null))
    })
    this.subnetMapObjects = {}
  }

  // Returns a promise that resolves to the iconUrl for a given object id
  getObjectIconUrl (eventArgs) {
    if (eventArgs.objectKey === Constants.MAP_OBJECT_CREATE_KEY_NETWORK_NODE_TYPE) {
      // The value we have been passed is a network node type. Return the icon directly.
      return Promise.resolve(this.state.configuration.networkEquipment.equipments[eventArgs.objectValue].iconUrl)
    } else if (eventArgs.objectKey === Constants.MAP_OBJECT_CREATE_KEY_OBJECT_ID) {
      const planId = this.state.plan.id
      return this.$http.get(`/service/plan-feature/${planId}/equipment/${eventArgs.objectValue}?userId=${this.state.loggedInUser.id}`)
        .then((result) => {
          const networkNodeType = result.data.networkNodeType
          return Promise.resolve(this.state.configuration.networkEquipment.equipments[networkNodeType].iconUrl)
        })
        .catch((err) => console.error(err))
    } else if (eventArgs.objectKey === Constants.MAP_OBJECT_CREATE_KEY_EQUIPMENT_BOUNDARY) {
      // Icon doesn't matter for boundaries, just return an empty string
      return Promise.resolve('')
    }
    return Promise.reject(`Unknown object key ${eventArgs.objectKey}`)
  }

  checkIfBoundaryExists (mapObject) {
    // For frontier if bounudary exists show a warning
    return new Promise((resolve, reject) => {
      if (this.state.configuration.ARO_CLIENT === 'frontier') {
        return this.$http.get(`/service/odata/NetworkBoundaryEntity?$select=objectId&$filter=networkNodeObjectId eq guid'${mapObject.objectId}' and deleted eq false&$top=${this.state.boundaryTypes.length}`)
          .then((result) => {
            if (result.data.length > 0) {
              swal({
                title: 'Warning',
                text: 'You are attempting to delete a site which has a boundary, do you wish to proceed?',
                type: 'warning',
                confirmButtonColor: '#DD6B55',
                confirmButtonText: 'Yes, delete',
                cancelButtonText: 'No',
                showCancelButton: true,
                closeOnConfirm: true
              }, (deleteSite) => {
              // The user has confirmed that the item should be deleted
                deleteSite && resolve(true)
              })
            } else {
              resolve(true)
            }
          })
      } else {
        resolve(true)
      }
    })
  }

  setSelectedMapObjectLoc () {
    var isValid = TileUtilities.isValidLatLong(this.selectedMapObjectLat, this.selectedMapObjectLng)
    if (!isValid) return
    // this.selectedMapObject.setPosition({ lat: this.selectedMapObjectLat, lng: this.selectedMapObjectLng })
    var position = new google.maps.LatLng(this.selectedMapObjectLat, this.selectedMapObjectLng)
    this.selectedMapObject.setPosition(position)
    // this.handleObjectModified(this.selectedMapObject,true)
  }

  checkCanCreateObject (feature, usingMapClick) {
    return true
  }

  $doCheck () {
    // Doing it this way because we don't have a better way to detect when state.selectedBoundaryType has changed
    if (this.state.selectedBoundaryType.id !== this.cachedSelectedBoundaryTypeId ||
        this.state.showSiteBoundary !== this.cachedShowSiteBoundary) {
      // Selected boundary type has changed. See if we want to hide any boundary objects
      this.updateObjectIdsToHide()
      this.cachedSelectedBoundaryTypeId = this.state.selectedBoundaryType.id
      this.cachedShowSiteBoundary = this.state.showSiteBoundary
    }
  }

  $onDestroy () {
    // Useful for cases where the boundary is still generating, but the component has been destroyed. We do not want to create map objects in that case.
    this.isComponentDestroyed = true
    this.clearAllSubnetMapObjects()
    this.clearTransaction()
    this.unsubscribeRedux()
  }

  mapStateToThis (reduxState) {
    return {
      planId: reduxState.plan.activePlan.id,
      currentTransaction: reduxState.planEditor.transaction,
      isPlanEditorActive: reduxState.planEditor.isPlanEditorActive,
      userId: reduxState.user.loggedInUser.id
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      clearTransaction: () => dispatch(PlanEditorActions.clearTransaction()),
      commitTransaction: transactionId => dispatch(PlanEditorActions.commitTransaction(transactionId)),
      discardTransaction: transactionId => dispatch(PlanEditorActions.discardTransaction(transactionId)),
      resumeOrCreateTransaction: (planId, userId) => dispatch(PlanEditorActions.resumeOrCreateTransaction(planId, userId)),
      addEquipmentNodes: equipmentNodes => dispatch(PlanEditorActions.addEquipmentNodes(equipmentNodes))
    }
  }

  mergeToTarget (nextState, actions) {
    const oldTransaction = this.currentTransaction
    // merge state and actions onto controller
    Object.assign(this, nextState)
    Object.assign(this, actions)

    // Why so complicated? Because in the first render, isPlanEditorActive will be false and we will exit plan edit mode.
    // So we only exit plan edit mode if isPlanEditorActive === false AND we have an older transaction. All this because
    // the plan editor (this component) closes itself after a commit/discard. Let it be for now, as this will move to React anyways.
    if (!nextState.isPlanEditorActive && oldTransaction) {
      this.exitPlanEditMode() // The user did a commit or discard on the current transaction
    } else if ((oldTransaction !== nextState.currentTransaction) && nextState.currentTransaction) {
      this.onCurrentTransactionChanged() // A new transaction was created
    }
  }
}

PlanEditorController.$inject = ['$timeout', '$http', '$element', '$filter', '$ngRedux', 'state', 'Utils', 'tileDataService', 'tracker']

let planEditor = {
  templateUrl: '/components/sidebar/plan-editor/plan-editor.html',
  bindings: {
    mapGlobalObjectName: '@'
  },
  controller: PlanEditorController
}

export default planEditor
