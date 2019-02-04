import { applyMiddleware, combineReducers, createStore } from 'redux'
import { createLogger } from 'redux-logger'
import thunk from 'redux-thunk'

// Reducers
import test from '../reducers/testReducer'
import user from '../react/components/user/user-reducer'

const logger = createLogger({
  level: 'info',
  collapsed: true
});

let reducer = combineReducers({user, test})

var store = createStore(reducer, applyMiddleware(logger, thunk))
export default store
