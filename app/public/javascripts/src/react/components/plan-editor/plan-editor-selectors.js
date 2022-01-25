import { createSelector } from 'reselect'
import { constants } from './shared'
const { ALERT_TYPES } = constants

const getAllBoundaryLayers = state => state.mapLayers.boundary
const getBoundaryLayersList = createSelector([getAllBoundaryLayers], (boundaries) => boundaries.toJS())

const getSelectedSubnetId = state => state.planEditor.selectedSubnetId
const getSubnets = state => state.planEditor.subnets
const getSubnetFeatures = state => state.planEditor.subnetFeatures
const getSelectedSubnet = state => state.planEditor.subnets[state.planEditor.selectedSubnetId]
const getSelectedEditFeatureIds = state => state.planEditor.selectedEditFeatureIds

const getIsCalculatingSubnets = state => state.planEditor.isCalculatingSubnets
const getIsCalculatingBoundary = state => state.planEditor.isCalculatingBoundary
const getBoundaryDebounceBySubnetId = state => state.planEditor.boundaryDebounceBySubnetId
const getCursorLocationIds = state => state.planEditor.cursorLocationIds

const getIsRecalcSettled = createSelector(
  [getIsCalculatingSubnets, getIsCalculatingBoundary, getBoundaryDebounceBySubnetId],
  (isCalculatingSubnets, isCalculatingBoundary, boundaryDebounceBySubnetId) => {
    return (!isCalculatingSubnets && !isCalculatingBoundary && (0 === Object.keys(boundaryDebounceBySubnetId).length))
  }
)

const getFeaturesRenderInfo = createSelector(
  [getSelectedSubnetId, getSubnetFeatures, getSubnets, getSelectedSubnet, getSelectedEditFeatureIds],
  (selectedSubnetId, subnetFeatures, subnets, selectedSubnet, selectedEditFeatureIds) => {
    if (!selectedSubnet) {
      const subnetId = subnetFeatures[selectedSubnetId] && subnetFeatures[selectedSubnetId].subnetId
      selectedSubnet = subnetId && subnets[subnetId] ? subnets[subnetId] : { children: [], subnetNode: null }
    }

    // highlighted ids within the subnet
    const highlightedFeatureIds = [
      ...new Set([
        selectedSubnet.subnetNode,
        ...selectedSubnet.children,
        ...selectedEditFeatureIds,
      ])
    ].filter(Boolean)
    // everything else outside the context of anything highlighted
    const idleFeatureIds = Object.keys(subnetFeatures)
      .filter(id => !highlightedFeatureIds.includes(id))

    return [
      ...highlightedFeatureIds.map(id => ({ id, idle: false })),
      ...idleFeatureIds.map(id => ({ id, idle: true })),
    ]
  }
)

const getNetworkConfig = state => {
  const { network_architecture_manager } = state.plan.resourceItems
  if (!network_architecture_manager) { return }
  const { id } = network_architecture_manager.selectedManager
  const manager = state.resourceManager.managers && state.resourceManager.managers[id]
  if (!manager) { return }
  const networkConfig = manager.definition
    .networkConfigurations.ODN_1
  return networkConfig
}

// temporary
const locationWarnImg = new Image(18, 22)
locationWarnImg.src = '/svg/alert-panel-location.png'

const getRootSubnet = createSelector(
  [getSelectedSubnetId, getSubnetFeatures, getSubnets],
  (selectedFeatureId, subnetFeatures, subnets) => {
    let rootSubnet = subnetFeatures[selectedFeatureId] || Object.values(subnetFeatures)[0]
    if (rootSubnet) {
      while(subnetFeatures[rootSubnet.subnetId]) {
        rootSubnet = subnetFeatures[rootSubnet.subnetId]
      }
      rootSubnet = subnets[rootSubnet.feature.objectId]
    }
    return rootSubnet
  }
)

const getSelectedSubnetLocations = createSelector(
  [getSelectedSubnetId, getSelectedSubnet, getSubnetFeatures, getSubnets],
  (selectedSubnetId, selectedSubnet, subnetFeatures, subnets) => {
    let selectedSubnetLocations = {}
    if (selectedSubnet) {
      selectedSubnetLocations = selectedSubnet.subnetLocationsById
    } else if (subnetFeatures[selectedSubnetId]
      && subnetFeatures[selectedSubnetId].subnetId
      && subnetFeatures[selectedSubnetId].feature.dropLinks
    ) {
      let parentSubnetId = subnetFeatures[selectedSubnetId].subnetId
      subnetFeatures[selectedSubnetId].feature.dropLinks.forEach(dropLink => {
        dropLink.locationLinks.forEach(locationLink => {
          let locationId = locationLink.locationId
          selectedSubnetLocations[locationId] = subnets[parentSubnetId].subnetLocationsById[locationId]
        })
      })
    }
    
    return selectedSubnetLocations
  }
)

const getCursorLocations = createSelector(
  [getSelectedSubnetId, getSelectedSubnet, getSubnetFeatures, getSubnets, getCursorLocationIds],
  (selectedSubnetId, selectedSubnet, subnetFeatures, subnets, cursorLocationIds) => {
    let selectedSubnetLocations = {}
    if (selectedSubnet) {
      selectedSubnetLocations = selectedSubnet.subnetLocationsById
    } else if (subnetFeatures[selectedSubnetId]
      && subnetFeatures[selectedSubnetId].subnetId
      && subnetFeatures[selectedSubnetId].feature.dropLinks
    ) {
      let parentSubnetId = subnetFeatures[selectedSubnetId].subnetId
      if (subnets[parentSubnetId]) {
        selectedSubnetLocations = subnets[parentSubnetId].subnetLocationsById
      }
    }

    let cursorLocations = Object.keys(selectedSubnetLocations)
      .filter(key => cursorLocationIds.includes(key))
      .reduce((obj, key) => {
        return { ...obj, [key]: selectedSubnetLocations[key] }
      }, {})

    return cursorLocations
  }
)

const getAlertsForSubnetTree = createSelector(
  [getRootSubnet, getSubnets, getSubnetFeatures, getNetworkConfig],
  (rootSubnet, subnets, subnetFeatures, networkConfig) => {
    let alerts = {}
    if (rootSubnet) {
      let subnetTree = []

      // get all children hub subnets
      const childrenHubSubnets = rootSubnet.children
        .filter(id => subnets[id])
        .map(id => subnets[id])

      subnetTree = [rootSubnet, ...childrenHubSubnets]
      for (const subnet of subnetTree) {
        alerts = { ...alerts, ...getAlertsFromSubnet(subnet, subnetFeatures, networkConfig) }
      }
    }
    return alerts
  }
)

const getAlertsFromSubnet = (subnet, subnetFeatures, networkConfig) => {
  let alerts = {}
  // maybe we can spruce this up a bit some filter functions?
  if (subnet) {
    const subnetLocationsIds = Object.keys(subnet.subnetLocationsById)

    if (subnetLocationsIds.length > 0 && typeof networkConfig !== 'undefined') {
      const maxTerminalHomes = networkConfig.terminalConfiguration.outputConfig.max
      const maxDropCableLength = networkConfig.terminalConfiguration.maxDistanceMeters
      // TODO: is this even a thing?
      // const maxTerminalDistance = networkConfig.hubConfiguration.maxDistanceMeters
      const maxHubHomes = networkConfig.hubConfiguration.outputConfig.max
      const maxHubDistance = networkConfig.hubConfiguration.maxDistanceMeters

      let totalHomes = 0

      const abandonedLocations = {}
      subnetLocationsIds.forEach(locationId => abandonedLocations[locationId] = true)

      const subnetId = subnet.subnetNode
      subnet.children.forEach(featureId => {

        // checks for max distance between hub and Central Office
        // right now equipmentCoDistance is on both hubs and COs
        if (subnet.fiber.equipmentCoDistances && subnetFeatures[featureId]) {
          const distance = subnet.fiber.equipmentCoDistances[featureId]
          const { networkNodeType } = subnetFeatures[featureId].feature

          // transforming feature latlong into location latlong
          let featurePoint = {}
          featurePoint.longitude = subnetFeatures[featureId].feature.geometry.coordinates[0]
          featurePoint.latitude = subnetFeatures[featureId].feature.geometry.coordinates[1]

          if (distance > maxHubDistance && networkNodeType === 'fiber_distribution_hub') {
            if (!alerts[featureId]) {
              alerts[featureId] = {
                locationId: featureId,
                subnetId,
                alerts: [],
                point: featurePoint,
              }
            }
            alerts[featureId].alerts.push(ALERT_TYPES['MAX_HUB_DISTANCE_EXCEEDED'].key)
            // TODO: is this even a thing?
            // } else if (distance > maxTerminalDistance && networkNodeType === 'fiber_distribution_terminal'){
            //   if (!alerts[featureId]) {
            //     alerts[featureId] = {
            //       locationId: featureId,
            //       subnetId,
            //       alerts: [],
            //       point: featurePoint,
            //     }
            //   }
            //   alerts[featureId].alerts.push(ALERT_TYPES['MAX_TERMINAL_DISTANCE_EXCEEDED'].key)
          }
        }

        const featureEntry = subnetFeatures[featureId]
        if (featureEntry && featureEntry.feature.dropLinks) {
          // add droplinks to totalHomes to check if it exceeds maxHubHomes
          totalHomes += featureEntry.feature.dropLinks.length

          //checks for max homes in terminal
          if (featureEntry.feature.dropLinks.length > maxTerminalHomes) {
            if (!alerts[featureId]) {
              // getting location of terminal for alert display
              // then converting to lat long format used on locations
              let terminalPoint = {}
              terminalPoint.longitude = featureEntry.feature.geometry.coordinates[0]
              terminalPoint.latitude = featureEntry.feature.geometry.coordinates[1]
              alerts[featureId] = {
                locationId: featureId,
                subnetId,
                alerts: [],
                point: terminalPoint,
              }
            }
            alerts[featureId].alerts.push(ALERT_TYPES['MAX_TERMINAL_HOMES_EXCEEDED'].key)
          }
          featureEntry.feature.dropLinks.forEach(dropLink => {
            dropLink.locationLinks.forEach(locationLink => {
              const locationId = locationLink.locationId
              // remove abandoned entry
              delete abandonedLocations[locationId]
              // dropcable alert
              // TODO: Differentiate between too long and NaN?
              if (!subnet.subnetLocationsById[locationId]){
                console.warn(`location ${locationId} of feature ${featureEntry.feature.objectId} is not in the location list of subnet ${subnetId}`)
              } else if (dropLink.dropCableLength > maxDropCableLength || isNaN(dropLink.dropCableLength)) {
                if (!alerts[locationId]) {
                  alerts[locationId] = {
                    locationId,
                    subnetId,
                    alerts: [],
                    point: subnet.subnetLocationsById[locationId].point,
                  }
                }
                alerts[locationId].alerts.push(ALERT_TYPES['MAX_DROP_LENGTH_EXCEEDED'].key)
              }
            })
          })
        }
      })

      // after the forEach check if totalhomes exceeds maxHubHomes
      if (totalHomes > maxHubHomes) {
        if (!alerts[subnetId]) {
          // transforming feature latlong into location latlong
          let hubPoint = {}
          hubPoint.longitude = subnetFeatures[subnetId].feature.geometry.coordinates[0]
          hubPoint.latitude = subnetFeatures[subnetId].feature.geometry.coordinates[1]
          alerts[subnetId] = {
            locationId: subnetId,
            subnetId,
            alerts: [],
            point: hubPoint,
          }
        }
        alerts[subnetId].alerts.push(ALERT_TYPES['MAX_HUB_HOMES_EXCEEDED'].key)
      }

      Object.keys(abandonedLocations).forEach(locationId => {
        if (!alerts[locationId]) {
          alerts[locationId] = {
            locationId,
            subnetId,
            alerts: [],
            point: subnet.subnetLocationsById[locationId].point,
          }
        }
        alerts[locationId].alerts.push(ALERT_TYPES['ABANDONED_LOCATION'].key)
      })
    }
  }
  return alerts
}

const getLocationCounts = createSelector(
  [getSubnets, getSubnetFeatures, getSelectedEditFeatureIds],
  (subnets, subnetFeatures, selectedEditFeatureIds) => {
    let locationCountsById = {}
    for (const id of selectedEditFeatureIds) {
      const subnet = subnets[id]
      const feature = subnetFeatures[id]
      const type = feature && feature.feature.networkNodeType

      if (subnet && type === 'fiber_distribution_hub') {
        const locations = Object.values(subnet.subnetLocationsById)
        locationCountsById[id] = locations
          .filter(location => !!location.parentEquipmentId)
          .length
      } else if (subnet && type === 'dslam') {
        locationCountsById[id] = Object.keys(subnet.subnetLocationsById).length
      } else if (type === 'fiber_distribution_terminal' && feature.feature.dropLinks) {
        locationCountsById[id] = feature.feature.dropLinks.length
      } else {
        const locationDistanceMap = subnet && subnet.fiber && subnet.fiber.locationDistanceMap
        locationCountsById[id] = locationDistanceMap
          ? Object.keys(locationDistanceMap).length
          : 0
      }
    }
    return locationCountsById
  }
)

const PlanEditorSelectors = Object.freeze({
  getSelectedSubnet,
  getBoundaryLayersList,
  getFeaturesRenderInfo,
  getIsRecalcSettled,
  getAlertsForSubnetTree,
  locationWarnImg,
  getRootSubnet,
  getSelectedSubnetLocations,
  getCursorLocations,
  getLocationCounts,
  getSubnetFeatures
})

export default PlanEditorSelectors
