import React from 'react'
import { Provider, connect } from 'react-redux'

// This function takes a React component and wraps it with a <Provider> that gives access to the
// global redux store. Do this ONLY if the component does not have a parent component with a
// <Provider> tag. This is done mainly because we are embedding React components within AngularJS.
// Ideally, once the entire UI is migrated to React we will have a single React root component
// and a single <Provider> tag.
function wrapComponentWithProvider (store, WrappedComponent, ...args) {
  let ConnectedWrappedComponent = connect(...args)(WrappedComponent)
  return function (props) {
    return <Provider store={store}><ConnectedWrappedComponent {...props} /></Provider>
  }
}

export default wrapComponentWithProvider
