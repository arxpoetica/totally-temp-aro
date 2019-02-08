import { applyMiddleware, combineReducers, createStore } from 'redux'
import { createLogger } from 'redux-logger'
import thunk from 'redux-thunk'

// Custom middleware
import createSocketMiddleware from './middleware/websockets'

// Reducers
import test from '../reducers/testReducer'
import user from '../react/components/user/user-reducer'

const logger = createLogger({
  level: 'info',
  collapsed: true
});
const socketMiddleware = createSocketMiddleware()

let reducer = combineReducers({user, test})

var store = createStore(reducer, applyMiddleware(logger, thunk, socketMiddleware))
export default store
