import React, { Button, Component } from 'react'
import { Provider, connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'

console.log('REACTJS store is ')
console.log(reduxStore)


function connectWithStore(store, WrappedComponent, ...args) {
  let ConnectedWrappedComponent = connect(...args)(WrappedComponent)
  return function (props) {
    // return <ConnectedWrappedComponent {...props} store={store} />
    console.log('store is')
    console.log(store)
    console.log(props)
    return <Provider store={store}><ConnectedWrappedComponent {...props} /></Provider>
  }
}

class CoverageInitializer extends Component {
  render() {
    return<div>
        <p>Hello world</p>
        <p>Property1: {this.props.property1}</p>
        <Button onClick={this.props.increment()} />
      </div>
  }
}

CoverageInitializer.propTypes = {
  property1: PropTypes.number
}

const mapStateToProps = (state, ownProps) => {
  return {
    property1: state[0].value
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    increment: () => dispatch({ type: 'INCREMENT' })
  }
}

const CoverageInitializerComponent = connectWithStore(reduxStore, CoverageInitializer, mapStateToProps, mapDispatchToProps)
export default CoverageInitializerComponent
