import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import Point from '../../../common/point'
import RfpActions from './rfp-actions'
import RfpFileUploader from './rfp-file-uploader.jsx'
import RfpTargetsMap from './rfp-targets-map.jsx'

const NEW_TARGET = {
  lat: 0,
  lng: 0
}
export class RfpTargets extends Component {
  constructor (props) {
    super(props)
    this.state = {
      showNewTargetInputs: false,
      newTargetLat: NEW_TARGET.lat,
      newTargetLng: NEW_TARGET.lng
    }
  }

  render () {
    return <div className='m-2 p-2' style={{ borderTop: 'solid 2px #eee' }}>
      <h4>
        Targets
        {
          this.state.showNewTargetInputs
            ? null // Dont show button if we already have the inputs shown
            : <div className='float-right'>
              <RfpFileUploader />
              <button className='btn btn-sm btn-primary ml-1' onClick={this.startAddingNewTarget.bind(this)}>
                <i className='fas fa-pencil-alt' /> Add target
              </button>
            </div>
        }
      </h4>
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        <table className='table table-sm table-striped'>
          <thead className='thead thead-light'>
            <tr>
              <th>Latitude</th>
              <th>Longitude</th>
              <th style={{ width: '100px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Show current targets */}
            {
              this.props.targets.map((target, index) => (
                <tr key={index}>
                  <td>{target.lat}</td>
                  <td>{target.lng}</td>
                  <td><button className='btn btn-sm btn-danger' onClick={() => this.props.removeTarget(index)}><i className='fa fa-trash-alt' /></button></td>
                </tr>
              ))
            }
            {/* Show a row to add new targets */}
            {
              this.state.showNewTargetInputs
                ? <tr>
                  <td>
                    <input className='form-control' type='text' value={this.state.newTargetLat} onChange={event => this.setState({ newTargetLat: event.target.value })} />
                  </td>
                  <td>
                    <input className='form-control' type='text' value={this.state.newTargetLng} onChange={event => this.setState({ newTargetLng: event.target.value })} />
                  </td>
                  <td>
                    <button className='btn btn-sm btn-primary' onClick={this.saveNewTarget.bind(this)}>Save</button>
                  </td>
                </tr>
                : null
            }
          </tbody>
        </table>
      </div>
      <RfpTargetsMap />
    </div>
  }

  startAddingNewTarget () {
    this.setState({
      showNewTargetInputs: true,
      newTargetLat: NEW_TARGET.lat,
      newTargetLng: NEW_TARGET.lng
    })
  }

  saveNewTarget () {
    this.props.addTargets([new Point(+this.state.newTargetLat, +this.state.newTargetLng)])
    this.setState({
      showNewTargetInputs: false,
      newTargetLat: NEW_TARGET.lat,
      newTargetLng: NEW_TARGET.lng
    })
  }
}

RfpTargets.propTypes = {
  targets: PropTypes.arrayOf(PropTypes.instanceOf(Point))
}

const mapStateToProps = (state) => ({
  targets: state.optimization.rfp.targets
})

const mapDispatchToProps = dispatch => ({
  addTargets: (lat, lng) => dispatch(RfpActions.addTargets(lat, lng)),
  removeTarget: indexToRemove => dispatch(RfpActions.removeTarget(indexToRemove))
})

const RfpTargetsComponent = wrapComponentWithProvider(reduxStore, RfpTargets, mapStateToProps, mapDispatchToProps)
export default RfpTargetsComponent
