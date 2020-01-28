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

function savePageDefinition (index, pageDefinition) {
  return {
    type: Actions.MAP_REPORTS_SET_PAGE_DEFINITION,
    payload: {
      index,
      pageDefinition
    }
  }
}

function clearMapReports () {
  return {
    type: Actions.MAP_REPORTS_CLEAR
  }
}

function addPage (pageDefinition) {
  return {
    type: Actions.MAP_REPORTS_ADD_PAGE,
    payload: pageDefinition
  }
}

function removePage (index) {
  return {
    type: Actions.MAP_REPORTS_REMOVE_PAGE,
    payload: index
  }
}

function setActivePageIndex (index) {
  return {
    type: Actions.MAP_REPORTS_SET_ACTIVE_PAGE_INDEX,
    payload: index
  }
}

export default {
  downloadReport,
  setLayers,
  setLayerIsChecked,
  savePageDefinition,
  clearMapReports,
  addPage,
  removePage,
  setActivePageIndex
}
