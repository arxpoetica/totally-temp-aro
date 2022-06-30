import Actions from '../../common/actions'
import AroHttp from '../../common/aro-http'
import { flattenDeep } from '../../common/view-utils'
import { batch } from 'react-redux'
import { displayModes, entityTypeCons, viewModePanels } from '../sidebar/constants'
import { createSelector } from 'reselect'

// In ruler and for some active view-mode panels click should not be enabled for boundary view.
function allowViewModeClickAction() {
  return (dispatch, getState) => {
    const state = getState()
    const { rSelectedDisplayMode, rActiveViewModePanel, isRulerEnabled } = state.toolbar
    return (
      (rSelectedDisplayMode === displayModes.VIEW || rSelectedDisplayMode === displayModes.EDIT_PLAN)
      && rActiveViewModePanel !== viewModePanels.EDIT_LOCATIONS
      && rActiveViewModePanel !== viewModePanels.EDIT_SERVICE_LAYER
      && rActiveViewModePanel !== viewModePanels.COVERAGE_BOUNDARY
      && !isRulerEnabled
    )
  }
}

function getSelectedEquipmentIds (flattenDeep, networkNodeTypes, configuration) {
  const selectedEquipmentIds = []
  const categoryItems = configuration.networkEquipment.equipments
  Object.keys(categoryItems).forEach((categoryItemKey) => {
    const networkEquipment = categoryItems[categoryItemKey]
    networkEquipment.checked &&
      selectedEquipmentIds.push(networkNodeTypes
        .filter(equipmentEntity => equipmentEntity.name === networkEquipment.networkNodeType)
        .map(equ => equ.id)
      )
  })
  return flattenDeep(selectedEquipmentIds)
}

function loadEntityList (entityType, filterObj, select, searchColumn, configuration) {
  return (dispatch, getState) => {
    const state = getState()
    const planId = state.plan.activePlan && state.plan.activePlan.id
    const dataItems = state.plan.dataItems
    const nameToServiceLayers = state.toolbar.nameToServiceLayers
    const networkNodeTypes = state.roicReports.networkNodeTypes
    const entityTypeList = state.stateViewMode.entityTypeList

    if (filterObj === '') return Promise.resolve()
    let entityListUrl = `/service/odata/${entityType}?$select=${select}`
    if (entityType !== entityTypeCons.ANALYSIS_LAYER) {
      entityListUrl = entityListUrl + '&$top=20'
    }

    let filter = ''
    if (entityType === entityTypeCons.LOCATION_OBJECT_ENTITY) {
      // for UUID odata doesn't support substring
      const pattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
      if (pattern.test(filterObj)) {
        filter = filterObj ? `${searchColumn} eq guid'${filterObj}'` : filter
      } else {
        return Promise.resolve() // 157501341: Location search should not reach out to endpoint without supplying a valid object id
      }
    } else {
      if (filterObj) {
        const columns = searchColumn.split(',')
        if (columns.length === 1) {
          if (searchColumn === 'id') {
            filter = `${searchColumn} eq ${filterObj}`
          } else if (searchColumn === 'clli') {
            filter = `substringof(${searchColumn},'${filterObj}')`
          } else {
            filter = `${searchColumn} eq '${filterObj}'`
          }
        } else {
          const colFilter = columns.map(col => `substringof(${col},'${filterObj}')`).join(' or ')
          filter = `(${colFilter})`
        }
      }
    }

    let libraryItems = []
    if (entityType === entityTypeCons.LOCATION_OBJECT_ENTITY) {
      const selectedLocationLibraries = dataItems && dataItems.location && dataItems.location.selectedLibraryItems
      if (selectedLocationLibraries) libraryItems = selectedLocationLibraries.map(
        selectedLibraryItem => selectedLibraryItem.identifier
      )
      if (libraryItems.length > 0) {
        const libfilter = libraryItems.map(id => `libraryId eq ${id}`).join(' or ')
        filter = filter ? filter.concat(` and (${libfilter})`) : `${libfilter}`
      }
    }

    if (entityType === entityTypeCons.NETWORK_EQUIPMENT_ENTITY) {
      // Filtering NetworkEquipmentEntity by planId so as to fetch latest equipment info
      filter = filter ? filter.concat(` and (planId eq ${planId})`) : filter
      const selectedEquipments = getSelectedEquipmentIds(
        flattenDeep, networkNodeTypes, configuration
      ).map(id => `networkNodeType eq ${id}`).join(' or ')
      // Search for equipments that are selected in NetworkEquipment modal
      if (selectedEquipments === '') return Promise.resolve()
      filter = selectedEquipments ? filter.concat(` and (${selectedEquipments})`) : filter
      filter = filter.concat(` and (isDeleted eq false)`) // filter deleted equipment
    }

    if (entityType === entityTypeCons.SERVICE_AREA_VIEW) {
      // filter = filter ? filter.concat(' and layer/id eq 1') : filter
      const selectedServiceLayerLibraries = dataItems && dataItems.service_layer 
        && dataItems.service_layer.selectedLibraryItems
      // ToDo: Do not select service layers by name
      // we need a change in service GET /v1/library-entry needs to send id, identifier is not the same thing
      if (selectedServiceLayerLibraries) libraryItems = selectedServiceLayerLibraries.map(
        selectedLibraryItem => selectedLibraryItem.name
      )
      if (libraryItems.length > 0) {
        // Filter using selected serviceLayer id
        const getServiceLayersData = () => {
          return AroHttp.get('/service/odata/ServiceLayer?$select=id,name,description')
            .then((response) => {
              let nameToServiceLayersObj = {}
              if (response.status >= 200 && response.status <= 299) {
                let serviceLayers = response.data
                serviceLayers.forEach((layer) => {
                  nameToServiceLayersObj[layer.name] = layer
                })
              }
              return Promise.resolve(nameToServiceLayersObj)
            })
        }

        if (libraryItems.every(libraryName => nameToServiceLayers[libraryName])) {
          const layerfilter = libraryItems.map(libraryName => {
            return `layer/id eq ${nameToServiceLayers[libraryName].id}`}).join(' or ')
          filter = filter ? filter.concat(` and (${layerfilter})`) : `${layerfilter}`
        } else {
          getServiceLayersData()
          .then(serviceLayersObject => libraryItems.map(libraryName => {
            return `layer/id eq ${serviceLayersObject[libraryName].id}`
          }).join(' or '))
          .then(layerText => {
            filter = filter ? filter.concat(` and (${layerText})`) : `${layerText}`
          })
        }
      }
    }

    entityListUrl = filter ? entityListUrl.concat(`&$filter=${encodeURIComponent(filter)}`) : entityListUrl

    return AroHttp.get(entityListUrl)
      .then((results) => {
        entityTypeList[entityType] = results.data
        batch(() => {
          dispatch({
            type: Actions.STATE_VIEW_MODE_GET_ENTITY_TYPE_LIST,
            payload: entityTypeList
          })
          if (entityType === entityTypeCons.SERVICE_AREA_VIEW || entityType === entityTypeCons.CENSUS_BLOCKS_ENTITY ||
          entityType === entityTypeCons.ANALYSIS_AREA) {
            dispatch({
              type: Actions.STATE_VIEW_MODE_GET_ENTITY_TYPE_BOUNDRY_LIST,
              payload: entityTypeList[entityType]
            })
          }
        })
        return results.data
      })
  }
}

function setLayerCategories (layerCategories) {
  return {
    type: Actions.STATE_VIEW_MODE_SET_LAYER_CATEGORIES,
    payload: layerCategories
  }
}

function clearViewMode (isClearViewMode) {
  return {
    type: Actions.STATE_VIEW_MODE_CLEAR_VIEW_MODE,
    payload: isClearViewMode
  }
}

// We need a selector, else the .toJS() call will create an infinite digest loop
const getAllLocationLayers = state => state.mapLayers.location
const getLocationLayersList = createSelector([getAllLocationLayers], (locationLayers) => locationLayers.toJS())

// ToDo: This does not belong here. this is already present in tool-bar-actions.js, but in that function all the state
// are passed as arguments, so that it feel hard to handle and repeats the code, so it is modified using getState()
// here, once all the changes are done in dependent files this will be removed here.
function getOptimizationBody() {
  return (dispatch, getState) => {
    const state = getState()
    const { optimizationInputs } = state.optimization.networkOptimization
    const { id: activeSelectionModeId } = state.selection.activeSelectionMode
    const locationLayers = getLocationLayersList(state)
    const { activePlan: plan } = state.plan

    const inputs = JSON.parse(JSON.stringify(optimizationInputs))
    inputs.planId = plan.id
    inputs.locationConstraints = {}
    inputs.locationConstraints.analysisSelectionMode = activeSelectionModeId
    inputs.locationConstraints.locationTypes = []
    locationLayers.forEach(locationsLayer => {
      if (locationsLayer.checked) inputs.locationConstraints.locationTypes.push(locationsLayer.plannerKey)
    })
    return inputs
  }
}

export default {
  getSelectedEquipmentIds,
  loadEntityList,
  allowViewModeClickAction,
  setLayerCategories,
  clearViewMode,
  getOptimizationBody,
}
