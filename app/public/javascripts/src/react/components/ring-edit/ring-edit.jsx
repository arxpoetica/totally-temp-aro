import React, { Component } from 'react'
// import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
//import RfpOptions from './rfp-options.jsx'
//import RfpTargets from './rfp-targets.jsx'
//import RfpStatusTypes from './constants'

export class RingEdit extends Component {
  render () {
    return <div>
      This is coming from React!
    </div>
  }
}

RingEdit.propTypes = {
}

const mapStateToProps = (state) => ({
  testState: state.ringEdit.testState
})

const mapDispatchToProps = dispatch => ({
})

const RingEditComponent = wrapComponentWithProvider(reduxStore, RingEdit, mapStateToProps, mapDispatchToProps)
export default RingEditComponent
