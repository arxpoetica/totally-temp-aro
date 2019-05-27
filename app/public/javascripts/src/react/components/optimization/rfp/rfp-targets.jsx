import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import Point from '../../../common/point'
import RfpActions from './rfp-actions'
import RfpFileImporter from './rfp-file-importer.jsx'
import RfpTargetsMap from './rfp-targets-map.jsx'
import Constants from '../../../common/constants'
import uuidv4 from 'uuid/v4'
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
      newTargetId: 1,
      newTargetLat: NEW_TARGET.lat,
      newTargetLng: NEW_TARGET.lng,
      indexToEditableTarget: {}
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
              <th>ID</th>
              <th>Latitude</th>
              <th>Longitude</th>
              <th style={{ width: '100px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Show current targets */}
            {
              this.props.targets.map((target, index) => (
                this.state.indexToEditableTarget[index]
                  ? this.renderTargetBeingEdited(target, index)
                  : this.renderRegularTarget(target, index)
              ))
            }
            {/* Show a row to add new targets */}
            {
              this.state.showNewTargetInputs
                ? <tr>
                  <td>
                    <input className='form-control' type='text' value={this.state.newTargetId} onChange={event => this.setState({ newTargetId: event.target.value })} />
                  </td>
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
      <td>{target.id}</td>
      <td>{this.limitLatLongPrecision(target.lat)}</td>
      <td>{this.limitLatLongPrecision(target.lng)}</td>
      <td>
        <button id={`btnEditTarget_${index}`} className='btn btn-sm btn-light' onClick={() => this.startEditingTarget(index)}>
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
    return <tr id={`trTarget_${index}`} key={index} onClick={event => this.props.setSelectedTarget(target)}
      className={'tr-rfp-target' + (this.props.selectedTarget === target ? ' selected-target-row ' : '')}>
      <td>
        <input
          id={`inpTargetId_${index}`}
          type='text'
          className='form-control form-control-sm'
          value={this.state.indexToEditableTarget[index].id}
          onChange={event => this.setEditingTargetProperty(index, 'id', event.target.value)}
        />
      </td>
      <td>
        <input
          id={`inpTargetLatitude_${index}`}
          type='text'
          className='form-control form-control-sm'
          value={this.state.indexToEditableTarget[index].lat}
          onChange={event => this.setEditingTargetProperty(index, 'lat', event.target.value)}
        />
      </td>
      <td>
        <input
          id={`inpTargetLongitude_${index}`}
          type='text'
          className='form-control form-control-sm'
          value={this.state.indexToEditableTarget[index].lng}
          onChange={event => this.setEditingTargetProperty(index, 'lng', event.target.value)}
        />
      </td>
      <td>
        <button id={`btnSaveTarget_${index}`} className='btn btn-sm btn-light'
          onClick={event => {
            this.saveEditingTarget(index)
            event.stopPropagation()
          }}>
          <i className='fa fa-save' />
        </button>
        <button id={`btnCancelEditTarget_${index}`} className='btn btn-sm btn-light' onClick={() => this.cancelEditingTarget(index)}>
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
      newTargetId: uuidv4(),
      newTargetLat: NEW_TARGET.lat,
      newTargetLng: NEW_TARGET.lng
    })
    this.props.setClickMapToAddTarget(false)
  }

  saveNewTarget () {
    this.props.addTargets([new Point(+this.state.newTargetLat, +this.state.newTargetLng, this.state.newTargetId)])
    this.setState({
      showNewTargetInputs: false,
      newTargetId: this.state.newTargetId + 1,
      newTargetLat: NEW_TARGET.lat,
      newTargetLng: NEW_TARGET.lng
    })
  }

  startEditingTarget (indexToEdit) {
    const existingTarget = this.props.targets[indexToEdit]
    var newTargetsBeingEdited = {
      ...this.state.indexToEditableTarget,
      [indexToEdit]: new Point(existingTarget.lat, existingTarget.lng, existingTarget.id)
    }
    this.setState({
      indexToEditableTarget: newTargetsBeingEdited
    })
  }

  cancelEditingTarget (indexToEdit) {
    var newTargetsBeingEdited = {
      ...this.state.indexToEditableTarget
    }
    delete newTargetsBeingEdited[indexToEdit]
    this.setState({
      indexToEditableTarget: newTargetsBeingEdited
    })
  }

  saveEditingTarget (indexToSave) {
    // Save the change to the redux store
    // Make sure that the lat/longs of the editing target are numbers
    const editedTarget = this.state.indexToEditableTarget[indexToSave]
    const newTarget = new Point(+editedTarget.lat, +editedTarget.lng, editedTarget.id)
    this.props.replaceTarget(indexToSave, newTarget)
    this.cancelEditingTarget(indexToSave)
  }

  setEditingTargetProperty (indexToEdit, property, value) {
    const oldTarget = this.state.indexToEditableTarget[indexToEdit]
    var newTarget = new Point(oldTarget.lat, oldTarget.lng, oldTarget.id)
    newTarget[property] = value
    var newTargetsBeingEdited = {
      ...this.state.indexToEditableTarget,
      [indexToEdit]: newTarget
    }
    this.setState({
      indexToEditableTarget: newTargetsBeingEdited
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
