import { createSelector } from 'reselect'

const getAllBoundaryLayers = state => state.mapLayers.boundary
const getBoundaryLayersList = createSelector([getAllBoundaryLayers], (boundaries) => boundaries.toJS())

const getSelectedSubnet = state => state.planEditor.subnets[state.planEditor.selectedSubnetId]
const getSelectedFeatureIds = state => state.planEditor.selectedFeatureIds

// ToDo: this should be reworked a bit, should happen when we centralize plan edit features and subnet features
const getSelectedIdsAndSubnetFeatures = createSelector([getSelectedSubnet, getSelectedFeatureIds], (selectedSubnet, selectedFeatureIds) => {
  let subnetFeatures = {}
  let allFeatureIds = []
  if (selectedSubnet) { 
    //allFeatureIds = this.props.selectedSubnet.children
    subnetFeatures = selectedSubnet.children.reduce((dict, feature) => {
      allFeatureIds.push(feature.id)
      dict[feature.id] = feature
      return dict
    }, {})
  }
  // concatinate the two arrays using the spread op, 
  //  make sure all elements are unique by making it a Set,
  //  turn it back into an array using the spread op
  allFeatureIds = [...new Set([...allFeatureIds, ...selectedFeatureIds])]

  return {allFeatureIds, subnetFeatures}
})

const PlanEditorSelectors = Object.freeze({
  getSelectedIdsAndSubnetFeatures,
})

export default PlanEditorSelectors
