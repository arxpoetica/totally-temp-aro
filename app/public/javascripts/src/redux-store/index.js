import { applyMiddleware, combineReducers, createStore } from 'redux'
import { createLogger } from 'redux-logger'
import thunk from 'redux-thunk'

// Custom middleware
import createSocketMiddleware from './middleware/websockets'

// Reducers
import coverage from '../react/components/coverage/coverage-reducer'
import plan from '../react/components/plan/plan-reducer'
import user from '../react/components/user/user-reducer'

const logger = createLogger({
  level: 'info',
  collapsed: true
});
const socketMiddleware = createSocketMiddleware()

let reducer = combineReducers({coverage, plan, user})

var store = createStore(reducer, applyMiddleware(logger, thunk, socketMiddleware))
export default store
