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

import coverage from '../react/components/coverage/coverage-reducer'
import mapLayers from '../react/components/map-layers/map-layer-reducer'
import plan from '../react/components/plan/plan-reducer'
import selection from '../react/components/selection/selection-reducer'
import user from '../react/components/user/user-reducer'

const logger = createLogger({
  level: 'info',
  collapsed: true
})
const socketMiddleware = createSocketMiddleware()

let reducer = combineReducers({
  configuration: combineReducers({ report, ui }),
  coverage,
  mapLayers,
  optimization: combineReducers({ networkAnalysis }),
  plan,
  selection,
  user,
  form
})

// Add support for Redux devtools extension. Yes, even in production.
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
var store = createStore(reducer, composeEnhancers(applyMiddleware(logger, thunk, socketMiddleware)))
export default store
