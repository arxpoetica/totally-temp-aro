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

const ExceptionTypes = {
  'MAX_DROPLENGTH_EXCEEDED': {
    key: 'MAX_DROPLENGTH_EXCEEDED', 
    displayName: 'Drop Cable Length Exceeded',
    iconUrl: '/svg/exception-panel-location.svg',
  },
  'ABANDONED_LOCATION': {
    key: 'ABANDONED_LOCATION', 
    displayName: 'Abandoned Location',
    iconUrl: '/svg/exception-panel-location.svg',
  },
}
// temporary
const locationWarnImg = new Image(18, 22)
locationWarnImg.src = '/svg/exception-panel-location.png'
//const getSubnets = state => state.planEditor.subnets
const getSubnetFeatures = state => state.planEditor.subnetFeatures
const getExceptionsForSelectedSubnet = createSelector(
  [getSelectedSubnet, getSubnetFeatures],
  (selectedSubnet, subnetFeatures) => {
    const maxDropcableLength = 500 //400 for test // FIX ME!!! ToDo: get the real value from ??? 
    let exceptions = {}
    // maybe we can spruce this up a bit some filter functions?
    if (selectedSubnet && selectedSubnet.subnetLocations && selectedSubnet.subnetLocations.length > 0) {
      let abandonedLocations = {}
      Object.keys(selectedSubnet.subnetLocationsById).forEach(locationId => {
        abandonedLocations[locationId] = true
      }) 
      selectedSubnet.children.forEach(featureId => {
        const featureEntry = subnetFeatures[featureId]
        if (featureEntry) {
          featureEntry.feature.dropLinks.forEach(dropLink => {
            dropLink.locationLinks.forEach(locationLink => {
              const locationId = locationLink.locationId
              // remove abandoned entry
              delete abandonedLocations[locationId]
              // dropcable exception?
              if (dropLink.dropCableLength > maxDropcableLength) {
                if (!exceptions[locationId]) {
                  exceptions[locationId] = {
                    'locationId': locationId,
                    'subnetId': selectedSubnet.subnetNode,
			              'exceptions': [],
                  }
                }
                exceptions[locationId].exceptions.push(ExceptionTypes['MAX_DROPLENGTH_EXCEEDED'].key)
              }
            })
          })
        }
      })
      Object.keys(abandonedLocations).forEach(locationId => {
        if (!exceptions[locationId]) {
          exceptions[locationId] = {
            'locationId': locationId,
            'subnetId': selectedSubnet.subnetNode,
            'exceptions': [],
          }
        }
        exceptions[locationId].exceptions.push(ExceptionTypes['ABANDONED_LOCATION'].key)
      }) 
    } 
    console.log(exceptions)
    return exceptions
  }
)

const PlanEditorSelectors = Object.freeze({
  getBoundaryLayersList,
  getSelectedIds,
  getIsRecalcSettled,
  ExceptionTypes,
  getExceptionsForSelectedSubnet,
  locationWarnImg,
})

export default PlanEditorSelectors
