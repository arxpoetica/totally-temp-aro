import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import Point from '../../../common/point'
import RfpActions from './rfp-actions'
import RfpFileImporter from './rfp-file-importer.jsx'
import RfpTargetsMap from './rfp-targets-map.jsx'
import Constants from '../../../common/constants'
import './rfp-targets.css'

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
      newTargetLng: NEW_TARGET.lng,
      targetsBeingEdited: []
    }
  }

  render () {
    const targetIdsBeingEdited = new Set(this.state.targetsBeingEdited.map(target => target.id))
    return <div className='m-2 p-2' style={{ borderTop: 'solid 2px #eee' }}>
      <h4>
        Targets
        {
          this.state.showNewTargetInputs
            ? null // Dont show button if we already have the inputs shown
            : <div className='float-right'>
              <RfpFileImporter />
              <button id='btnAddTargetManual'
                className='btn btn-sm btn-light'
                onClick={this.startAddingNewTarget.bind(this)}>
                <i className='fas fa-pencil-alt' /> Manual entry
              </button>
              <button id='btnClickMapToAddTarget'
                className={'btn btn-sm ' + (this.props.clickMapToAddTarget ? 'btn-primary' : 'btn-light')}
                onClick={() => this.props.setClickMapToAddTarget(!this.props.clickMapToAddTarget)}>
                <i className='fas fa-bullseye' /> Click map
              </button>
            </div>
        }
      </h4>
      <div style={{ maxHeight: '300px', overflowY: 'auto', overflowX: 'hidden' }}>
        <table id='tblRfpTargets' className='table table-sm table-striped'>
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
                targetIdsBeingEdited.has(target.id)
                  ? this.renderTargetBeingEdited(target, index)
                  : this.renderRegularTarget(target, index)
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
                    <button id='btnSaveTarget' className='btn btn-sm btn-primary' onClick={this.saveNewTarget.bind(this)}>Save</button>
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

  renderRegularTarget (target, index) {
    return <tr id={`trTarget_${index}`} key={index} onClick={event => this.props.setSelectedTarget(target)}
      className={'tr-rfp-target' + (this.props.selectedTarget === target ? ' selected-target-row ' : '')}>
      <td>{this.limitLatLongPrecision(target.lat)}</td>
      <td>{this.limitLatLongPrecision(target.lng)}</td>
      <td>
        <button id={`btnEditTarget_${index}`} className='btn btn-sm btn-light' onClick={() => this.startEditingTarget(target)}>
          <i className='fa fa-edit' />
        </button>
        <button id={`btnDeleteTarget_${index}`}
          className='btn btn-sm btn-danger'
          onClick={event => {
            this.props.removeTarget(index)
            event.stopPropagation()
          }}>
          <i className='fa fa-trash-alt' />
        </button>
      </td>
    </tr>
  }

  renderTargetBeingEdited (target, index) {
    const indexWithinEditingTargets = this.state.targetsBeingEdited.findIndex(editingTarget => editingTarget.id === target.id)
    return <tr id={`trTarget_${index}`} key={index} onClick={event => this.props.setSelectedTarget(target)}
      className={'tr-rfp-target' + (this.props.selectedTarget === target ? ' selected-target-row ' : '')}>
      <td>
        <input
          id={`inpTargetLatitude_${index}`}
          type='text'
          className='form-control form-control-sm'
          value={this.state.targetsBeingEdited[indexWithinEditingTargets].lat}
          onChange={event => this.setEditingTargetProperty(target.id, 'lat', event.target.value)}
        />
      </td>
      <td>
        <input
          id={`inpTargetLongitude_${index}`}
          type='text'
          className='form-control form-control-sm'
          value={this.state.targetsBeingEdited[indexWithinEditingTargets].lng}
          onChange={event => this.setEditingTargetProperty(target.id, 'lng', event.target.value)}
        />
      </td>
      <td>
        <button id={`btnSaveTarget_${index}`} className='btn btn-sm btn-light' onClick={() => this.saveEditingTarget(target.id)}>
          <i className='fa fa-save' />
        </button>
        <button id={`btnCancelEditTarget_${index}`} className='btn btn-sm btn-light' onClick={() => this.cancelEditingTarget(target.id)}>
          Cancel
        </button>
      </td>
    </tr>
  }

  limitLatLongPrecision (number) {
    // This will limit precision, as well as remove insignificant trailing zeros. E.g. 1.210000003 => 1.21
    return Number(number.toFixed(Constants.LAT_LONG_DISPLAY_PRECISION)).toString()
  }

  startAddingNewTarget () {
    this.setState({
      showNewTargetInputs: true,
      newTargetLat: NEW_TARGET.lat,
      newTargetLng: NEW_TARGET.lng
    })
    this.props.setClickMapToAddTarget(false)
  }

  saveNewTarget () {
    this.props.addTargets([new Point(+this.state.newTargetLat, +this.state.newTargetLng)])
    this.setState({
      showNewTargetInputs: false,
      newTargetLat: NEW_TARGET.lat,
      newTargetLng: NEW_TARGET.lng
    })
  }

  startEditingTarget (target) {
    var newTargetsBeingEdited = [].concat(this.state.targetsBeingEdited)
    // Make a copy of the point being edited
    newTargetsBeingEdited.push(new Point(target.lat, target.lng, target.id))
    this.setState({
      targetsBeingEdited: newTargetsBeingEdited
    })
  }

  cancelEditingTarget (targetId) {
    const editingTargetIndex = this.state.targetsBeingEdited.findIndex(target => target.id === targetId)
    var newTargetsBeingEdited = [].concat(this.state.targetsBeingEdited)
    newTargetsBeingEdited.splice(editingTargetIndex, 1)
    this.setState({
      targetsBeingEdited: newTargetsBeingEdited
    })
  }

  saveEditingTarget (targetId) {
    // Save the change to the redux store
    const targetIndex = this.props.targets.findIndex(target => target.id === targetId)
    const editingTargetIndex = this.state.targetsBeingEdited.findIndex(target => target.id === targetId)
    // Make sure that the lat/longs of the editing target are numbers
    this.state.targetsBeingEdited[editingTargetIndex].lat = +this.state.targetsBeingEdited[editingTargetIndex].lat
    this.state.targetsBeingEdited[editingTargetIndex].lng = +this.state.targetsBeingEdited[editingTargetIndex].lng
    this.props.replaceTarget(targetIndex, this.state.targetsBeingEdited[editingTargetIndex])

    var newTargetsBeingEdited = [].concat(this.state.targetsBeingEdited)
    newTargetsBeingEdited.splice(editingTargetIndex, 1)
    this.setState({
      targetsBeingEdited: newTargetsBeingEdited
    })
  }

  setEditingTargetProperty (targetId, property, value) {
    const editingTargetIndex = this.state.targetsBeingEdited.findIndex(target => target.id === targetId)
    const oldTarget = this.state.targetsBeingEdited[editingTargetIndex]
    var newTarget = new Point(oldTarget.lat, oldTarget.lng, oldTarget.id)
    newTarget[property] = value
    var newTargetsBeingEdited = [].concat(this.state.targetsBeingEdited)
    newTargetsBeingEdited.splice(editingTargetIndex, 1, newTarget)
    this.setState({
      targetsBeingEdited: newTargetsBeingEdited
    })
  }
}

RfpTargets.propTypes = {
  targets: PropTypes.arrayOf(PropTypes.instanceOf(Point)),
  selectedTarget: PropTypes.instanceOf(Point),
  clickMapToAddTarget: PropTypes.bool
}

const mapStateToProps = (state) => ({
  targets: state.optimization.rfp.targets,
  selectedTarget: state.optimization.rfp.selectedTarget,
  clickMapToAddTarget: state.optimization.rfp.clickMapToAddTarget
})

const mapDispatchToProps = dispatch => ({
  addTargets: (lat, lng) => dispatch(RfpActions.addTargets(lat, lng)),
  removeTarget: indexToRemove => dispatch(RfpActions.removeTarget(indexToRemove)),
  replaceTarget: (index, target) => dispatch(RfpActions.replaceTarget(index, target)),
  setSelectedTarget: selectedTarget => dispatch(RfpActions.setSelectedTarget(selectedTarget)),
  setClickMapToAddTarget: clickMapToAddTarget => dispatch(RfpActions.setClickMapToAddTarget(clickMapToAddTarget))
})

const RfpTargetsComponent = wrapComponentWithProvider(reduxStore, RfpTargets, mapStateToProps, mapDispatchToProps)
export default RfpTargetsComponent
