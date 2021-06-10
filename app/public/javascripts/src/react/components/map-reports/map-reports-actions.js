/* globals Blob */
import { saveAs } from 'file-saver'
import AroHttp from '../../common/aro-http'
import Actions from '../../common/actions'

function downloadReport (clientId, pageDefinitions) {
  return dispatch => {
    dispatch({ type: Actions.MAP_REPORTS_SET_IS_DOWNLOADING, payload: true })
    const reportUrl = `/map-reports/report`
    // "(new Date()).toISOString().split('T')[0]" will give "YYYY-MM-DD"
    // Note that we are doing (new Date(Date.now())) so that we can have deterministic tests (by replacing the Date.now() function when testing)
    const downloadFileName = `${(new Date(Date.now())).toISOString().split('T')[0]}_map_report.pdf`
    AroHttp.post(reportUrl, pageDefinitions, true)
      .then(rawResult => {
        saveAs(new Blob([rawResult]), downloadFileName)
        dispatch({ type: Actions.MAP_REPORTS_SET_IS_DOWNLOADING, payload: false })
      })
      .catch(err => {
        console.error(err)
        dispatch({ type: Actions.MAP_REPORTS_SET_IS_DOWNLOADING, payload: false })
      })
  }
}

function setLayers (layerNames) {
  return {
    type: Actions.MAP_REPORTS_SET_LAYERS,
    payload: layerNames
  }
}

function setLayerIsChecked (layerName, isChecked) {
  return {
    type: Actions.MAP_REPORTS_SET_LAYER_IS_CHECKED,
    payload: {
      layerName: layerName,
      isChecked: isChecked
    }
  }
}

function loadReportPagesForPlan (planId) {
  return dispatch => {
    dispatch({ type: Actions.MAP_REPORTS_SET_IS_COMMUNICATING, payload: true })
    AroHttp.get(`/service/v1/plan/${planId}/plan-settings`)
      .then(result => {
        dispatch({
          type: Actions.MAP_REPORTS_SET_PAGES,
          payload: result.data.printSettings.pages
        })
        dispatch({ type: Actions.MAP_REPORTS_SET_IS_COMMUNICATING, payload: false })
      })
      .catch(err => {
        console.error(err)
        dispatch({ type: Actions.MAP_REPORTS_SET_IS_COMMUNICATING, payload: false })
      })
  }
}

function clearMapReports () {
  return {
    type: Actions.MAP_REPORTS_CLEAR
  }
}

function setPages (planId, pageDefinitions) {
  return dispatch => {
    dispatch({ type: Actions.MAP_REPORTS_SET_IS_COMMUNICATING, payload: true })
    AroHttp.put(`/service/v1/plan/${planId}/plan-settings`, { printSettings: { pages: pageDefinitions } })
      .then(result => {
        dispatch({
          type: Actions.MAP_REPORTS_SET_PAGES,
          payload: result.data.printSettings.pages // aro-service will return the full set of pages
        })
        dispatch({ type: Actions.MAP_REPORTS_SET_IS_COMMUNICATING, payload: false })
      })
      .catch(err => {
        console.error(err)
        dispatch({ type: Actions.MAP_REPORTS_SET_IS_COMMUNICATING, payload: false })
      })
  }
}

function showMapObjects (showMapObjects) {
  return {
    type: Actions.MAP_REPORTS_SET_SHOW_MAP_OBJECTS,
    payload: showMapObjects
  }
}

function showPageNumbers (showPageNumbers) {
  return {
    type: Actions.MAP_REPORTS_SET_SHOW_PAGE_NUMBERS,
    payload: showPageNumbers
  }
}

function setActivePageUuid (uuid) {
  return {
    type: Actions.MAP_REPORTS_SET_ACTIVE_PAGE_UUID,
    payload: uuid
  }
}

function setEditingPageUuid (uuid) {
  return {
    type: Actions.MAP_REPORTS_SET_EDITING_PAGE_INDEX,
    payload: uuid
  }
}

function setWaitTimePerPage (waitSecondsPerPage) {
  return {
    type: Actions.MAP_REPORTS_SET_WAIT_TIME_PER_PAGE,
    payload: waitSecondsPerPage
  }
}

function setManualWait (manualWait) {
  return {
    type: Actions.MAP_REPORTS_SET_MANUAL_WAIT,
    payload: manualWait
  }
}

function setIsReportMode (isReportMode) {
  return {
    type: Actions.MAP_REPORTS_SET_IS_REPORT_MODE,
    payload: isReportMode
  }
}

export default {
  downloadReport,
  setLayers,
  setLayerIsChecked,
  loadReportPagesForPlan,
  clearMapReports,
  setPages,
  showMapObjects,
  showPageNumbers,
  setActivePageUuid,
  setEditingPageUuid,
  setWaitTimePerPage,
  setManualWait,
  setIsReportMode,
}
