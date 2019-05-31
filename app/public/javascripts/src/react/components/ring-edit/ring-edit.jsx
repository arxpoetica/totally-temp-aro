import React, { Component } from 'react'
// import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import ringActions from './ring-edit-actions.js'

import Ring from './ring.js'


export class RingEdit extends Component {
  /*
  constructor (props) {
    super(props)
    this.testData = {
      
    }
  }
  */
  render () {
    return <div>
      
      <button id='btnRingDoathing'
        className='btn btn-sm btn-light'
        onClick={() => this.requestAddNewRing()}>
        <i className='fas fa-pencil-alt' /> Add Ring
      </button>
      {
        Object.keys(this.props.rings).map((key) => (
          this.renderRingRow(this.props.rings[key])
        ))
      }
    </div>
  }
  
  renderRingRow (ring) {
    return <div key={ring.id}>{ring.id}</div>
  }

  requestAddNewRing () {
    var ringId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)// ToDo: replace this with proper get ID
    var ring = new Ring(ringId)
    this.props.addRings([ring])
  }

  localFunction () {
    var ring = new Ring('1234')
    console.log(ring)
    this.props.setTestState('new state!')
  }

}

// --- //

RingEdit.propTypes = {
}

const mapStateToProps = (state) => ({
  testState: state.ringEdit.testState, 
  rings: state.ringEdit.rings, 
  selectedRingId: state.ringEdit.selectedRingId

})

const mapDispatchToProps = dispatch => ({
  setTestState: testState => dispatch(ringActions.setTestState(testState)), 
  setSelectedRingId: ringId => dispatch(ringActions.setSelectedRingId(ringId)), 
  addRings: rings => dispatch(ringActions.addRings(rings)), 
  removeRing: ringId => dispatch(ringActions.removeRing(ringId))
  
})

const RingEditComponent = wrapComponentWithProvider(reduxStore, RingEdit, mapStateToProps, mapDispatchToProps)
export default RingEditComponent
