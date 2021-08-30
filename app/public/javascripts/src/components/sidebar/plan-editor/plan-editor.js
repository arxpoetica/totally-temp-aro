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
import MapLayerActions from '../../../react/components/map-layers/map-layer-actions'
import ToolBarActions from '../../../react/components/header/tool-bar-actions'
import uuidStore from '../../../shared-utils/uuid-store'
import WktUtils from '../../../shared-utils/wkt-utils'
import coverageActions from '../../../react/components/coverage/coverage-actions'
import CoverageStatusTypes from '../../../react/components/coverage/constants'
import MapUtilities from '../../common/plan/map-utilities'

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
    this.autoRecalculateSubnet = false
    this.stickyAssignment = true
    this.viewEventFeature = {}
    this.viewSiteBoundaryEventFeature = {}
    this.isBoundaryEditMode = false
    this.mapObjectEditorComms = {}
    this.networkNodeSBTypes = {}
    this.locationMarkersById = {} // location ids -> array of associated markers (for circle and line)
    this.isFiberVisiblePreTransaction = false
    // refactor this into redux, use the subnets hook when get transaction
    this.locationsById = {}
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

    this.multiselectTypes = ['location_connector', 'equipment.location_connector']
    this.additionalSelectionsById = {}

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

  registerSelectProposedFeature (selectProposedFeature) {
    this.selectProposedFeature = selectProposedFeature
  }

  registerMapObjectFromEvent (mapObjectFromEvent) {
    this.mapObjectFromEvent = mapObjectFromEvent
  }

  registerHighlightMapObject (highlightMapObject) {
    this.highlightMapObject = highlightMapObject
  }

  registerDehighlightMapObject (dehighlightMapObject) {
    this.dehighlightMapObject = dehighlightMapObject
  }

  registerUpdateMapObjectPosition (updateMapObjectPosition) {
    this.updateMapObjectPosition = updateMapObjectPosition
  }

  $onInit () {
    // We should have a map variable at this point
    if (!window[this.mapGlobalObjectName]) {
      console.error('ERROR: Map Object Editor component initialized, but a map object is not available at this time.')
      return
    }
    this.mapRef = window[this.mapGlobalObjectName]
    // --- these should be part of map-object-editor ... but only when it's used here with plan-editor
    //     so basically this and map-object-editor need to be refactored
    this.rightClickObserver = this.state.mapFeaturesRightClickedEvent.skip(1).subscribe((hitFeatures) => {
      // if location and selected feature type in Location connector then toggle location association to selected locvation Connecotor
      if (hitFeatures.locations.length > 0 && !this.isMultSelectActive()) {
        if (this.selectedObjectId && this.isEditingFeatureProperties) {
          var selectedLatLng = [this.selectedMapObjectLng, this.selectedMapObjectLat]
          var objectProperties = this.objectIdToProperties[this.selectedObjectId]
          if (objectProperties.siteNetworkNodeType === 'location_connector') {
            var location = hitFeatures.locations[0]
            var locationId = location.objectId || location.object_id
            if (objectProperties.connectedLocations.hasOwnProperty(locationId)) {
              delete objectProperties.connectedLocations[locationId]
              this.saveSelectedEquipmentProperties()
              this.clearLocationHighlights([locationId])
              // this.highlightLocations(Object.keys(objectProperties.connectedLocations), selectedLatLng)
            } else {
              // check if the previous connector is in the transaction
              // if not get it and add it
              // then remove this location from that connector
              this.removeLocationFromConnector(locationId)
                .then(() => {
                  objectProperties.connectedLocations[locationId] = true
                  this.saveSelectedEquipmentProperties()

                  this.highlightLocations(Object.keys(objectProperties.connectedLocations), selectedLatLng)
                })
            }
          }
        }
      }
    })

    this.keyClickObserver = this.state.mapFeaturesKeyClickedEvent.skip(1).subscribe((hitFeatures) => {
      // select multiple of same type, onlt for certain types (currently only Location Connectors)
      // for the moment we'll just look at equipment
      this.onMultiSelect(hitFeatures.equipmentFeatures, hitFeatures.latLng)
    })

    this.clickObserver = this.state.mapFeaturesClickedEvent.skip(1).subscribe((hitFeatures) => {
      // on location click highlight associated location connector
      if (hitFeatures.locations && hitFeatures.locations.length > 0) {
        var locationId = hitFeatures.locations[0].objectId || hitFeatures.locations[0].object_id

        this.$http.post(`/service/ring/plan-transaction/${this.currentTransaction.id}/ring/location-equipment/query-cmd`, { 'locationIds': [locationId] })
          .then((results) => {
            if (results.data && results.data.length > 0 && results.data[0].equipmentId) {
              const equipmentId = results.data[0].equipmentId
              if (!this.selectProposedFeature(equipmentId)) {
                this.$http.get(`/service/plan-feature/${this.state.plan.id}/equipment/${equipmentId}?userId=${this.state.loggedInUser.id}`)
                  .then(result => {
                    if (result.data && result.data.geometry) {
                      // ToDo: this is kind of janky
                      var hitFeatures = {
                        latLng: {
                          lat: () => { return result.data.geometry.coordinates[1] },
                          lng: () => { return result.data.geometry.coordinates[0] }
                        },
                        equipmentFeatures: [{
                          is_deleted: 'false',
                          is_locked: 'false',
                          workflow_state_id: 1,
                          object_id: equipmentId,
                          siteClli: 'unkown',
                          _data_type: 'equipment.location_connector'
                        }]
                      }

                      this.state.mapFeaturesSelectedEvent.next(hitFeatures)
                    }
                  })
              }
            }
          }).catch((err) => {
            console.error(err)
          })
      }
    })
    // -----
    // Select the first transaction in the list
    this.resumeOrCreateTransaction(this.planId, this.userId)
  }

  isMultSelectActive () {
    return (Object.keys(this.additionalSelectionsById).length > 0)
  }

  getMultiSelectCount () {
    return Object.keys(this.additionalSelectionsById).length + 1
  }

  clearMultiSelect () {
    // clear highlighting
    Object.keys(this.additionalSelectionsById).forEach(id => {
      this.dehighlightMapObject(this.objectIdToMapObject[id])
    })
    this.additionalSelectionsById = {}
  }

  onMultiSelect (features, latLng) {
    // if selected object is allowed to have multi select
    if (features.length === 0 ||
      !this.selectedMapObject || !this.selectedMapObject.feature.type ||
      this.multiselectTypes.indexOf(this.selectedMapObject.feature.type) < 0) return
    const selectedFeatureType = this.selectedMapObject.feature.type
    // if object is the same type as selected object
    features.forEach(feature => {
      var objectId = feature.objectId || feature.object_id || null
      var featureType = feature.type || feature._data_type || null
      if (objectId && featureType && featureType === selectedFeatureType) {
        if (this.additionalSelectionsById.hasOwnProperty(objectId)) {
          delete this.additionalSelectionsById[objectId]
          // un-highlight map object
          var clearLocationIds = Object.keys(this.objectIdToProperties[objectId].connectedLocations)
          this.dehighlightMapObject(this.objectIdToMapObject[objectId])
          this.clearLocationHighlights(clearLocationIds)
        } else {
          this.additionalSelectionsById[objectId] = true

          if (!this.objectIdToMapObject.hasOwnProperty(objectId)) {
            // no map object, make one
            feature.iconUrl = this.state.configuration.networkEquipment.equipments['location_connector'].iconUrl
            var mockEvent = {
              latLng: latLng,
              equipmentFeatures: [
                feature
              ]
            }
            this.mapObjectFromEvent(mockEvent, true)
          } else {
            // highlight map object
            this.highlightMapObject(this.objectIdToMapObject[objectId])
            if (this.objectIdToProperties[objectId].hasOwnProperty('connectedLocations')) {
              var locationIds = Object.keys(this.objectIdToProperties[objectId].connectedLocations)
              var featureLatLng = this.objectIdToMapObject[objectId].feature.geometry.coordinates
              this.highlightLocations(locationIds, featureLatLng)
            }
          }
        }
      }
    })
    this.$timeout()
  }

  bringLocationConnectorIntoTransaction (equipmentId) {
    return this.$http.get(`/service/plan-feature/${this.state.plan.id}/equipment/${equipmentId}?userId=${this.state.loggedInUser.id}`)
      .then(result => {
        var attributes = result.data.attributes
        const equipmentFeature = AroFeatureFactory.createObject(result.data)
        this.addEquipmentNodes([{ feature: equipmentFeature }])
        var networkNodeEquipment = equipmentFeature.networkNodeEquipment
        const locationIDs = attributes.internal_oid || null
        var equipmentProperties = new EquipmentProperties(networkNodeEquipment.siteInfo.siteClli, networkNodeEquipment.siteInfo.siteName,
          equipmentFeature.networkNodeType, null, networkNodeEquipment, result.data.deploymentType, result.data.target_type, locationIDs)
        this.objectIdToProperties[equipmentId] = equipmentProperties
        return Promise.resolve()
      })
      .catch(err => console.error(err))
  }

  removeLocationFromConnector (locationId) {
    var equipmentId = -1
    var locationConnectorFeature = null
    return this.$http.post(`/service/ring/plan-transaction/${this.currentTransaction.id}/ring/location-equipment/query-cmd`, { 'locationIds': [locationId] })
      .then((results) => {
        if (results.data && results.data.length > 0 && results.data[0].equipmentId) {
          locationConnectorFeature = results.data[0]
          equipmentId = locationConnectorFeature.equipmentId
          const locationConnectorIsInTransaction = Boolean(this.objectIdToProperties[equipmentId])
          return locationConnectorIsInTransaction ? Promise.resolve() : this.bringLocationConnectorIntoTransaction(equipmentId)
        } else {
          return Promise.reject(new Error(`No location connector found for location id ${locationId}`))
        }
      })
      .then(() => {
        delete this.objectIdToProperties[equipmentId].connectedLocations[locationId]
        return this.saveEquipmentProperties(equipmentId)
      })
      .then(() => {
        if (this.objectIdToProperties[equipmentId].connectedLocations.length > 0) {
          // Location connector still has some location(s) connected to it, bring it into the transaction as an editable object
          this.displayEditObject(locationConnectorFeature, false)
        } else {
          // Location connector does not have any locations connected to it. Delete the connector in the transaction.
          this.deleteEquipment(equipmentId)
        }
      })
      .catch((err) => {
        console.error(err)
      })
  }

  onCurrentTransactionChanged () {
    // Turn off feeder fiber
    this.isFiberVisiblePreTransaction = this.feederFiberLayer.checked
    this.setNetworkEquipmentLayerVisibility(this.feederFiberLayer, false)
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
          const locationIDs = attributes.internal_oid || null
          const typedEquipmentNode = AroFeatureFactory.createObject(feature)
          var networkNodeEquipment = typedEquipmentNode.networkNodeEquipment
          typedEquipmentNodes.push(typedEquipmentNode)
          const properties = new EquipmentProperties(attributes.siteIdentifier, attributes.siteName, feature.networkNodeType,
            attributes.selectedEquipmentType, networkNodeEquipment, feature.deploymentType, null, locationIDs)
          this.objectIdToProperties[feature.objectId] = properties
        })
        this.addEquipmentNodes(typedEquipmentNodes.map(node => ({ feature: node })))
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
        return this.state.configuration.planEditor.calculateSubnets ? this.rebuildAllTransactionSubnets() : Promise.resolve()
      })
      .catch((err) => {
        // Log the error, then get out of "plan edit" mode.
        this.setSelectedDisplayMode(this.state.displayModes.VIEW)
        this.$timeout() // I'm not sure if this is needed now that selectedDisplayMode is in react
        console.error(err)
      })
  }

  rebuildAllTransactionSubnets () {
    return this.$http.get(`/service/plan-transaction/${this.currentTransaction.id}/subnets-definition`)
      .then(result => {
        const subnetIdsToRebuild = result.data.map(subnetDefinition => subnetDefinition.subnetId)
        return this.rebuildSubnets(subnetIdsToRebuild)
      })
      .catch(err => console.error(err))
  }

  onAutoRecalculateSubnetChanged () {
    if (this.autoRecalculateSubnet) {
      // Auto-recalculate was turned on. Recalculate all subnets in case equipment was moved.
      this.rebuildAllTransactionSubnets()
    }
  }

  getFeaturesCount () {
    return Object.keys(this.objectIdToProperties).length
  }

  commitTransactionAndExit () {
    this.commitTransaction(this.currentTransaction.id)
    .then(() => {
      this.exitPlanEditMode()
    })
  }

  exitPlanEditMode () {
    this.setNetworkEquipmentLayerVisibility(this.feederFiberLayer, this.isFiberVisiblePreTransaction)

    // You should no longer hide any of the object ids that have been committed or discarded
    var planId = this.state.plan.id
    Object.keys(this.objectIdToProperties).forEach((objectId) => {
      this.tileDataService.removeFeatureToExclude(objectId)
    })

    // this.currentTransaction = null
    this.state.loadModifiedFeatures(planId)
    this.setSelectedDisplayMode(this.state.displayModes.VIEW)
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
          objectId: uuidStore.getUUID(),
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

        // ToDo: this is no longer a thing, what did it used to do?
        // this.digestBoundaryCoverage(feature, result.data, true)

        this.isWorkingOnCoverage = false
        this.state.planEditorChanged.next(true) // recaluculate plansummary
        this.setIsPlanEditorChanged(true)
      })
      .catch((err) => {
        console.error(err)
        this.isWorkingOnCoverage = false
      })
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
    var objectProperties = this.objectIdToProperties[objectId]
    var serviceFeature = {
      objectId: objectId,
      /*
      geometry: {
        type: 'Point',
        coordinates: [mapObject.position.lng().toFixed(6), mapObject.position.lat().toFixed(6)] // Note - longitude, then latitude
      },
      */
      networkNodeType: objectProperties.siteNetworkNodeType,
      // subtypeId: 2, // objectProperties.subtypeId, // <---------------------- CHANGE (move to react) -----<<<
      attributes: {
        siteIdentifier: objectProperties.siteIdentifier,
        siteName: objectProperties.siteName,
        selectedEquipmentType: objectProperties.selectedEquipmentType
      },
      dataType: 'equipment',
      networkNodeEquipment: objectProperties.networkNodeEquipment,
      deploymentType: objectProperties.deploymentType
    }
    if (mapObject) {
      serviceFeature.geometry = {
        type: 'Point',
        coordinates: [mapObject.position.lng().toFixed(6), mapObject.position.lat().toFixed(6)] // Note - longitude, then latitude
      }
    }
    if (objectProperties.targetType) {
      serviceFeature.target_type = objectProperties.targetType
    }

    if (objectProperties.siteNetworkNodeType === 'location_connector') {
      var internalOID = ''
      Object.keys(objectProperties.connectedLocations).forEach(id => {
        internalOID += `${id},`
      })
      if (internalOID.length > 0) internalOID = internalOID.slice(0, -1)
      serviceFeature.attributes.internal_oid = internalOID
    }

    return serviceFeature
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
      geometry: MapUtilities.polygonPathsToWKT(boundaryMapObject.getPaths()),
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
      // this.selectedMapObjectLat = +this.$element.find('#selectedMapObjectLat')[0].value
      // this.selectedMapObjectLng = +this.$element.find('#selectedMapObjectLng')[0].value
      this.selectedMapObjectLat = +equipmentObjectForService.geometry.coordinates[1]
      this.selectedMapObjectLng = +equipmentObjectForService.geometry.coordinates[0]
      this.setSelectedMapObjectLoc()
      // save the mapobject location if changed
      /*
      if (this.selectedMapObjectLat && this.selectedMapObjectLat > -90 && this.selectedMapObjectLat < 90) {
        equipmentObjectForService.geometry.coordinates[1] = this.selectedMapObjectLat.toFixed(6)
      }
      if (this.selectedMapObjectLng && this.selectedMapObjectLng > -180 && this.selectedMapObjectLng < 180) {
        equipmentObjectForService.geometry.coordinates[0] = this.selectedMapObjectLng.toFixed(6)
      }
      */
      return this.$http.put(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`, equipmentObjectForService)
        .then((result) => {
          this.objectIdToProperties[selectedMapObject.objectId].isDirty = false
          this.$timeout()
        })
        .catch((err) => console.error(err))
    }
  }

  saveEquipmentProperties (objectId) {
    var equipmentObjectForService = this.formatEquipmentForService(objectId)
    return this.$http.put(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`, equipmentObjectForService)
      .then((result) => {
        this.objectIdToProperties[objectId].isDirty = false
        this.$timeout()
        return Promise.resolve()
      })
      .catch((err) => console.error(err))
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

  selectEquipment (selectedFeature, featureId) {
    // is this still used?
    // tell state
    var newSelection = this.state.cloneSelection()
    newSelection.editable.equipment = {}
    if (selectedFeature && featureId) {
      newSelection.details.siteBoundaryId = null
      newSelection.editable.equipment[featureId] = selectedFeature
    }
    this.state.selection = newSelection
  }

  clearAllLocationHighlights () {
    this.clearLocationHighlights(Object.keys(this.locationMarkersById))
  }

  clearLocationHighlights (locationIds) {
    locationIds.forEach(id => {
      if (this.locationMarkersById.hasOwnProperty(id)) {
        this.locationMarkersById[id].forEach(marker => {
          marker.setMap(null)
        })
        delete this.locationMarkersById[id]
      }
    })
  }

  highlightLocations (locationIds, hubLatLng) {
    if (locationIds && typeof locationIds === 'object') {
      this.getLocationsInfoPromise(locationIds)
        .then(result => {
          locationIds.forEach((locationId) => {
            var location = this.locationsById[locationId]
            // --- NEED TO HAVE LAT LONG FOR LOCATIONS ---
            if (location && location.hasOwnProperty('geometry')) {
              this.clearLocationHighlights([locationId])
              this.locationMarkersById[locationId] = []
              var mapMarker = new google.maps.Marker({
                position: new google.maps.LatLng(location.geometry.coordinates[1], location.geometry.coordinates[0]),
                icon: {
                  url: '/images/map_icons/aro/green_circle.png',
                  anchor: new google.maps.Point(16, 24)
                },
                draggable: false,
                clickable: false,
                map: this.mapRef
              })
              this.locationMarkersById[locationId].push(mapMarker)
              if (hubLatLng) {
                // draw line to connector
                var lineGeometry = [
                  {
                    lat: location.geometry.coordinates[1],
                    lng: location.geometry.coordinates[0]
                  },
                  {
                    lat: hubLatLng[1],
                    lng: hubLatLng[0]
                  }
                ]
                var lineMapObject = new google.maps.Polyline({
                  path: lineGeometry,
                  strokeColor: '#009900',
                  strokeWeight: 1,
                  clickable: false,
                  map: this.mapRef
                })
                this.locationMarkersById[locationId].push(lineMapObject)
              }
            }
          })
        })
    }
  }

  clearViewSelection () {
    this.viewEventFeature = {}
    this.setIsEditingFeatureProperties(true)
    this.isBoundaryEditMode = false
    this.selectEquipment()
  }

  displayViewObject (feature, iconUrl) {
    // First unselect all equipment and boundary features
    this.viewEventFeature = null
    this.setIsEditingFeatureProperties(false)
    this.viewSiteBoundaryEventFeature = null
    this.isBoundaryEditMode = false
    if (feature.type && feature.type === 'equipment_boundary.select') {
      var newSelection = this.state.cloneSelection()
      newSelection.details.siteBoundaryId = feature.objectId
      this.state.selection = newSelection
      this.displaySiteBoundaryViewObject(feature, iconUrl)
    } else {
      this.displayEquipmentViewObject(feature, iconUrl)
    }
  }

  displayEditObject (feature, isMult) {
    this.setIsCreatingObject(true)
    if (feature.type && feature.type === 'equipment_boundary.select') {
      return this.displaySiteBoundaryViewObject(feature)
        .then(result => this.editViewSiteBoundaryObject())
        .catch(err => console.error(err))
    } else {
      return this.displayEquipmentViewObject(feature)
        .then(result => this.editViewObject(isMult))
        .catch(err => console.error(err))
    }
  }

  displayEquipmentViewObject (feature, iconUrl) {
    this.viewEquipmentProperties(this.planId, feature.objectId, this.transactionFeatures)
    return new Promise((resolve, reject) => {
      var planId = this.state.plan.id
      this.$http.get(`/service/plan-feature/${planId}/equipment/${feature.objectId}?userId=${this.state.loggedInUser.id}`)
        .then((result) => {
          if (result.data.hasOwnProperty('geometry')) {
            this.viewEventFeature = feature
            // use feature's coord NOT the event's coords
            this.viewEventFeature.geometry = result.data.geometry
            const viewFeature = AroFeatureFactory.createObject(result.data)
            var viewConfig = this.state.configuration.networkEquipment.equipments[viewFeature.networkNodeType]
            this.viewLabel = viewConfig.label
            this.viewIconUrl = viewConfig.iconUrl
            this.setIsEditingFeatureProperties(false)
            this.getViewObjectSBTypes(feature.objectId)
            this.selectEquipment(result.data, feature.objectId)
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

  getLocationsInfoPromise (locationIds) {
    // check this.locationsById to see if we already have them
    var returnLocations = {}
    var locationIdsToGet = []
    locationIds.forEach(id => {
      if (this.locationsById.hasOwnProperty(id)) {
        returnLocations[id] = this.locationsById[id]
      } else {
        locationIdsToGet.push(id)
      }
    })

    if (locationIdsToGet.length === 0) {
      return new Promise((resolve, reject) => {
        resolve(returnLocations)
      })
    } else {
      return this.$http.post(`/service/plan-feature/${this.state.plan.id}/location?userId=${this.state.loggedInUser.id}`, { objectIds: locationIdsToGet })
        .then((result) => {
          result.data.forEach(location => {
            this.locationsById[location.objectId] = location
            returnLocations[location.objectId] = location
          })
          return returnLocations
        })
    }
  }

  displaySiteBoundaryViewObject (feature, iconUrl) {
    this.viewBoundaryProperties(this.planId, feature.objectId, this.transactionFeatures)
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

  editViewObject (isMult) {
    return this.createEditableExistingMapObject && this.createEditableExistingMapObject(this.viewEventFeature, this.viewIconUrl, isMult)
  }

  editViewSiteBoundaryObject () {
    this.createEditableExistingMapObject && this.createEditableExistingMapObject(this.viewSiteBoundaryEventFeature, null)
  }

  handleObjectCreated (mapObject, usingMapClick, feature, deleteExistingBoundary) {
    this.objectIdToMapObject[mapObject.objectId] = mapObject
    var promiseToReturn = null
    if (usingMapClick && this.isMarker(mapObject)) {
      // This is a equipment marker and not a boundary. We should have a better way of detecting this
      if (feature.isExistingObject) {
        // clone of existing or planned equipment
        const planId = this.state.plan.id
        // Add modified features to vector tiles and do the rendering, etc.
        this.setIsCreatingObject(true)
        promiseToReturn = this.state.loadModifiedFeatures(planId)
          .then(() => {
            this.state.requestMapLayerRefresh.next(null)
            return this.$http.get(`/service/plan-feature/${planId}/equipment/${mapObject.objectId}?userId=${this.state.loggedInUser.id}`)
          })
          .then((result) => {
            var attributes = result.data.attributes
            const equipmentFeature = AroFeatureFactory.createObject(result.data)
            this.addEquipmentNodes([{ feature: equipmentFeature }])
            var networkNodeEquipment = equipmentFeature.networkNodeEquipment
            var equipmentProperties = null
            const locationIDs = attributes.internal_oid || null

            if (this.objectIdToProperties.hasOwnProperty(mapObject.objectId)) {
              equipmentProperties = this.objectIdToProperties[mapObject.objectId]
            } else {
              equipmentProperties = new EquipmentProperties(networkNodeEquipment.siteInfo.siteClli, networkNodeEquipment.siteInfo.siteName,
                equipmentFeature.networkNodeType, null, networkNodeEquipment, result.data.deploymentType, result.data.target_type, locationIDs)
              // this.objectIdToProperties[mapObject.objectId] = new EquipmentProperties(networkNodeEquipment.siteInfo.siteClli, networkNodeEquipment.siteInfo.siteName,
              //                                                                        equipmentFeature.networkNodeType, null, networkNodeEquipment, result.data.deploymentType)
              this.objectIdToProperties[mapObject.objectId] = equipmentProperties
            }
            var equipmentObject = this.formatEquipmentForService(mapObject.objectId)
            // if selected show locations
            if (equipmentProperties.hasOwnProperty('connectedLocations')) {
              var locationIds = Object.keys(equipmentProperties.connectedLocations)
              this.getLocationsInfoPromise(locationIds)
                .then(results => {
                  const isMultSelect = this.additionalSelectionsById.hasOwnProperty(mapObject.objectId)
                  if (this.selectedObjectId === mapObject.objectId || isMultSelect) {
                    if (!isMultSelect) this.clearAllLocationHighlights()
                    this.highlightLocations(locationIds, result.data.geometry.coordinates)
                  }
                })
            }

            this.getViewObjectSBTypes(mapObject.objectId)
            this.$timeout()
            return this.$http.post(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`, equipmentObject)
              .then(() => this.$http.get(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`))
              .then((result) => {
              // Always assign subnet parent on object creation, even if we are not creating a route. This way, if the user
              // later turns on auto-recalculate, it will generate the entire subnet.
                var currentEquipmentWithSubnetId = result.data.filter((item) => item.objectId === equipmentObject.objectId)[0]
                if (!this.state.configuration.planEditor.calculateSubnets) {
                  return Promise.resolve()  // Never calculate subnets
                } else if (this.networkNodeTypeCanHaveSubnet(equipmentFeature.networkNodeType)) {
                  return this.assignSubnetParent(currentEquipmentWithSubnetId)
                } else {
                  return Promise.reject({ softReject: true, message: `Network node type ${equipmentFeature.networkNodeType} does not support subnet calculation.` })
                }
              })
              .then(() => (this.autoRecalculateSubnet && this.state.configuration.planEditor.calculateSubnets) ? this.recalculateSubnetForEquipmentChange(feature) : Promise.resolve())
              .then(() => { this.setIsCreatingObject(false) })
              .catch((err) => {
                if (err.softReject) {
                  console.info(err.message)
                } else {
                  console.error(err)
                }
                this.setIsCreatingObject(false)
              })
          })
          .catch((err) => {
            console.error(err)
            this.setIsCreatingObject(false)
          })
      } else {
        // nope it's new
        const equipmentNode = AroFeatureFactory.createObject({ dataType: 'equipment' })
        // --- new be sure to set subnet ---
        equipmentNode.objectId = mapObject.objectId
        equipmentNode.geometry = JSON.parse(JSON.stringify(mapObject.feature.geometry))
        equipmentNode.networkNodeType = mapObject.feature.networkNodeType
        this.addEquipmentNodes([{ feature: equipmentNode }])
        var blankNetworkNodeEquipment = equipmentNode.networkNodeEquipment
        this.objectIdToProperties[mapObject.objectId] = new EquipmentProperties('', '', feature.networkNodeType, this.lastSelectedEquipmentType, blankNetworkNodeEquipment, 'PLANNED', 'sewer')
        var equipmentObject = this.formatEquipmentForService(mapObject.objectId)
        this.setIsCreatingObject(true)
        promiseToReturn = this.$http.post(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`, equipmentObject)
          .then(() => this.$http.get(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`))
          .then((result) => {
            var currentEquipmentWithSubnetId = result.data.filter((item) => item.objectId === equipmentObject.objectId)[0]
            if (!this.state.configuration.planEditor.calculateSubnets) {
              return Promise.resolve()  // Never calculate subnets
            } else if (this.networkNodeTypeCanHaveSubnet(feature.networkNodeType)) {
              return this.assignSubnetParent(currentEquipmentWithSubnetId)
            } else {
              return Promise.reject({ softReject: true, message: `Network node type ${feature.networkNodeType} does not support subnet calculation.` })
            }
          })
          .then(() => (this.autoRecalculateSubnet && this.state.configuration.planEditor.calculateSubnets) ? this.recalculateSubnetForEquipmentChange(feature) : Promise.resolve())
          .then(() => { this.setIsCreatingObject(false) })
          .catch((err) => {
            if (err.softReject) {
              console.info(err.message)
            } else {
              console.error(err)
            }
            this.setIsCreatingObject(false)
          })
      }
    } else if (!this.isMarker(mapObject)) {
      // If the user has drawn the boundary, we will have an associated object in the "feature" attributes. Save associations.
      this.setIsCreatingObject(true)
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
      promiseToReturn = this.$http.post(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment_boundary`, serviceFeature)
        .then(() => this.setIsCreatingObject(false))
        .catch((err) => {
          console.error(err)
          this.setIsCreatingObject(false)
        })
    }
    this.updateObjectIdsToHide()
    this.$timeout()
    return promiseToReturn
  }

  deleteBoundary (boundaryId) {
    if (!boundaryId) return
    var eqId = this.boundaryIdToEquipmentId[boundaryId]
    delete this.equipmentIdToBoundaryId[eqId]
    delete this.boundaryIdToEquipmentId[boundaryId]
    this.deleteObjectWithId && this.deleteObjectWithId(boundaryId)
    this.deleteCreatedMapObjectWithId && this.deleteCreatedMapObjectWithId(boundaryId) // Delete Boundary from map
  }

  handleSelectedObjectChanged (mapObject, isMult) {
    if (typeof isMult === 'undefined') isMult = false
    if (!isMult) {
      this.clearMultiSelect()
    }
    if (this.currentTransaction === null) {
      this.clearAllLocationHighlights()
      // this.highlightLocations()
      return
    }

    var mapObjectId = null
    var isMultSelect = false

    if (mapObject != null) {
      mapObjectId = mapObject.objectId || mapObject.object_id
      isMultSelect = !!(mapObjectId && this.additionalSelectionsById.hasOwnProperty(mapObjectId))
    }
    var lat = mapObject && mapObject.position && mapObject.position.lat()
    var lng = mapObject && mapObject.position && mapObject.position.lng()
    if (!isMultSelect) {
      if (mapObject != null) {
        this.selectEquipment()
        this.setIsEditingFeatureProperties(true)
        this.isBoundaryEditMode = true
        this.selectedObjectId = mapObjectId
      } else {
        this.selectedObjectId = null
      }
      this.selectedMapObject = mapObject
      this.selectedMapObjectLat = mapObject && mapObject.position && +this.$filter('number')(+lat, 6)
      this.selectedMapObjectLng = mapObject && mapObject.position && +this.$filter('number')(+lng, 6)
    }
    var locations = null
    if (this.objectIdToProperties.hasOwnProperty(mapObjectId) &&
      this.objectIdToProperties[mapObjectId].hasOwnProperty('connectedLocations')) {
      locations = Object.keys(this.objectIdToProperties[mapObjectId].connectedLocations)
    }
    if (!isMultSelect) this.clearAllLocationHighlights()
    this.highlightLocations(locations, [lng, lat])
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
      this.setIsModifyingObject(true)
      this.$http.get(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`)
        .then((result) => {
          var equipmentObject = result.data.filter((item) => item.objectId === mapObject.objectId)[0]
          equipmentObject.geometry.coordinates = [mapObject.position.lng().toFixed(6), mapObject.position.lat().toFixed(6)] // Note - longitude, then latitude
          // return this.$http.post(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`, equipmentObject)
          return this.modifyEquipmentFeature(this.currentTransaction.id, { feature: equipmentObject })
        })
        .then((result) => {
          this.objectIdToProperties[mapObject.objectId].isDirty = false
          if (this.selectedObjectId === mapObject.objectId &&
            this.objectIdToProperties[this.selectedObjectId].hasOwnProperty('connectedLocations')) {
            var locations = Object.keys(this.objectIdToProperties[this.selectedObjectId].connectedLocations)
            // this.clearAllLocationHighlights()
            this.highlightLocations(locations, [mapObject.position.lng(), mapObject.position.lat()])
          }
          const equipmentToRecalculate = {
            objectId: mapObject.objectId,
            networkNodeType: this.objectIdToProperties[mapObject.objectId].siteNetworkNodeType,
            geometry: {
              coordinates: [mapObject.position.lng(), mapObject.position.lat()]
            }
          }
          this.$timeout()
          return (this.autoRecalculateSubnet && this.state.configuration.planEditor.calculateSubnets) ? this.recalculateSubnetForEquipmentChange(equipmentToRecalculate) : Promise.resolve()
        })
        .then(() => { this.setIsModifyingObject(false) })
        .catch((err) => {
          console.error(err)
          this.setIsModifyingObject(false)
        })

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
      // Update the geometry
      serviceFeature.geometry = WktUtils.getWKTPolygonFromGoogleMapPath(mapObject.getPaths().getAt(0))
      this.modifyEquipmentBoundaryFeature(this.currentTransaction.id, { feature: serviceFeature })
      this.clearCoverageForBoundary(mapObject.objectId)
    }
  }

  requestDeleteMultiSelectGroup () {
    var label = this.getSelectedNetworkConfig().label
    swal({
      title: 'Delete all?',
      text: `Are you sure you want to delete ${this.getMultiSelectCount()} ${label}s?`,
      type: 'warning',
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Delete', // 'Yes',
      showCancelButton: true,
      cancelButtonText: 'Cancel', // 'No',
      closeOnConfirm: true
    }, (result) => {
      if (result) {
        this.deleteMultiSelectGroup()
      }
    })
  }

  mergeMultiSelectGroup () {
    var selectedId = this.selectedObjectId
    var rootProperties = this.objectIdToProperties[selectedId]
    // var locationIds = []
    var savePromises = []
    Object.keys(this.additionalSelectionsById).forEach(objectId => {
      var objectProperties = this.objectIdToProperties[objectId]
      Object.keys(objectProperties.connectedLocations).forEach(locationId => {
        rootProperties.connectedLocations[locationId] = true
      })
      objectProperties.connectedLocations = {}
      savePromises.push(this.saveEquipmentProperties(objectId))
    })
    savePromises.push(this.saveSelectedEquipmentProperties())
    Promise.all(savePromises)
      .then(() => {
        this.deleteMultiSelectGroup(true)
        // reselect
        this.selectProposedFeature(selectedId)
      })
  }

  deleteMultiSelectGroup (leaveRoot) {
    if (typeof leaveRoot === 'undefined') leaveRoot = false
    var idsToDelete = JSON.parse(JSON.stringify(this.additionalSelectionsById))
    if (!leaveRoot) idsToDelete[this.selectedMapObject.objectId] = true
    this.clearMultiSelect()
    this.clearViewSelection()
    var lastResult = Promise.resolve()
    Object.keys(idsToDelete).forEach(id => {
      lastResult = lastResult.then(() => this.deleteObjectWithId(id))
    })
  }

  handleObjectDeleted (mapObject) {
    if (this.isMarker(mapObject)) {
      // This is a equipment marker and not a boundary. We should have a better way of detecting this
      return this.checkIfBoundaryExists(mapObject)
        .then((deleteObject) => {
          if (deleteObject) {
            this.deleteCreatedMapObjectWithId(mapObject.objectId) // Delete the marker from map
            return this.deleteEquipment(mapObject.objectId) // Delete the marker
          }
        })
    } else {
      this.deleteCreatedMapObjectWithId(mapObject.objectId) // Delete the boundary from map
      return this.$http.delete(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment_boundary/${mapObject.objectId}`)
        .then(() => {
          this.refreshViewObjectSBTypes(mapObject.objectId) // refresh network node SB type
          this.state.planEditorChanged.next(true) // recaluculate plansummary
          this.setIsPlanEditorChanged(true)
        })
    }
  }

  deleteEquipment (equipmentObjectId) {
    return this.deleteTransactionFeature(this.currentTransaction.id, 'equipment', this.transactionFeatures[equipmentObjectId])
      .then(() => {
        return this.autoRecalculateSubnet
          ? this.$http.get(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`)
          : Promise.resolve()
      })
      .then((result) => {
        if (this.autoRecalculateSubnet) {
          if (result && result.data.length > 0) {
            // There is at least one piece of equipment in the transaction. Use that for routing
            return this.recalculateSubnetForEquipmentChange(result.data[0])
          } else {
            // There is no equipment left in the transaction. Just remove the subnet map objects
            return this.clearAllSubnetMapObjects()
          }
        } else {
          return Promise.resolve()
        }
      })
      .then(() => {
        // If this is an equipment, delete its associated boundary (if any)
        const boundaryObjectId = this.equipmentIdToBoundaryId[equipmentObjectId]
        if (!boundaryObjectId) {
          this.state.boundaryTypes.forEach((boundaryType) => {
            boundaryType.name !== 'fiveg_coverage' && this.getAndDeleteAssociatedEquSiteBoundary(equipmentObjectId, boundaryType.id)
          })
        } else {
          this.deleteBoundary(boundaryObjectId) // boundary is in edit mode
        }
        this.state.planEditorChanged.next(true) // recaluculate plansummary
        this.setIsPlanEditorChanged(true)
      })
      .catch((err) => console.error(err))
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

  deleteBoundaryInNonEditMode (boundaryId) {
    this.$http.delete(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment_boundary/${boundaryId}`)
      .then(() => {
        // Once commited boundary will be deleted until then it's excluded from showing on the map
        this.tileDataService.addFeatureToExclude(boundaryId)
        this.state.requestMapLayerRefresh.next(null)
        this.refreshViewObjectSBTypes(boundaryId) // refresh network node SB type
        this.state.planEditorChanged.next(true) // recaluculate plansummary
        this.setIsPlanEditorChanged(true)
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
      searchType: 'CLOSEST'
    }
    var closestSubnetId = null
    var subnetDefinitions = null
    return this.$http.post(`/service/plan-transaction/${this.currentTransaction.id}/subnets-search`, searchBody)
      .then(result => {
        closestSubnetId = result.data.objectId
        equipmentFeature.subnetId = closestSubnetId
        return this.$http.put(`/service/plan-transactions/${this.currentTransaction.id}/modified-features/equipment`, equipmentFeature)
      })
      .then(result => this.$http.get(`/service/plan-transaction/${this.currentTransaction.id}/subnets-definition`))
      .then(result => {
        subnetDefinitions = result.data
        // First remove this equipment feature from any subnets
        var removePromises = subnetDefinitions.map(subnetDefinition => {
          const newLinkMapping = subnetDefinition.linkMapping.filter(link => link.equipmentId !== equipmentFeature.objectId)
          if (newLinkMapping.length !== subnetDefinition.linkMapping.length) {
            // This means that this subnet contained this equipment and has changed
            subnetDefinition.linkMapping = newLinkMapping
            return this.$http.post(`/service/plan-transaction/${this.currentTransaction.id}/subnets-definition`, subnetDefinition)
          } else {
            return Promise.resolve()
          }
        })
        return Promise.all(removePromises)
      })
      .then(() => {
        // Then, add the equipment feature to the closest subnet
        var subnetToAddTo = subnetDefinitions.filter(subnet => subnet.subnetId === closestSubnetId)[0]
        if (subnetToAddTo) {
          subnetToAddTo.linkMapping.push({
            equipmentId: equipmentFeature.objectId,
            nodeType: equipmentFeature.networkNodeType,
            fiberStrandDemand: 1,
            atomicUnits: 32
          })
          return this.$http.post(`/service/plan-transaction/${this.currentTransaction.id}/subnets-definition`, subnetToAddTo)
        } else {
          return Promise.resolve()
        }
      })
      .then(() => Promise.resolve(closestSubnetId))
  }

  recalculateSubnetForEquipmentChange (equipmentFeature) {
    var subnetIdsToDelete = []
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
      .then(result => this.$http.get(`/service/plan-transaction/${this.currentTransaction.id}/subnets-definition`))
      .then(subnetDefinitions => {
        subnetIdsToDelete = subnetDefinitions.data.filter(subnetDefinition => {
          return subnetDefinition.linkMapping.filter(linkMapping => linkMapping.equipmentId === equipmentFeature.objectId).length > 0
        })
          .map(subnetDefinition => subnetDefinition.subnetId)

        return Promise.all(subnetIdsToDelete.map(subnetId => this.$http.delete(`/service/plan-transaction/${this.currentTransaction.id}/subnet-feature/${subnetId}`)))
      })
      .then(() => this.rebuildSubnets(subnetIdsToDelete))
      .catch((err) => {
        if (err.softReject) {
          console.info(err.message)
        } else {
          console.error(err)
        }
      })
  }

  rebuildSubnets (subnetIdsToRebuild) {
    const recalcBody = {
      subnetIds: subnetIdsToRebuild
    }
    this.clearSubnetMapObjects(subnetIdsToRebuild)
    this.setIsCalculatingSubnets(true)
    return this.$http.post(`/service/plan-transaction/${this.currentTransaction.id}/subnets-recalc?saveFeature=true`, recalcBody)
      .then(subnetResult => {
        this.state.planEditorChanged.next(true)
        this.setIsPlanEditorChanged(true)
        subnetResult.data.forEach(subnet => {
          this.subnetMapObjects[subnet.feature.objectId] = []
          subnet.feature.subnetLinks.forEach(subnetLink => {
            subnetLink.conduitLinkSummary.planConduits.forEach(planConduit => {
              var polylines = []
              if (planConduit.geometry.type === 'LineString') {
                polylines.push(WktUtils.getGoogleMapPathsFromWKTLineString(planConduit.geometry))
              } else if (planConduit.geometry.type === 'MultiLineString') {
                polylines = WktUtils.getGoogleMapPathsFromWKTMultiLineString(planConduit.geometry)
              }
              // Spatial edges type can be a conduit type or a road type. If we don't find any definition, use a default color.
              const pcSpatialEdgeType = planConduit.ref.spatialEdgeType
              const conduitColor = this.conduitMapLayers && this.conduitMapLayers[pcSpatialEdgeType] && this.conduitMapLayers[pcSpatialEdgeType].drawingOptions && this.conduitMapLayers[pcSpatialEdgeType].drawingOptions.strokeStyle
              const roadColor = this.roadMapLayers && this.roadMapLayers[pcSpatialEdgeType] && this.roadMapLayers[pcSpatialEdgeType].drawingOptions && this.roadMapLayers[pcSpatialEdgeType].drawingOptions.strokeStyle
              const strokeColor = conduitColor || roadColor || 'black'
              polylines.forEach(polyline => {
                var subnetLineMapObject = new google.maps.Polyline({
                  path: polyline,
                  strokeColor: strokeColor,
                  strokeWeight: 4,
                  clickable: false,
                  map: this.mapRef
                })
                this.subnetMapObjects[subnet.feature.objectId].push(subnetLineMapObject)
              })
            })
          })
        })
        this.setIsCalculatingSubnets(false)
      })
      .catch(err => {
        this.setIsCalculatingSubnets(false)
        console.error(err)
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
    this.clearSubnetMapObjects(Object.keys(this.subnetMapObjects))
  }

  clearSubnetMapObjects (subnetIds) {
    subnetIds.forEach((key) => {
      (this.subnetMapObjects[key] || []).forEach((subnetLineMapObject) => subnetLineMapObject.setMap(null))
      delete this.subnetMapObjects[key]
    })
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
    this.rightClickObserver.unsubscribe()
    this.keyClickObserver.unsubscribe()
    this.clickObserver.unsubscribe()
    this.clearAllLocationHighlights()
    this.clearBoundaryCoverage()
    // this.highlightLocations()
    // todo: if keep unsaved, still can't run analysis
    if (this.currentTransaction) {
      swal({
        title: 'Save changes?',
        text: 'Do you want to save your changes?',
        type: 'warning',
        confirmButtonColor: '#DD6B55',
        confirmButtonText: 'Save', // 'Yes',
        showCancelButton: true,
        cancelButtonText: 'Keep Unsaved', // 'No',
        closeOnConfirm: true
      }, (result) => {
        if (result) {
          this.commitTransaction(this.currentTransaction.id)
        } else {
          // this.discardTransaction(this.currentTransaction.id)
        }
        this.clearAllSubnetMapObjects()
        // this.clearTransaction()
        this.unsubscribeRedux()
      })
    } else {
      this.clearAllSubnetMapObjects()
      this.clearTransaction()
      this.unsubscribeRedux()
    }
  }

  mapStateToThis (reduxState) {
    return {
      feederFiberLayer: reduxState.mapLayers.networkEquipment.cables.FEEDER,
      // locationsLayer: reduxState.mapLayers.location,
      planId: reduxState.plan.activePlan.id,
      currentTransaction: reduxState.planEditor.transaction,
      transactionFeatures: reduxState.planEditor.features,
      selectedFeatures: reduxState.selection.planEditorFeatures,
      isPlanEditorActive: reduxState.planEditor.isPlanEditorActive,
      isCalculatingSubnets: reduxState.planEditor.isCalculatingSubnets,
      isCreatingObject: reduxState.planEditor.isCreatingObject,
      isModifyingObject: reduxState.planEditor.isModifyingObject,
      isEditingFeatureProperties: reduxState.planEditor.isEditingFeatureProperties,
      isCommittingTransaction: reduxState.planEditor.isCommittingTransaction,
      isEnteringTransaction: reduxState.planEditor.isEnteringTransaction,
      userId: reduxState.user.loggedInUser.id,
      conduitMapLayers: reduxState.mapLayers.networkEquipment.conduits,
      roadMapLayers: reduxState.mapLayers.networkEquipment.roads
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      clearTransaction: () => dispatch(PlanEditorActions.clearTransaction()),
      commitTransaction: transactionId => { return dispatch(PlanEditorActions.commitTransaction(transactionId)) },
      discardTransaction: transactionId => dispatch(PlanEditorActions.discardTransaction(transactionId)),
      resumeOrCreateTransaction: (planId, userId) => dispatch(PlanEditorActions.resumeOrCreateTransaction(planId, userId)),
      deleteTransactionFeature: (transactionId, featureType, transactionFeature) => dispatch(PlanEditorActions.deleteTransactionFeature(transactionId, featureType, transactionFeature)),
      addEquipmentNodes: equipmentNodes => dispatch(PlanEditorActions.addTransactionFeatures(equipmentNodes)),
      modifyEquipmentFeature: (transactionId, feature) => dispatch(PlanEditorActions.modifyFeature('equipment', transactionId, feature)),
      modifyEquipmentBoundaryFeature: (transactionId, feature) => dispatch(PlanEditorActions.modifyFeature('equipment_boundary', transactionId, feature)),
      setNetworkEquipmentLayerVisibility: (layer, isVisible) => dispatch(MapLayerActions.setNetworkEquipmentLayerVisibility('cables', layer, isVisible)),
      setIsCalculatingSubnets: isCalculatingSubnets => dispatch(PlanEditorActions.setIsCalculatingSubnets(isCalculatingSubnets)),
      setIsCreatingObject: isCreatingObject => dispatch(PlanEditorActions.setIsCreatingObject(isCreatingObject)),
      setIsModifyingObject: isModifyingObject => dispatch(PlanEditorActions.setIsModifyingObject(isModifyingObject)),
      setIsEditingFeatureProperties: isEditing => dispatch(PlanEditorActions.setIsEditingFeatureProperties(isEditing)),
      viewEquipmentProperties: (planId, equipmentObjectId, transactionFeatures) => dispatch(PlanEditorActions.viewFeatureProperties('equipment', planId, equipmentObjectId, transactionFeatures)),
      viewBoundaryProperties: (planId, boundaryObjectId, transactionFeatures) => dispatch(PlanEditorActions.viewFeatureProperties('equipment_boundary', planId, boundaryObjectId, transactionFeatures)),
      clearCoverageForBoundary: objectId => dispatch(coverageActions.addBoundaryCoverage(objectId, null)),
      clearBoundaryCoverage: () => dispatch(coverageActions.clearBoundaryCoverage()),
      setSelectedDisplayMode: displayMode => dispatch(ToolBarActions.selectedDisplayMode(displayMode)),
      setIsPlanEditorChanged: isPlanEditorChanged => dispatch(PlanEditorActions.setIsPlanEditorChanged(isPlanEditorChanged)),
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
