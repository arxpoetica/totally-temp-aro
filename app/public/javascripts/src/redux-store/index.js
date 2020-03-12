import { applyMiddleware, combineReducers, createStore, compose } from 'redux'
import { createLogger } from 'redux-logger'
import { reducer as form } from 'redux-form'
import thunk from 'redux-thunk'

// Custom middleware
import createSocketMiddleware from './middleware/websockets'

// Reducers
import ui from '../react/components/configuration/ui/ui-reducer'
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
import planEditor from '../react/components/plan-editor/plan-editor-reducer'
import selection from '../react/components/selection/selection-reducer'
import user from '../react/components/user/user-reducer'
import ringEdit from '../react/components/ring-edit/ring-edit-reducer'
import locationInfo from '../react/components/location-info/location-info-reducer'
import acl from '../react/components/acl/acl-reducer'
import resourceManager from '../react/components/resource-manager/resource-manager-reducer'

const logger = createLogger({
  level: 'info',
  collapsed: true
})
const socketMiddleware = createSocketMiddleware()

let reducer = combineReducers({
  configuration: combineReducers({ report, ui }),
  contextMenu,
  coverage,
  fullScreen,
  map,
  mapLayers,
  mapReports,
  optimization: combineReducers({ networkOptimization, networkAnalysis, report: opReport, rfp }),
  plan,
  planEditor,
  selection,
  user,
  form,
  ringEdit,
  locationInfo,
  acl,
  resourceManager
})

// Add support for Redux devtools extension. Yes, even in production.
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
var store = createStore(reducer, composeEnhancers(applyMiddleware(logger, thunk, socketMiddleware)))
export default store
