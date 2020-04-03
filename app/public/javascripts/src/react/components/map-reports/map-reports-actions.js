/* globals Blob */
import { saveAs } from 'file-saver'
import AroHttp from '../../common/aro-http'
import Actions from '../../common/actions'

function downloadReport (planId, pageDefinitions) {
  return dispatch => {
    const reportUrl = `/map-reports/report`
    // "(new Date()).toISOString().split('T')[0]" will give "YYYY-MM-DD"
    // Note that we are doing (new Date(Date.now())) so that we can have deterministic tests (by replacing the Date.now() function when testing)
    const downloadFileName = `${(new Date(Date.now())).toISOString().split('T')[0]}_map_report.pdf`
    AroHttp.post(reportUrl, pageDefinitions, true)
      .then(rawResult => {
        saveAs(new Blob([rawResult]), downloadFileName)
      })
      .catch(err => {
        console.error(err)
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

function savePageDefinition (uuid, pageDefinition) {
  return {
    type: Actions.MAP_REPORTS_SET_PAGE_DEFINITION,
    payload: {
      uuid,
      pageDefinition
    }
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

export default {
  downloadReport,
  setLayers,
  setLayerIsChecked,
  loadReportPagesForPlan,
  savePageDefinition,
  clearMapReports,
  setPages,
  setActivePageUuid,
  setEditingPageUuid
}
