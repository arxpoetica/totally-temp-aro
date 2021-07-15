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

const PlanEditorSelectors = Object.freeze({
  getBoundaryLayersList,
  getSelectedIds,
  getIsRecalcSettled,
})

export default PlanEditorSelectors
