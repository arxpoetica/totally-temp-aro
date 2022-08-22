import Actions from '../../common/actions'
import { RECALC_STATES } from './competitor/competitor-shared'

const initialOffset = 0
const initialcurrentPage = 0
const perPage = 10

const ResourceKey = {
  rate_reach_manager: true,
  competition_manager: true
}

const defaultState = {
  resourceTypes: null,
  resourceManagers: null,
  filteredresourceManagers: null,
  pageableData:{
    offset: initialOffset,
    perPage: perPage,
    currentPage: initialcurrentPage,
    pageCount: 0,
    paginateData: []
  },
  isMakeNewFilter: false,
  isResourceEditor: true,
  priceBookStrategy: null,
  arpuModels: null,
  ArpuStrategy: '',
  ArpuRevenue: '',
  loadStrength: {},
  isRrmManager: false,
  equipmentTags: [],
  searchText: '',
  selectedResourceKey: '',
  roicManager: {},
  roicManagerConfiguration: {},
  recalcState: RECALC_STATES.VALID,
}

function setResourceTypes (state, resourceTypes) {
  return { ...state,
    resourceTypes: resourceTypes
  }
}

function setResourceManagers (state, allresourceManagers) {

  let resourceManagers = allresourceManagers
  .filter((item) => item.deleted !== true)

  // Set Pagination Data
  let pageCount = Math.ceil(resourceManagers.length / perPage)
  let paginateData = resourceManagers.slice(initialOffset, initialOffset + perPage)

  let pageableData = {}
  pageableData['pageCount'] = pageCount
  pageableData['paginateData'] = paginateData
  pageableData['offset'] = initialOffset
  pageableData['perPage'] = perPage
  pageableData['currentPage'] = initialcurrentPage

  return { ...state,
    resourceManagers: resourceManagers,
    pageableData: pageableData,
    filteredresourceManagers: null
  }
}

function setPageData (state, selectedPage) {

  let resourceManagerslist = ''
  if (state.filteredresourceManagers != null) {
    resourceManagerslist = state.filteredresourceManagers
  } else {
    resourceManagerslist = state.resourceManagers
  }

  const offset = selectedPage * perPage
  let paginateData = resourceManagerslist.slice(offset, offset + perPage)

  let pageableData = state.pageableData
  pageableData['paginateData'] = paginateData
  pageableData['offset'] = offset
  pageableData['currentPage'] = selectedPage

  return { ...state,
    pageableData: pageableData
  }
}

function searchManagers (state, searchText) {
  return { ...state,
    searchText: searchText
  }
}

function setCanMakeNewFilter (state, filterText) {
  const isMakeNewFilter =  ResourceKey.hasOwnProperty(filterText)
  return {
    ...state,
    selectedResourceKey: filterText,
    isMakeNewFilter: isMakeNewFilter,
  }
}

function setIsResourceEditor (state, status) {
  return { ...state,
    isResourceEditor: status
  }
}

function setPriceBookStrategy (state, priceBookStrategy) {
  return { ...state,
    priceBookStrategy: priceBookStrategy
  }
}

// ARPU Manager

function setArpuManager (state, arpuManager) {
  return { ...state,
    arpuManager: arpuManager
  }
}

function setArpuModels (state, arpuModels) {
  return { ...state, arpuModels }
}

// Competition System

function setRegions (state, regions) {
  return { ...state,
    regions: regions
  }
}

function setCompManMeta (state, compManMeta) {
  return { ...state,
    compManMeta: compManMeta
  }
}

function setCompManForStates (state, carriersByPct) {
  return { ...state,
    carriersByPct: carriersByPct
  }
}

function setStrengthCols (state, pristineStrengthsById, strengthsById, strengthCols) {
  return { ...state,
    loadStrength: {
      pristineStrengthsById: pristineStrengthsById,
      strengthsById: strengthsById,
      strengthCols: strengthCols
    }
  }
}

function setEquipmentTags (state, equipmentTags) {
  return { ...state,
    equipmentTags: equipmentTags
  }
}

function setCurrentPriceBook (state, currentPriceBook) {
  return { ...state,
    currentPriceBook: currentPriceBook
  }
}

function setStatesStrategy (state, statesForStrategy, selectedStateForStrategy, priceBookDefinitions, pristineAssignments) {
  return { ...state,
    statesStrategy: {
      statesForStrategy: statesForStrategy,
      selectedStateForStrategy: selectedStateForStrategy,
      priceBookDefinitions: priceBookDefinitions,
      pristineAssignments: pristineAssignments
    }
  }
}

function setPriceBookDefinition (state, selectedDefinitionId, structuredPriceBookDefinitions, selectedEquipmentTags, setOfSelectedEquipmentTags) {
  return { ...state,
    priceBookDefinition: {
      selectedDefinitionId: selectedDefinitionId,
      structuredPriceBookDefinitions: structuredPriceBookDefinitions,
      selectedEquipmentTags: selectedEquipmentTags,
      setOfSelectedEquipmentTags: setOfSelectedEquipmentTags
    }
  }
}

function setConstructionRatios (state, constructionRatios) {
  return { ...state,
    constructionRatios: constructionRatios
  }
}

// Roic Editor


function setRoicManager (state, roicManager) {
  return { ...state,
    roicManager: roicManager
  }
}

function setRoicManagerConfiguration (state, roicManagerConfiguration) {
  return { ...state,
    roicManagerConfiguration: roicManagerConfiguration,
  }
}

// Impedance Editor

function setImpedanceManager (state, impedanceManager) {
  return { ...state,
    impedanceManager: impedanceManager
  }
}

function setImpedanceManagerConfiguration (state, impedanceManagerConfiguration, orderedImpedanceMapKeys) {
  return { ...state,
    impedanceManagerConfigurations: {
      impedanceManagerConfiguration: impedanceManagerConfiguration,
      orderedImpedanceMapKeys: orderedImpedanceMapKeys,
    }
  }
}

// Tsm Editor

function setTsmManager (state, tsmManager) {
  return { ...state,
    tsmManager: tsmManager
  }
}

function setTsmManagerConfiguration (state, tsmManagerConfiguration, pristineTsmManagerConfiguration) {
  return { ...state,
    tsmManagerConfigurations: {
      tsmManagerConfiguration: tsmManagerConfiguration,
      pristineTsmManagerConfiguration: pristineTsmManagerConfiguration,
    }
  }
}

// Rate Reach Editor

function setRateReachManager (state, rateReachManager) {
  return { ...state,
    rateReachManager: rateReachManager
  }
}

function setRateReachManagerConfiguration (state, rateReachConfig, technologyTypeDetails) {
  return { ...state,
    rateReachManagerConfigs: {
      rateReachConfig: rateReachConfig,
      technologyTypeDetails: technologyTypeDetails,
    }
  }
}

function setModalTitle (state, modalTitle) {
  return { ...state,
    modalTitle: modalTitle
  }
}

function setIsRrmManager (state, isRrmManager) {
  return { ...state,
    isRrmManager: isRrmManager
  }
}

function setRecalcState(state, recalc) {
  return { ...state,
    recalcState: recalc
  }
}

function resourceReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.RESOURCE_EDITOR_SET_RESOURCE_TYPES:
      return setResourceTypes(state, action.payload)

    case Actions.RESOURCE_EDITOR_SET_RESOURCE_MANAGERS:
      return setResourceManagers(state, action.payload)

    case Actions.RESOURCE_EDITOR_HANDLE_PAGE_CLICK:
      return setPageData(state, action.payload)

    case Actions.RESOURCE_EDITOR_SEARCH_MANAGERS:
      return searchManagers(state, action.payload)

    case Actions.RESOURCE_EDITOR_CAN_MAKE_NEW_FILTER:
      return setCanMakeNewFilter(state, action.payload)

    case Actions.RESOURCE_EDITOR_IS_RESOURCE_EDITOR:
      return setIsResourceEditor(state, action.payload)

    case Actions.RESOURCE_EDITOR_GET_PRICEBOOK_STRATEGY:
      return setPriceBookStrategy(state, action.payload)

    case Actions.RESOURCE_EDITOR_ARPU_MANAGER:
      return setArpuManager(state, action.payload)

    case Actions.RESOURCE_EDITOR_SET_ARPU_MODELS:
      return setArpuModels(state, action.payload)

    case Actions.RESOURCE_EDITOR_GET_REGIONS:
      return setRegions(state, action.payload)

    case Actions.RESOURCE_EDITOR_CARRIERS_BY_PCT:
      return setCompManForStates(state, action.payload)

    case Actions.RESOURCE_EDITOR_STRENGTH_COLS:
      return setStrengthCols(
        state, action.payload.pristineStrengthsById, action.payload.strengthsById, action.payload.strengthCols
      )

    case Actions.RESOURCE_EDITOR_COMP_MAN_META:
      return setCompManMeta(state, action.payload)

    case Actions.RESOURCE_EDITOR_EQUIPMENT_TAGS:
      return setEquipmentTags(state, action.payload)

    case Actions.RESOURCE_EDITOR_CURRENT_PRICEBOOK:
      return setCurrentPriceBook(state, action.payload)

    case Actions.RESOURCE_EDITOR_STATES_STRATEGY:
      return setStatesStrategy(
        state, action.payload.statesForStrategy, action.payload.selectedStateForStrategy,
        action.payload.priceBookDefinitions, action.payload.pristineAssignments
      )

    case Actions.RESOURCE_EDITOR_PRICEBOOK_DEFINITION:
      return setPriceBookDefinition(
        state, action.payload.selectedDefinitionId, action.payload.structuredPriceBookDefinitions,
        action.payload.selectedEquipmentTags, action.payload.setOfSelectedEquipmentTags
      )

    case Actions.RESOURCE_EDITOR_CONSTRUCTION_RATIOS:
      return setConstructionRatios(state, action.payload)

    case Actions.RESOURCE_EDITOR_ROIC_MANAGER:
      return setRoicManager(state, action.payload)

    case Actions.RESOURCE_EDITOR_ROIC_MANAGER_CONFIG:
      return setRoicManagerConfiguration(state, action.payload)

    case Actions.RESOURCE_EDITOR_IMPEDANCE_MANAGER:
      return setImpedanceManager(state, action.payload)

    case Actions.RESOURCE_EDITOR_IMPEDANCE_MANAGER_CONFIG:
      return setImpedanceManagerConfiguration(
        state, action.payload.impedanceManagerConfiguration, action.payload.orderedImpedanceMapKeys
      )

    case Actions.RESOURCE_EDITOR_TSM_MANAGER:
      return setTsmManager(state, action.payload)

    case Actions.RESOURCE_EDITOR_TSM_MANAGER_CONFIG:
      return setTsmManagerConfiguration(
        state, action.payload.tsmManagerConfiguration, action.payload.pristineTsmManagerConfiguration
      )

    case Actions.RESOURCE_EDITOR_RATE_REACH_MANAGER:
      return setRateReachManager(state, action.payload)

    case Actions.RESOURCE_EDITOR_RATE_REACH_MANAGER_CONFIG:
      return setRateReachManagerConfiguration(
        state, action.payload.rateReachConfig, action.payload.technologyTypeDetails
      )

    case Actions.RESOURCE_EDITOR_MODAL_TITLE:
      return setModalTitle(state, action.payload)

    case Actions.RESOURCE_EDITOR_IS_RRM_MANAGER:
      return setIsRrmManager(state, action.payload)

    case Actions.RESOURCE_EDITOR_SET_RECALC_STATE:
      return setRecalcState(state, action.payload)


  default:
    return state
  }
}

export default resourceReducer
