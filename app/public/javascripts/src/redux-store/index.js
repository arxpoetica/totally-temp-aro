import { applyMiddleware, combineReducers, createStore, compose } from 'redux'
import { createLogger } from 'redux-logger'
import { reducer as form } from 'redux-form'
import thunk from 'redux-thunk'

// Custom middleware
import createSocketMiddleware from './middleware/websockets'

// Reducers
import ui from '../react/components/configuration/ui/ui-reducer'
import system from '../react/components/configuration/configuration-reducer'
import report from '../react/components/configuration/report/report-reducer'
import networkAnalysis from '../react/components/optimization/network-analysis/network-analysis-reducer'
import networkOptimization from '../react/components/optimization/network-optimization/network-optimization-reducer'
import opReport from '../react/components/optimization/reports/reports-reducer'
import rfp from '../react/components/optimization/rfp/rfp-reducer'
import contextMenu from '../react/components/context-menu/reducer'
import coverage from '../react/components/coverage/coverage-reducer'
import fullScreen from '../react/components/full-screen/full-screen-reducer'
import map from '../react/components/map/map-reducer'
import mapLayers from '../react/components/map-layers/map-layer-reducer'
import mapReports from '../react/components/map-reports/map-reports-reducer'
import plan from '../react/components/plan/plan-reducer'
import projectTemplate from '../react/components/project-template/project-template-reducer'
import etlTemplates from '../react/components/etl-templates/etl-templates-reducer'
import planEditor from '../react/components/plan-editor/plan-editor-reducer'
import selection from '../react/components/selection/selection-reducer'
import tool from '../react/components/tool/tool-reducer'
import user from '../react/components/user/user-reducer'
import ringEdit from '../react/components/ring-edit/ring-edit-reducer'
import locationInfo from '../react/components/location-info/location-info-reducer'
import acl from '../react/components/acl/acl-reducer'
import resourceManager from '../react/components/resource-manager/resource-manager-reducer'
import dataEdit from '../react/components/data-edit/data-edit-reducer'
import globalSettings from '../react/components/global-settings/globalsettings-reducer'
import resourceEditor from '../react/components/resource-editor/resource-reducer'
import dataUpload from '../react/components/data-upload/data-upload-reducer'
import toolbar from '../react/components/header/tool-bar-reducer'
import viewSettings from '../react/components/view-settings/view-settings-reducer'
import notification from '../react/components/notification/notification-reducer'
import expertMode from '../react/components/sidebar/analysis/expert-mode/expert-mode-reducer'
import roicReports from '../react/components/sidebar/analysis/roic-reports/roic-reports-reducer'
import stateViewMode from '../react/components/state-view-mode/state-view-mode-reducer'


// MAP_SET_ARE_TILES_RENDERING is removed from logger due to infinite rendering
// https://www.npmjs.com/package/redux-logger#log-everything-except-actions-with-certain-type
const logger = createLogger({
  level: 'info',
  collapsed: true,
  predicate: (getState, action) => {
    const excludes = ARO_GLOBALS.LOGGER_EXCLUDES
    if (excludes && excludes.split(',').includes(action.type)) return false
    return true
  },
})
const socketMiddleware = createSocketMiddleware()

let reducer = combineReducers({
  configuration: combineReducers({ report, ui, system }),
  contextMenu,
  coverage,
  etlTemplates,
  fullScreen,
  map,
  mapLayers,
  mapReports,
  optimization: combineReducers({ networkOptimization, networkAnalysis, report: opReport, rfp }),
  plan,
  projectTemplate,
  planEditor,
  selection,
  tool,
  user,
  form,
  ringEdit,
  locationInfo,
  acl,
  resourceManager,
  dataEdit,
  globalSettings,
  resourceEditor,
  dataUpload,
  notification,
  toolbar,
  viewSettings,
  expertMode,
  roicReports,
  stateViewMode,
})

// Add support for Redux devtools extension. Yes, even in production.
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
var store = createStore(reducer, composeEnhancers(applyMiddleware(thunk, socketMiddleware, logger)))
export default store
