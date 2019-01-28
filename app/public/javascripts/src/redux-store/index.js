import { applyMiddleware, createStore } from 'redux'
import { createLogger } from 'redux-logger'
import { combineReducers } from 'redux'
import testReducer from '../reducers/testReducer'

const logger = createLogger({
  level: 'info',
  collapsed: true
});

let reducer = combineReducers([testReducer])

var store = createStore(reducer, applyMiddleware(logger))
export default store
