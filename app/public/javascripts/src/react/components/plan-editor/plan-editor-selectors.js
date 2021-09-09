import { createSelector } from 'reselect'

const getAllBoundaryLayers = state => state.mapLayers.boundary
const getBoundaryLayersList = createSelector([getAllBoundaryLayers], (boundaries) => boundaries.toJS())

const getSelectedSubnetId = state => state.planEditor.selectedSubnetId
const getSubnets = state => state.planEditor.subnets

const getSelectedSubnet = state => state.planEditor.subnets[state.planEditor.selectedSubnetId]
const getSelectedEditFeatureIds = state => state.planEditor.selectedEditFeatureIds
const getSelectedIds = createSelector(
  [getSelectedSubnet, getSelectedEditFeatureIds],
  (selectedSubnet, selectedEditFeatureIds) => {
    // concatinate the two arrays using the spread op,
    //  make sure all elements are unique by making it a Set,
    //  turn it back into an array using the spread op
    return [...new Set([...(selectedSubnet && selectedSubnet.children || []), ...selectedEditFeatureIds])]
  }
)

const getIsCalculatingSubnets = state => state.planEditor.isCalculatingSubnets
const getIsCalculatingBoundary = state => state.planEditor.isCalculatingBoundary
const getBoundaryDebounceBySubnetId = state => state.planEditor.boundaryDebounceBySubnetId
const getIsRecalcSettled = createSelector(
  [getIsCalculatingSubnets, getIsCalculatingBoundary, getBoundaryDebounceBySubnetId],
  (isCalculatingSubnets, isCalculatingBoundary, boundaryDebounceBySubnetId) => {
    return (!isCalculatingSubnets && !isCalculatingBoundary && (0 === Object.keys(boundaryDebounceBySubnetId).length))
  }
)

const getSubnetFeatures = state => state.planEditor.subnetFeatures
const getSubnetFeatureIds = createSelector([getSubnetFeatures], features => Object.keys(features))
const getIdleFeaturesIds = createSelector(
  [getSelectedIds, getSubnetFeatureIds],
  (selectedIds, subnetFeaturesIds) => {
    return subnetFeaturesIds.filter(id => !selectedIds.includes(id))
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

const AlertTypes = {
  MAX_DROP_LENGTH_EXCEEDED: {
    key: 'MAX_DROP_LENGTH_EXCEEDED',
    displayName: 'Drop Cable Length Exceeded',
    iconUrl: '/svg/alert-panel-location.svg',
  },
  ABANDONED_LOCATION: {
    key: 'ABANDONED_LOCATION',
    displayName: 'Abandoned Location',
    iconUrl: '/svg/alert-panel-location.svg',
  },
  MAX_TERMINAL_HOMES_EXCEEDED: {
    key: 'MAX_TERMINAL_HOMES_EXCEEDED',
    displayName: 'Maximum Terminal Homes Exceeded',
    iconUrl: '/svg/alert-panel-location.svg',
  },
  MAX_HUB_HOMES_EXCEEDED: {
    key: 'MAX_HUB_HOMES_EXCEEDED',
    displayName: 'Maximum Hub Homes Exceeded',
    iconUrl: '/svg/alert-panel-location.svg',
  },
  MAX_HUB_DISTANCE_EXCEEDED: {
    key: 'MAX_HUB_DISTANCE_EXCEEDED',
    displayName: 'Maximum Hub Distance Exceeded',
    iconUrl: '/svg/alert-panel-location.svg',
  },
}
// temporary
const locationWarnImg = new Image(18, 22)
locationWarnImg.src = '/svg/alert-panel-location.png'

const getRootSubnet = createSelector(
  [getSelectedSubnetId, getSubnetFeatures, getSubnets],
  (selectedFeatureId, subnetFeatures, subnets) => {
    let rootSubnet = subnetFeatures[selectedFeatureId]
    if (rootSubnet) {
      while(rootSubnet.subnetId !== null) {
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

    if (subnetLocationsIds.length > 0 && typeof getNetworkConfig !== 'undefined') {
      const maxDropCableLength = networkConfig.terminalConfiguration.maxDistanceMeters
      const maxTerminalHomes = networkConfig.terminalConfiguration.outputConfig.max
      const maxHubHomes = networkConfig.hubConfiguration.outputConfig.max
      const maxHubDistance = networkConfig.hubConfiguration.maxDistanceMeters

      let totalHomes = 0

      const abandonedLocations = {}
      subnetLocationsIds.forEach(locationId => abandonedLocations[locationId] = true)

      const subnetId = subnet.subnetNode
      subnet.children.forEach(featureId => {


        // checks for max distance between hub and Central Office
        // right now equipmentCoDistance is only on central office, otherwise will be null
        if (subnet.fiber.equipmentCoDistances !== null) {
            const distance = subnet.fiber.equipmentCoDistances[featureId]
            if (distance > maxHubDistance) {
              if (!alerts[featureId]) {
                alerts[featureId] = {
                  locationId: featureId,
                  subnetId,
                  alerts: [],
                  point: subnet.subnetLocationsById[featureId].point,
                }
              }
              alerts[featureId].alerts.push(AlertTypes['MAX_HUB_DISTANCE_EXCEEDED'].key)
            }
        }

        const featureEntry = subnetFeatures[featureId]
        if (featureEntry && featureEntry.feature.dropLinks) {
          // add droplinks to totalHomes to check if it exceeds maxHubHomes
          totalHomes += featureEntry.feature.dropLinks.length

          //checks for max homes in terminal
          if (featureEntry.feature.dropLinks.length > maxTerminalHomes) {
            if (!alerts[featureId]) {
              alerts[featureId] = {
                locationId: featureId,
                subnetId,
                alerts: [],
                point: subnet.subnetLocationsById[featureId].point,
              }
            }
            alerts[featureId].alerts.push(AlertTypes['MAX_TERMINAL_HOMES_EXCEEDED'].key)
          }
          featureEntry.feature.dropLinks.forEach(dropLink => {
            dropLink.locationLinks.forEach(locationLink => {
              const locationId = locationLink.locationId
              // remove abandoned entry
              delete abandonedLocations[locationId]
              // dropcable alert?
              if (dropLink.dropCableLength > maxDropCableLength) {
                if (!alerts[locationId]) {
                  alerts[locationId] = {
                    locationId,
                    subnetId,
                    alerts: [],
                    point: subnet.subnetLocationsById[locationId].point,
                  }
                }
                alerts[locationId].alerts.push(AlertTypes['MAX_DROP_LENGTH_EXCEEDED'].key)
              }
            })
          })
        }
      })

      // after the forEach check if totalhomes exceeds maxHubHomes
      if (totalHomes > maxHubHomes) {
        if (!alerts[subnetId]) {
          alerts[subnetId] = {
            locationId: subnetId,
            subnetId,
            alerts: [],
            point: subnet.subnetLocationsById[subnetId].point,
          }
        }
        alerts[subnetId].alerts.push(AlertTypes['MAX_HUB_HOMES_EXCEEDED'].key)
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
        alerts[locationId].alerts.push(AlertTypes['ABANDONED_LOCATION'].key)
      })
    }
  }
  return alerts
}

const PlanEditorSelectors = Object.freeze({
  getBoundaryLayersList,
  getSelectedIds,
  getSubnetFeatureIds,
  getIdleFeaturesIds,
  getIsRecalcSettled,
  AlertTypes,
  getAlertsForSubnetTree,
  locationWarnImg,
  getSelectedSubnetLocations,
})

export default PlanEditorSelectors
