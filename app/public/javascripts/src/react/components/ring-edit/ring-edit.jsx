import React, { Component } from 'react'
// import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import ringActions from './ring-edit-actions.js'
//import RfpOptions from './rfp-options.jsx'
//import RfpTargets from './rfp-targets.jsx'
//import RfpStatusTypes from './constants'

export class RingEdit extends Component {
  render () {
    return <div>
      This is coming from React!
      <br />
      { this.props.testState }
      
      <button id='btnRingDoathing'
        className='btn btn-sm btn-light'
        onClick={() => this.localFunction()}>
        <i className='fas fa-pencil-alt' /> do a thing 
      </button>

    </div>
  }

  localFunction () {
    console.log('local function')
    this.props.setTestState('new state!')
  }

}


RingEdit.propTypes = {
}

const mapStateToProps = (state) => ({
  testState: state.ringEdit.testState
})

const mapDispatchToProps = dispatch => ({
  setTestState: testState => dispatch(ringActions.setTestState(testState))
})

const RingEditComponent = wrapComponentWithProvider(reduxStore, RingEdit, mapStateToProps, mapDispatchToProps)
export default RingEditComponent
