import React, { Component } from 'react'
import { Provider, connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import Actions from '../../common/actions'
import UserActions from '../user/user-actions'

function connectWithStore(store, WrappedComponent, ...args) {
  let ConnectedWrappedComponent = connect(...args)(WrappedComponent)
  return function (props) {
    // return <ConnectedWrappedComponent {...props} store={store} />
    return <Provider store={store}><ConnectedWrappedComponent {...props} /></Provider>
  }
}

class CoverageInitializer extends Component {
  render() {
    return<div>
        <p>I am a ReactJS component</p>
        <p>Property1: {this.props.property1}</p>
        <button className={'btn btn-primary'} onClick={() => this.props.increment()}>Increment value</button>
        <button className={'btn btn-primary'} onClick={() => this.props.getSuperUser()}>Get Superuser</button>
      </div>
  }
}

CoverageInitializer.propTypes = {
  property1: PropTypes.number
}

const mapStateToProps = (state, ownProps) => {
  return {
    property1: state.test.value
  }
}

const mapDispatchToProps = (dispatch) => ({
  increment: () => {dispatch({ type: 'INCREMENT' })},
  getSuperUser: () => {dispatch(UserActions.getSuperUserFlag(4))}
})

const CoverageInitializerComponent = connectWithStore(reduxStore, CoverageInitializer, mapStateToProps, mapDispatchToProps)
export default CoverageInitializerComponent
