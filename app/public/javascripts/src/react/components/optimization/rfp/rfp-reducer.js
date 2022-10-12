import Actions from '../../../common/actions'
import RfpStatusTypes from './constants'

const defaultState = {
  options: {
    fiberRoutingMode: {
      displayName: 'Fiber routing mode',
      value: 'ROUTE_FROM_FIBER'
    }
  },
  targets: [],
  clickMapToAddTarget: false,
  selectedTarget: null,
  status: RfpStatusTypes.UNINITIALIZED,
  showAllRfpStatus: false,
  templates: [],
  selectedTemplateId: null,
  isSubmittingRfp: false,
  submitResult: null,
  rfpPlans: [],
  rfpReportDefinitions: [],
  isLoadingRfpPlans: false,
  planListOffset: 0,
  planListLimit: 10,
  progress: 0,
  reportsBeingDownloaded: new Set(), // A set of URLs that are being downloaded (the server can take time to generate reports)
  showFullScreenContainer: false,
}

function clearState () {
  const newState = JSON.parse(JSON.stringify(defaultState))
  newState.reportsBeingDownloaded = new Set()
  return newState
}

function addTargets (state, targets) {
  return { ...state,
    targets: state.targets.concat(targets)
  }
}

function removeTarget (state, index) {
  var newTargets = [].concat(state.targets)
  newTargets.splice(index, 1)
  return { ...state,
    targets: newTargets
  }
}

function replaceTarget (state, index, newTarget) {
  var newTargets = [].concat(state.targets)
  const oldSelectedTargetIndex = state.selectedTarget ? state.targets.findIndex(oldTarget => oldTarget === state.selectedTarget) : -1
  newTargets.splice(index, 1, newTarget)
  return { ...state,
    targets: newTargets,
    selectedTarget: (oldSelectedTargetIndex === index) ? newTarget : state.selectedTarget
  }
}

function setSelectedTarget (state, selectedTarget) {
  return { ...state,
    selectedTarget: selectedTarget
  }
}

function setStatus (state, status) {
  return { ...state,
    status: status
  }
}

function setClickMapToAddTarget (state, clickMapToAddTarget) {
  return { ...state,
    clickMapToAddTarget: clickMapToAddTarget
  }
}

function setShowAllRfpStatus (state, showAllRfpStatus) {
  return { ...state,
    showAllRfpStatus: showAllRfpStatus
  }
}

function setRfpPlans (state, rfpPlans, rfpReportDefinitions, isLoadingRfpPlans) {
  return { ...state,
    rfpPlans: rfpPlans,
    rfpReportDefinitions: rfpReportDefinitions,
    isLoadingRfpPlans: isLoadingRfpPlans,
    planListOffset: defaultState.planListOffset,
    planListLimit: defaultState.planListLimit
  }
}

function setIsLoadingRfpPlans (state, isLoadingRfpPlans) {
  return { ...state,
    isLoadingRfpPlans: isLoadingRfpPlans
  }
}

function setPlanListOffset (state, planListOffset) {
  return { ...state,
    planListOffset: planListOffset
  }
}

function setRfpTemplates (state, rfpTemplates) {
  return { ...state,
    templates: rfpTemplates,
    selectedTemplateId: rfpTemplates[0].id
  }
}

function setSelectedTemplateId (state, selectedTemplateId) {
  return { ...state,
    selectedTemplateId: selectedTemplateId
  }
}

function setIsSubmittingRfp (state, isSubmittingRfp) {
  return { ...state,
    isSubmittingRfp: isSubmittingRfp
  }
}

function setSubmitResult (state, submitResult) {
  return { ...state,
    submitResult: submitResult
  }
}

function startDownloadingRfpReport (state, reportUrl) {
  var reportsBeingDownloaded = new Set(state.reportsBeingDownloaded)
  reportsBeingDownloaded.add(reportUrl)
  return { ...state,
    reportsBeingDownloaded: reportsBeingDownloaded
  }
}

function endDownloadingRfpReport (state, reportUrl) {
  var reportsBeingDownloaded = new Set(state.reportsBeingDownloaded)
  reportsBeingDownloaded.delete(reportUrl)
  return { ...state,
    reportsBeingDownloaded: reportsBeingDownloaded
  }
}

function setOptimizationProgressPercent (state, percent) {
  return { ...state,
    progress: percent
  }
}

function rfpReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.RFP_CLEAR_STATE:
      return clearState(state)

    case Actions.RFP_ADD_TARGETS:
      return addTargets(state, action.payload)

    case Actions.RFP_REMOVE_TARGET:
      return removeTarget(state, action.payload)

    case Actions.RFP_REPLACE_TARGET:
      return replaceTarget(state, action.payload.index, action.payload.target)

    case Actions.RFP_SET_SELECTED_TARGET:
      return setSelectedTarget(state, action.payload)

    case Actions.RFP_SET_STATUS:
      return setStatus(state, action.payload)

    case Actions.RFP_SHOW_HIDE_ALL_RFP_STATUS:
      return setShowAllRfpStatus(state, action.payload)

    case Actions.RFP_SET_PLANS:
      return setRfpPlans(state, action.payload.rfpPlans, action.payload.rfpReportDefinitions, action.payload.isLoadingRfpPlans)

    case Actions.RFP_SET_CLICK_MAP_TO_ADD_TARGET:
      return setClickMapToAddTarget(state, action.payload)

    case Actions.RFP_SET_IS_LOADING_RFP_PLANS:
      return setIsLoadingRfpPlans(state, action.payload)

    case Actions.RFP_SET_PLAN_LIST_OFFSET:
      return setPlanListOffset(state, action.payload)

    case Actions.RFP_SET_TEMPLATES:
      return setRfpTemplates(state, action.payload)

    case Actions.RFP_SET_SELECTED_TEMPLATE_ID:
      return setSelectedTemplateId(state, action.payload)

    case Actions.RFP_SET_IS_SUBMITTING_RESULT:
      return setIsSubmittingRfp(state, action.payload)

    case Actions.RFP_SET_SUBMIT_RESULT:
      return setSubmitResult(state, action.payload)

    case Actions.RFP_START_DOWNLOADING_REPORT:
      return startDownloadingRfpReport(state, action.payload)

    case Actions.RFP_END_DOWNLOADING_REPORT:
      return endDownloadingRfpReport(state, action.payload)
    
    case Actions.RFP_SET_OPTIMIZATION_PROGRESS_PERCENT:
      return setOptimizationProgressPercent(state, action.payload)

    case Actions.RFP_FULL_SCREEN_SHOW_HIDE_CONTAINER:
      return { ...state, showFullScreenContainer: action.payload }

    default:
      return state
  }
}

export default rfpReducer
