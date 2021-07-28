import { createSelector } from 'reselect'

const getAllBoundaryLayers = state => state.mapLayers.boundary
const getBoundaryLayersList = createSelector([getAllBoundaryLayers], (boundaries) => boundaries.toJS())

const getSelectedSubnet = state => state.planEditor.subnets[state.planEditor.selectedSubnetId]
const getSelectedEditFeatureIds = state => state.planEditor.selectedEditFeatureIds
const getSelectedIds = createSelector([getSelectedSubnet, getSelectedEditFeatureIds], (selectedSubnet, selectedEditFeatureIds) => {
  let selectedIds = []
  if (selectedSubnet) { 
    selectedIds = selectedSubnet.children
  }
  // concatinate the two arrays using the spread op, 
  //  make sure all elements are unique by making it a Set,
  //  turn it back into an array using the spread op
  selectedIds = [...new Set([...selectedIds, ...selectedEditFeatureIds])]

  return selectedIds
})

const getIsCalculatingSubnets = state => state.planEditor.isCalculatingSubnets
const getIsCalculatingBoundary = state => state.planEditor.isCalculatingBoundary
const getBoundaryDebounceBySubnetId = state => state.planEditor.boundaryDebounceBySubnetId
const getIsRecalcSettled = createSelector(
  [getIsCalculatingSubnets, getIsCalculatingBoundary, getBoundaryDebounceBySubnetId], 
  (isCalculatingSubnets, isCalculatingBoundary, boundaryDebounceBySubnetId) => {
    return (!isCalculatingSubnets && !isCalculatingBoundary && (0 === Object.keys(boundaryDebounceBySubnetId).length))
  }
)

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
//const getSubnets = state => state.planEditor.subnets
const getSubnetFeatures = state => state.planEditor.subnetFeatures
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

const getAlertsForSelectedSubnet = createSelector(
  [getSelectedSubnet, getSubnetFeatures, getNetworkConfig],
  (selectedSubnet, subnetFeatures, networkConfig) => {
    let alerts = {}
    // maybe we can spruce this up a bit some filter functions?
    if (
      selectedSubnet
      && selectedSubnet.subnetLocations
      && selectedSubnet.subnetLocations.length > 0
      && typeof getNetworkConfig !== 'undefined'
    ) {
      const maxDropCableLength = networkConfig.terminalConfiguration.maxDistanceMeters
      const maxTerminalHomes = networkConfig.terminalConfiguration.outputConfig.max
      const maxHubHomes = networkConfig.hubConfiguration.outputConfig.max
      const maxHubDistance = networkConfig.hubConfiguration.maxDistanceMeters
      
      let totalHomes = 0

      let abandonedLocations = {}
      Object.keys(selectedSubnet.subnetLocationsById).forEach(locationId => {
        abandonedLocations[locationId] = true
      })

      selectedSubnet.children.forEach(featureId => {
        // checks for max distance between hub and Central Office
        // right now equipmentCoDistance is only on central office, otherwise will be null
        if (selectedSubnet.fiber.equipmentCoDistances !== null) {
            const distance = selectedSubnet.fiber.equipmentCoDistances[featureId]
            if (distance > maxHubDistance) {
              if (!alerts[featureId]) {
                alerts[featureId] = {
                  locationId: featureId,
                  subnetId: selectedSubnet.subnetNode,
                  alerts: [],
                }
              }
              alerts[featureId].alerts.push(AlertTypes['MAX_HUB_DISTANCE_EXCEEDED'].key)
            }
        }

        const featureEntry = subnetFeatures[featureId]
        if (featureEntry) {
          // add droplinks to totalHomes to check if it exceeds maxHubHomes
          totalHomes += featureEntry.feature.dropLinks.length

          //checks for max homes in terminal
          if (featureEntry.feature.dropLinks.length > maxTerminalHomes) {
            if (!alerts[featureId]) {
              alerts[featureId] = {
                locationId: featureId,
                subnetId: selectedSubnet.subnetNode,
                alerts: [],
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
                    locationId: locationId,
                    subnetId: selectedSubnet.subnetNode,
                    alerts: [],
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
        if (!alerts[selectedSubnet.subnetNode]) {
          alerts[selectedSubnet.subnetNode] = {
            locationId: selectedSubnet.subnetNode,
            subnetId: selectedSubnet.subnetNode,
            alerts: [],
          }
        }
        alerts[selectedSubnet.subnetNode].alerts.push(AlertTypes['MAX_HUB_HOMES_EXCEEDED'].key)
      }
      
      Object.keys(abandonedLocations).forEach(locationId => {
        if (!alerts[locationId]) {
          alerts[locationId] = {
            locationId: locationId,
            subnetId: selectedSubnet.subnetNode,
            alerts: [],
          }
        }
        alerts[locationId].alerts.push(AlertTypes['ABANDONED_LOCATION'].key)
      }) 
    } 
    console.log(alerts)
    return alerts
  }
)

const PlanEditorSelectors = Object.freeze({
  getBoundaryLayersList,
  getSelectedIds,
  getIsRecalcSettled,
  AlertTypes,
  getAlertsForSelectedSubnet,
  locationWarnImg,
})

export default PlanEditorSelectors
