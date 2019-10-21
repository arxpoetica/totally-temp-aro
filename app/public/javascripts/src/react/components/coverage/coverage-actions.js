/* global swal */
import AroHttp from '../../common/aro-http'
import Actions from '../../common/actions'
import SelectionActions from '../selection/selection-actions'
import CoverageStatusTypes from './constants'

function initializeCoverageReport (userId, planId, projectId, activeSelectionMode, locationTypes, tileLayers, initializationParams) {
  return dispatch => {
    // Format the coverage report that so it can be sent over to aro-service
    var requestBody = {
      coverageAnalysisRequest: Object.assign({}, initializationParams)
    }
    requestBody.coverageAnalysisRequest.planId = planId
    requestBody.coverageAnalysisRequest.projectTemplateId = projectId
    requestBody.coverageAnalysisRequest.analysisSelectionMode = activeSelectionMode
    requestBody.coverageAnalysisRequest.locationTypes = locationTypes

    if (activeSelectionMode === 'SELECTED_ANALYSIS_AREAS') {
      // If we have analysis areas selected, we can have exactly one analysis layer selected in the UI
      const visibleAnalysisLayers = tileLayers.filter(item => item.checked && (item.type === 'analysis_layer'))
      if (visibleAnalysisLayers.size !== 1) {
        const errorMessage = 'You must have exactly one analysis layer selected to initialize the coverage report'
        swal({
          title: 'Analysis Layer error',
          text: errorMessage,
          type: 'error',
          closeOnConfirm: true
        })
        return null
      }
      requestBody.coverageAnalysisRequest.analysisLayerId = visibleAnalysisLayers.get(0).analysisLayerId
    }

    dispatch({ type: Actions.COVERAGE_SET_STATUS, payload: { status: CoverageStatusTypes.RUNNING } })

    var coverageReport = null
    AroHttp.post(`/service/coverage/report`, requestBody)
      .then(result => {
        coverageReport = result.data
        dispatch({ type: Actions.COVERAGE_SET_STATUS, payload: { status: CoverageStatusTypes.RUNNING } })
        dispatch({ type: Actions.COVERAGE_SET_REPORT, payload: { report: coverageReport } })
        dispatch({ type: Actions.COVERAGE_SET_INIT_PARAMS, payload: { initializationParams: requestBody.coverageAnalysisRequest } })
        return AroHttp.post(`/service/coverage/report/${coverageReport.reportId}/init`, {})
      })
      .then(() => dispatch({ type: Actions.COVERAGE_SET_STATUS, payload: { status: CoverageStatusTypes.FINISHED } }))
      .catch(err => {
        console.error(err)
        dispatch({ type: Actions.COVERAGE_SET_STATUS, payload: { status: CoverageStatusTypes.FINISHED } })
      })
  }
}

// Modify the coverage reports
function modifyCoverageReport (reportId) {
  return (dispatch, getState) => {
    AroHttp.delete(`/service/coverage/report/${reportId}`)
      .then(result => {
        var initializationParams = {
          coverageType: 'location',
          groupKeyType: 'networkNode',
          useMarketableTechnologies: false,
          useMaxSpeed: false,
          useExistingFiber: true,
          usePlannedFiber: true
        }
        var keys = Object.keys(initializationParams)
        keys.forEach((key) => {
          initializationParams[key] = getState().coverage.initializationParams[key]
        })

        dispatch({ type: Actions.COVERAGE_SET_DETAILS })
        dispatch({ type: Actions.COVERAGE_SET_INIT_PARAMS, payload: { initializationParams: initializationParams } })
        dispatch(SelectionActions.setActiveSelectionMode(getState().selection.activeSelectionMode.id))
      })
      .catch(err => console.error(err))
  }
}

// Fetch the coverage report status for a given plan and set it
function updateCoverageStatus (planId) {
  return dispatch => {
    // First set the status and report initialized/null
    dispatch({
      type: Actions.COVERAGE_SET_DETAILS
    })
    AroHttp.get(`/service/coverage/report/search/plan_id/${planId}`)
      .then(result => {
        // Update the coverage status only if we have a valid report
        const report = result.data.filter(item => item.coverageAnalysisRequest.planId === planId)[0]
        if (report) {
          dispatch({ type: Actions.COVERAGE_SET_STATUS, payload: { status: CoverageStatusTypes.FINISHED } })
          dispatch({ type: Actions.COVERAGE_SET_REPORT, payload: { report: report } })
          dispatch({ type: Actions.COVERAGE_SET_INIT_PARAMS, payload: { initializationParams: report.coverageAnalysisRequest } })
        }
      })
      .catch(err => console.error(err))
  }
}

function setCoverageType (coverageType) {
  return {
    type: Actions.COVERAGE_SET_COVERAGE_TYPE,
    payload: coverageType
  }
}

function setGroupKeyType (groupKeyType) {
  return {
    type: Actions.COVERAGE_SET_GROUP_KEY_TYPE,
    payload: groupKeyType
  }
}

function setLimitMarketableTechnology (limitMarketableTechnology) {
  return {
    type: Actions.COVERAGE_SET_LIMIT_MARKETABLE_TECHNOLOGIES,
    payload: limitMarketableTechnology
  }
}

function setLimitMaxSpeed (limitMaxSpeed) {
  return {
    type: Actions.COVERAGE_SET_LIMIT_MAX_SPEED,
    payload: limitMaxSpeed
  }
}

function setExistingFiber (existingFiber) {
  return {
    type: Actions.COVERAGE_SET_EXISTING_FIBER,
    payload: existingFiber
  }
}

function setPlannedFiber (plannedFiber) {
  return {
    type: Actions.COVERAGE_SET_PLANNED_FIBER,
    payload: plannedFiber
  }
}

function setSiteAssignment (siteAssignment) {
  return {
    type: Actions.COVERAGE_SET_SITE_ASSIGNMENT,
    payload: siteAssignment
  }
}

function setCoverageProgress (progress) {
  return {
    type: Actions.COVERAGE_SET_PROGRESS,
    payload: progress
  }
}

function addBoundaryCoverage (objectId, coverage) {
  return {
    type: Actions.COVERAGE_ADD_BOUNDARY_COVERAGE,
    payload: {
      objectId: objectId,
      coverage: coverage
    }
  }
}

function clearBoundaryCoverage () {
  return {
    type: Actions.COVERAGE_CLEAR_BOUNDARY_COVERAGE
  }
}

function setBoundaryCoverageVisibility (isVisible) {
  return {
    type: Actions.COVERAGE_SET_BOUNDARY_COVERAGE_VISIBILITY,
    payload: isVisible
  }
}

export default {
  updateCoverageStatus,
  initializeCoverageReport,
  modifyCoverageReport,
  setCoverageType,
  setGroupKeyType,
  setLimitMarketableTechnology,
  setLimitMaxSpeed,
  setExistingFiber,
  setPlannedFiber,
  setSiteAssignment,
  setCoverageProgress,
  addBoundaryCoverage,
  clearBoundaryCoverage,
  setBoundaryCoverageVisibility
}
