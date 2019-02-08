import { applyMiddleware, combineReducers, createStore, compose } from 'redux'
import { createLogger } from 'redux-logger'
import thunk from 'redux-thunk'

// Custom middleware
import createSocketMiddleware from './middleware/websockets'

// Reducers
import coverage from '../react/components/coverage/coverage-reducer'
import plan from '../react/components/plan/plan-reducer'
import selection from '../react/components/selection/selection-reducer'
import user from '../react/components/user/user-reducer'

const logger = createLogger({
  level: 'info',
  collapsed: true
});
const socketMiddleware = createSocketMiddleware()

let reducer = combineReducers({coverage, plan, selection, user})

// Add support for Redux devtools extension. Yes, even in production.
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
var store = createStore(reducer, composeEnhancers(applyMiddleware(logger, thunk, socketMiddleware)))
export default store
