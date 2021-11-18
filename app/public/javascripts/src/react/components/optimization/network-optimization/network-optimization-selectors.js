import { createSelector } from 'reselect'
import { getFormValues } from 'redux-form'
import Constants from '../../../common/constants'
import SelectionModes from '../../selection/selection-modes'

const getModifiedNetworkOptimizationInputs = getFormValues(Constants.NETWORK_OPTIMIZATION_INPUT_FORM)

const getPlanId = (state) => state.plan.activePlan.id
const getNetworkAnalysisType = (state) => state.optimization.networkOptimization.optimizationInputs.analysis_type
const getOptimizationInputs = (state) => state.optimization.networkOptimization.optimizationInputs
const getActiveSelectionModeId = (state) => state.selection.activeSelectionMode.id
const getActivefilters = (state) => state.optimization.networkOptimization.activeFilters
const getSelectionModes = state => state.selection.selectionModes
const getClientName = (state) => state.configuration.system.ARO_CLIENT
const getEnumOptions = (state) => state.optimization.networkOptimization.enumOptions

const getFormattedEnumOptions = createSelector([getEnumOptions], (enumOptions) => {
  const formattedEnumOptions = {}
  Object.entries(enumOptions).forEach(([name, options]) => {
    const formattedEnum = options.map((option) => {
      return { value: option.name, label: option.description }
    })

    formattedEnumOptions[name] = formattedEnum.sort((a, b) => {
      const nameA = a.value.toLowerCase()
      const nameB = b.value.toLowerCase()
      if (nameA < nameB) return -1
      if (nameA > nameB) return 1
      return 0
    })
  })

  return formattedEnumOptions
})

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
    let value = filter.value1
    let value2 = filter.value2
    // convert dates to milliseconds since epoch for service
    if (filter.propertyType === ('DATE' || 'DATETIME')) {
      value = new Date(filter.value1).getTime()
      if (filter.value2) {
        value2 = new Date(filter.value2).getTime()
      }
    }
    // join array for small enumeration
    if (filter.value1 && typeof filter.value1 !== 'string' && filter.enumType === 'BOUNDED' ) {
      const names = filter.value1.map((option) => option.value)
      value = names.join(',')
    }
  
    return ({
      op: filter.operator,
      propertyName: filter.name,
      value,
      value2,
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
  getFormattedEnumOptions,
})

export default NetworkOptimizationSelectors