import { createSelector } from 'reselect'
import { getFormValues } from 'redux-form'
import Constants from '../../../common/constants'
import SelectionModes from '../../selection/selection-modes'

const getModifiedNetworkOptimizationInputs = getFormValues(Constants.NETWORK_OPTIMIZATION_INPUT_FORM)

const getPlanId = (state) => state.plan.activePlan.id
const getNetworkAnalysisType = (state) => state.optimization.networkOptimization.optimizationInputs.analysis_type
const getOptimizationInputs = (state) => state.optimization.networkOptimization.optimizationInputs
const getLocationTypes = (state) => state.optimization.networkOptimization.optimizationInputs.locationTypes
const getActiveSelectionModeId = (state) => state.selection.activeSelectionMode.id
const getActivefilters = (state) => state.optimization.networkOptimization.activeFilters
const getSelectionModes = state => state.selection.selectionModes
const getClientName = (state) => state.configuration.system.ARO_CLIENT

const getAllSelectionModes = createSelector([getSelectionModes], (selectionModes) => {
  // NOTE: filter prior used to remove legacy error lines from angular in
  // `selection-reducer.js` and `selection-modes.js`
  // THIS COMMENT CAN BE DELETED WHEN THOSE LINES ARE DELETED
  return JSON.parse(JSON.stringify(selectionModes))
})
const getValidatedFilters = createSelector([getActivefilters], (activeFilters) => {
  const validatedFilters = activeFilters.filter((filter) =>{
    return filter.value1 && filter.value2 || filter.value1 && filter.operator !== 'RANGE'
  });

  return validatedFilters
})

const getObjectFilter = createSelector([getValidatedFilters, getClientName], (validatedFilters, clientName) => {
  const propertyConstraints = validatedFilters.map((filter) => {
    return ({
      op: filter.operator,
      propertyName: filter.name,
      value: filter.value1,
      value2: filter.value2,
    })
  })
  const objectFilter = {
    clientName: clientName,
    propertyConstraints: propertyConstraints,
  }

  return objectFilter
})

const getAdditionalOptimizationInputs = createSelector(
  [
    getModifiedNetworkOptimizationInputs,
    getNetworkAnalysisType,
    getPlanId,
    getOptimizationInputs,
    getActiveSelectionModeId,
    getObjectFilter,
  ], (
    modifiedOptimizationInputs,
    networkAnalysisTypeId,
    planId,
    optimizationInputs,
    activeSelectionModeId,
    objectFilter,
  ) => {

  // plan.selection.planTargets are sent seperately to the server
  if (modifiedOptimizationInputs) {
    const inputs = JSON.parse(JSON.stringify(modifiedOptimizationInputs))
    // ToDo: this should come from redux NOT parent
    inputs.analysis_type = networkAnalysisTypeId
    inputs.planId = planId

    inputs.locationConstraints = JSON.parse(JSON.stringify(optimizationInputs.locationConstraints))
    inputs.locationConstraints.analysisSelectionMode = activeSelectionModeId

    inputs.locationConstraints.objectFilter = objectFilter
    // inputs.locationConstraints.analysisLayerId
    return inputs
  }
  return undefined
})

const getUpdatedLocationConstraints = createSelector(
  [getAdditionalOptimizationInputs], (optimizationInputs) => {
    return optimizationInputs.locationConstraints
  }
)

const NetworkOptimizationSelectors = Object.freeze({
  getValidatedFilters,
  getObjectFilter,
  getAdditionalOptimizationInputs,
  getAllSelectionModes,
  getUpdatedLocationConstraints,
})

export default NetworkOptimizationSelectors