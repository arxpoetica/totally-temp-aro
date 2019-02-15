import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import UserActions from '../user/user-actions'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'

class CoverageInitializer extends Component {
  render () {
    return <div>
      <p>I am a ReactJS component</p>
      <p>Property1: {this.props.property1}</p>
      <button className={'btn btn-primary'} onClick={() => this.props.increment()}>Increment value</button>
      <button className={'btn btn-primary'} onClick={() => this.props.getSuperUser()}>Get Superuser</button>
    </div>
  }
}

CoverageInitializer.propTypes = {
  coverageType: PropTypes.string,
  saveSiteCoverage: PropTypes.boolean,
  useMarketableTechnologies: PropTypes.boolean,
  useMaxSpeed: PropTypes.boolean

}

const mapStateToProps = (state, ownProps) => {
  return {
    property1: state.test.value
  }
}

const mapDispatchToProps = (dispatch) => ({
  increment: () => { dispatch({ type: 'INCREMENT' }) },
  getSuperUser: () => { dispatch(UserActions.getSuperUserFlag(4)) }
})

const CoverageInitializerComponent = wrapComponentWithProvider(reduxStore, CoverageInitializer, mapStateToProps, mapDispatchToProps)
export default CoverageInitializerComponent
