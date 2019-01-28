import { combineReducers } from 'redux'
import { createLogger } from 'redux-logger'
import testReducer from './reducers/testReducer'

const logger = createLogger({
  level: 'info',
  collapsed: true
});

const reduxConfig = ['$ngReduxProvider', ($ngReduxProvider) => {
  let reducer = combineReducers([testReducer]);
  $ngReduxProvider.createStoreWith(reducer, [logger]);
}]

export default reduxConfig
