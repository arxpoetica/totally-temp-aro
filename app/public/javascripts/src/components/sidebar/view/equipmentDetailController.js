import AroFeatureFactory from '../../../service-typegen/dist/AroFeatureFactory'

class EquipmentDetailController {
  constructor ($http, $timeout, $ngRedux, state, tileDataService) {
    this.angular = angular
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
    this.tileDataService = tileDataService
    this.networkNodeType = ''
    this.selectedEquipment = ''
    this.equipmentFeature = {}
    this.equipmentData = null
    this.boundsObjectId = null
    this.coverageOutput = null
    this.showCoverageOutput = false
    this.isWorkingOnCoverage = false
    this.boundsData = null
    this.headerIcon = ''
    this.networkNodeLabel = ''
    this.isComponentDestroyed = false
    this.selectedFiber = {}

    this.EquipmentDetailView = Object.freeze({
      List: 0,
      Detail: 1,
      Fiber: 2
    })
    this.currentEquipmentDetailView = this.EquipmentDetailView.List

    // Skip the first event as it will be the existing value of mapFeaturesSelectedEvent
    this.mapFeatureSelectedSubscriber = state.mapFeaturesSelectedEvent.skip(1).subscribe((options) => {
      // most of this function is assuring the properties we need exist.
      // In ruler mode click should not perform any view action's
      if (!this.state.StateViewMode.allowViewModeClickAction(this.state)) return
      if (options.hasOwnProperty('roadSegments') && options.roadSegments.size > 0) return

      const plan = state.plan
      const userId = this.state.loggedInUser.id

      if (options.hasOwnProperty('equipmentFeatures') && options.equipmentFeatures.length > 0) {
        this.selectedEquipment = ''
        var equipmentList = this.state.getValidEquipmentFeaturesList(options.equipmentFeatures) // Filter Deleted equipment features
        if (equipmentList.length > 0) {
          const equipment = equipmentList[0]
          this.updateSelectedState(equipment)

          this.displayEquipment(plan.id, equipment.object_id)
            .then((equipmentInfo) => {
              this.checkForBounds(equipment.object_id)
            })
        }
      } else if (options.hasOwnProperty('fiberFeatures') && options.fiberFeatures.size > 0) {
        this.selectedFiber = {}
        var fiberList = options.fiberFeatures
        const fiber = [...fiberList][0]
        var newSelection = state.cloneSelection()
        newSelection.details.fiberSegments = options.fiberFeatures
        state.selection = newSelection

        fiber.attributes = {}
        this.selectedFiber = fiber

        this.$http.get(`/service/plan-feature/${plan.id}/fiber/${fiber.id}?userId=${userId}`)
          .then(result => {
            fiber.attributes = result.data.attributes
            this.$timeout()
          })
          .catch(err => console.error(err))

        this.currentEquipmentDetailView = this.EquipmentDetailView.Fiber
        this.state.activeViewModePanel = this.state.viewModePanels.EQUIPMENT_INFO
        this.$timeout()
      }
    })

    this.clearViewModeSubscription = state.clearViewMode.subscribe((clear) => {
      if (clear) {
        this.clearSelection()
      }
    })

    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)
  }

  clearSelection () {
    this.networkNodeType = ''
    this.equipmentFeature = {}
    this.selectedFiber = {}
    this.equipmentData = null
    this.boundsData = null
    this.isWorkingOnCoverage = false
    this.updateSelectedState()
    this.currentEquipmentDetailView = this.EquipmentDetailView.List
  }

  updateSelectedState (selectedFeature) {
    var newSelection = this.state.cloneSelection()
    newSelection.editable.equipment = {}
    newSelection.details.fiberSegments = new Set()
	  if (typeof selectedFeature !== 'undefined') {
      newSelection.editable.equipment[selectedFeature
        .object_id || selectedFeature.objectId] = selectedFeature
    }
    this.state.selection = newSelection
  }

  displayEquipment (planId, objectId) {
    this.coverageOutput = null
    this.showCoverageOutput = false
	  return this.$http.get(`/service/plan-feature/${planId}/equipment/${objectId}?userId=${this.state.loggedInUser.id}`)
      .then((result) => {
        const equipmentInfo = result.data
        if (equipmentInfo.hasOwnProperty('dataType') && equipmentInfo.hasOwnProperty('objectId')) {
          if (this.state.configuration.networkEquipment.equipments.hasOwnProperty(equipmentInfo.networkNodeType)) {
            this.headerIcon = this.state.configuration.networkEquipment.equipments[equipmentInfo.networkNodeType].iconUrl
            this.networkNodeLabel = this.state.configuration.networkEquipment.equipments[equipmentInfo.networkNodeType].label
          } else {
          // no icon
            this.headerIcon = ''
            this.networkNodeLabel = equipmentInfo.networkNodeType
          }

          this.equipmentData = equipmentInfo

          this.networkNodeType = equipmentInfo.networkNodeType
          this.selectedEquipmentGeog = equipmentInfo.geometry.coordinates

          this.equipmentFeature = AroFeatureFactory.createObject(equipmentInfo).networkNodeEquipment
          this.currentEquipmentDetailView = this.EquipmentDetailView.Detail

          this.state.activeViewModePanel = this.state.viewModePanels.EQUIPMENT_INFO
          this.$timeout()
        } else {
          this.clearSelection()
        }
        return equipmentInfo
      }).catch((err) => {
        console.error(err)
      })
  }

  viewSelectedEquipment (selectedEquipment, isZoom) {
    var plan = this.state.plan
    var objectId = selectedEquipment.objectId || selectedEquipment.object_id
    this.updateSelectedState(selectedEquipment)
    this.displayEquipment(plan.id, objectId).then((equipmentInfo) => {
      if (typeof equipmentInfo !== 'undefined') {
        map.setCenter({ lat: this.selectedEquipmentGeog[1], lng: this.selectedEquipmentGeog[0] })
        const ZOOM_FOR_EQUIPMENT_SEARCH = 14
        isZoom && this.state.requestSetMapZoom.next(ZOOM_FOR_EQUIPMENT_SEARCH)
      }
      this.checkForBounds(objectId)
    })
  }

  // on view settings changed
  checkForBounds (objectId) {
    // if (!this.state.showSiteBoundary || !this.equipmentData.hasOwnProperty('objectId')){
    if (!this.equipmentData.hasOwnProperty('objectId')) {
      this.boundsData = null
      return
    }
    var planId = this.state.plan.id
    var equipmentId = this.equipmentData.objectId
    var filter = `rootPlanId eq ${planId} and networkNodeObjectId eq guid'${equipmentId}'`
    this.$http.get(`/service/odata/NetworkBoundaryEntity?$filter=${filter}`)
      .then((result) => {
        if (result.data.length < 1) {
          this.boundsObjectId = null
          this.boundsData = null
        } else {
          this.boundsObjectId = result.data[0].objectId
          this.boundsData = result.data[0]
        }
      })
  }

  onRequestCalculateCoverage () {
    if (this.equipmentData && this.boundsData) {
      this.calculateCoverage(this.boundsData, this.equipmentData.geometry)
    }
  }

  // ToDo: very similar function to the one in plan-editor.js combine those
  calculateCoverage (boundsData, equipmentPoint, directed) {
    if (typeof directed === 'undefined') directed = false
    // Get the POST body for optimization based on the current application state
    var optimizationBody = this.state.getOptimizationBody()
    console.log(optimizationBody)
    // Replace analysis_type and add a point and radius
    optimizationBody.boundaryCalculationType = 'FIXED_POLYGON'
    optimizationBody.analysis_type = 'COVERAGE'
    optimizationBody.point = equipmentPoint
    optimizationBody.polygon = boundsData.geom
    optimizationBody.directed = directed // directed analysis if thats what the user wants
    this.isWorkingOnCoverage = true

    this.$http.post('/service/v1/network-analysis/boundary', optimizationBody)
      .then(result => {
        // // The user may have destroyed the component before we get here. In that case, just return
        if (this.isComponentDestroyed) {
          return Promise.reject(new Error('Plan editor was closed while a boundary was being calculated'))
        }
        this.coverageOutput = result.data
        this.showCoverageOutput = true
        this.isWorkingOnCoverage = false
        this.$timeout()
      })
      .catch((err) => {
        console.error(err)
        this.isWorkingOnCoverage = false
      })
  }

  $onDestroy () {
    // Cleanup subscriptions
    this.isComponentDestroyed = true
    this.mapFeatureSelectedSubscriber.unsubscribe()
    this.clearViewModeSubscription.unsubscribe()
    this.unsubscribeRedux()
  }

  mapStateToThis (reduxState) {
    return {
      dataItems: reduxState.plan.dataItems
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
    }
  }
}

EquipmentDetailController.$inject = ['$http', '$timeout', '$ngRedux', 'state', 'tileDataService']

export default EquipmentDetailController
