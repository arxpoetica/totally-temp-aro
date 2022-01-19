/* global google, swal */
import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import { PropTypes } from 'prop-types'
import { createSelector } from 'reselect'
import ringActions from './ring-edit-actions.js'
import './ring-edit.css'
import RingStatusTypes from './constants'
import Ring from '../../common/ring'
// import RingOptionsBasic from './ring-options-basic.jsx'
// import RingOptionsConnectivityDefinition from './ring-options-connectivity-definition.jsx'

export class RingEdit extends Component {
  constructor (props) {
    super(props)

    this.createdMapObjects = []
    this.mapObjectListeners = []
    this.canEdit = true
  }

  render () {
    this.canEdit = (this.props.status === RingStatusTypes.START_STATE)
    this.drawRings()
    return <div>
      {this.renderAddButton()}
      <div className='m-2 p-2'>
        <h4>Rings</h4>
        <table className='table table-sm table-striped'>
          <tbody>
            {this.renderRingRows(this.props.rings)}
          </tbody>
        </table>
      </div>
      {/*
      <RingOptionsBasic initialValues={this.props.ringOptionsBasic} enableReinitialize />
      <RingOptionsConnectivityDefinition enableReinitialize />
      */}
    </div>
  }

  renderAddButton () {
    if (this.canEdit) {
      return <div className='m-2 p-2'>
        <button id='btnRingNewRing'
          className='btn btn-sm btn-light'
          onClick={() => this.requestAddNewRing()}>
          <i className='fas fa-pencil-alt' /> Add Ring
        </button>
      </div>
    } else {
      return ''
    }
  }

  renderRingRows (rings) {
    // reverse order, new ones first
    var revOrder = []
    Object.keys(rings).sort().map((key) => (
      revOrder.unshift(rings[key])
    ))
    var jsx = []
    revOrder.forEach((ring) => {
      jsx.push(this.renderRingRow(ring))
    })
    return jsx
  }

  renderRingRow (ring) {
    if (ring.id === this.props.selectedRingId) {
      // selected ring
      return <tr key={ring.id}>
        <td className='ring-table-item-selected'>
          <div className='ring-table-item-title ring-table-item-title-selected clearfix'>
            {ring.name}

            {this.canEdit
              ? <button
                id={`btnRingDel_${ring.id}`}
                className='btn btn-sm btn-outline-danger ring-del-btn'
                onClick={() => this.requestDeleteRing(ring)}
                data-toggle='tooltip' data-placement='bottom' title='Delete'>
                <i className='fa ei-button-icon ng-scope fa-trash-alt' />
              </button>
              : null
            }

            {this.canEdit
              ? <input
                id={`inpRingName_${ring.id}`}
                type='text'
                className='form-control form-control-sm ring-text-inp'
                placeholder='rename'
                onBlur={event => this.renameRing(ring.id, event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    this.renameRing(ring.id, event.target.value)
                  }
                }}
              />
              : null
            }

          </div>
          <div className='ring-sub-table'>
            <table className='table table-sm table-striped'>
              <tbody>
                {
                  ring.nodes.map((node, index) => (
                    <tr className='m-2 p-2' key={ring.id + '_' + node.objectId}>
                      <td>
                        {node.siteClli || node.objectId}

                        {this.canEdit
                          ? <button id={`btnNodeDel_${ring.id}-${node.objectId}`} className='btn btn-sm btn-outline-danger ring-del-btn'
                            onClick={() => this.deleteNode(ring, node.objectId)}
                            data-toggle='tooltip' data-placement='bottom' title='Delete'>
                            <i className='fa ei-button-icon ng-scope fa-trash-alt' />
                          </button>
                          : null
                        }

                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </td>
      </tr>
    } else {
      return <tr key={ring.id}>
        <td>
          <div id={`btnRingSelect_${ring.id}`} onClick={() => this.props.setSelectedRingId(ring.id)}>
            {ring.name}
          </div>
        </td>
      </tr>
    }
  }

  requestAddNewRing () {
    const planId = this.props.plan.activePlan.id
    const userId = this.props.user.loggedInUser.id
    this.props.newRing(planId, userId)
  }

  renameRing (ringId, val) {
    const planId = this.props.plan.activePlan.id
    const userId = this.props.user.loggedInUser.id
    this.props.renameRing(this.props.rings[ringId], val, planId, userId)
  }

  drawRings () {
    // clear prev lines
    this.clearRendering()

    // for (let [ringId, ring] of Object.entries(this.props.rings)) {
    Object.keys(this.props.rings).forEach(ringId => {
      const ring = this.props.rings[ringId]
      ringId = parseInt(ringId)
      if (ring.nodes.length > 0) {
        var pathCoords = []

        ring.nodes.forEach(node => {
          const coords = node.data.geometry.coordinates
          pathCoords.push({ lat: coords[1], lng: coords[0] })
        })

        var polygonOptions = {
          strokeColor: '#888888',
          strokeOpacity: 0.8,
          strokeWeight: 1,
          fillColor: '#888888',
          fillOpacity: 0.3,
          editable: false
        }

        if (ringId === this.props.selectedRingId) {
          polygonOptions = {
            strokeColor: '#FF1493',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#FF1493',
            fillOpacity: 0.4,
            editable: this.canEdit
          }
        }

        ring.linkData.forEach(link => {
          var polygon = new google.maps.Polygon({
            paths: link.geom,
            clickable: false,
            draggable: false
          })
          polygon.setOptions(polygonOptions)
          polygon.setMap(this.props.map.googleMaps)
          this.createdMapObjects.push(polygon)
          if (ringId === this.props.selectedRingId) {
            const planId = this.props.plan.activePlan.id
            const userId = this.props.user.loggedInUser.id
            var onPathChange = (path) => {
              var newPath = []
              var vertices = polygon.getPath()

              for (var i = 0; i < vertices.getLength(); i++) {
                newPath.push(vertices.getAt(i))
              }
              link.geom = newPath
              this.props.saveRingChangesToServer(ring, planId, userId)
            }

            var polygonPath = polygon.getPath()
            this.mapObjectListeners.push(
              google.maps.event.addListener(polygonPath, 'insert_at', onPathChange)
            )
            this.mapObjectListeners.push(
              google.maps.event.addListener(polygonPath, 'remove_at', onPathChange)
            )
            this.mapObjectListeners.push(
              google.maps.event.addListener(polygonPath, 'set_at', onPathChange)
            )
          }
        })

        if (ringId === this.props.selectedRingId) {
          if (ring.nodes.length > 0) {
            const coords = ring.nodes[0].data.geometry.coordinates
            var mapMarker = new google.maps.Marker({
              position: new google.maps.LatLng(coords[1], coords[0]),
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 22,
                strokeWeight: 2,
                strokeColor: '#543500'
              },
              draggable: false,
              clickable: false,
              optimized: !ARO_GLOBALS.MABL_TESTING,
            })
            mapMarker.setMap(this.props.map.googleMaps)
            this.createdMapObjects.push(mapMarker)
          }
        }

        var ringPath = new google.maps.Polyline({
          path: pathCoords,
          geodesic: true,
          strokeColor: '#543500',
          strokeOpacity: 1.0,
          strokeWeight: 1,
          clickable: false,
          draggable: false
        })
        ringPath.setMap(this.props.map.googleMaps)
        this.createdMapObjects.push(ringPath)
      }
    })
  }

  requestDeleteRing (ring) {
    swal({
      title: 'Delete Ring?',
      text: 'Are you sure you want to delete Ring: ' + ring.name + '?',
      type: 'warning',
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'No',
      showCancelButton: true,
      closeOnConfirm: true
    }, (doDelete) => {
      if (doDelete) {
        const planId = this.props.plan.activePlan.id
        const userId = this.props.user.loggedInUser.id
        this.props.removeRing(ring.id, planId, userId)
      }
    })
  }

  deleteNode (ring, nodeId) {
    const planId = this.props.plan.activePlan.id
    const userId = this.props.user.loggedInUser.id
    this.props.removeNode(ring, nodeId, planId, userId)
  }

  clearRendering () {
    this.createdMapObjects.forEach(path => {
      path.setMap(null)
    })
    this.createdMapObjects = []

    this.mapObjectListeners.forEach(listener => {
      listener.remove()
    })
    this.mapObjectListeners = []
  }

  selectNewestRing () {
    var ringId = Object.keys(this.props.rings).sort().pop()
    this.props.setSelectedRingId(ringId)
  }

  componentDidMount () {
    if (!this.props.selectedRingId) {
      this.selectNewestRing()
    }
  }

  componentWillUnmount () {
    this.clearRendering()
  }
}

// --- //

RingEdit.propTypes = {
  rings: PropTypes.objectOf(PropTypes.instanceOf(Ring)),
  selectedRingId: PropTypes.number,
  plan: PropTypes.object,
  user: PropTypes.object,
  map: PropTypes.object
}

const mapStateToProps = (state) => ({
  rings: state.ringEdit.rings,
  selectedRingId: state.ringEdit.selectedRingId,
  plan: state.plan,
  user: state.user,
  map: state.map,
  status: state.plan.activePlan && state.plan.activePlan.planState,
  ringOptionsBasic: state.ringEdit.aroNetworkConstraints
})

const mapDispatchToProps = dispatch => ({
  setSelectedRingId: ringId => dispatch(ringActions.setSelectedRingId(ringId)),
  newRing: (planId, userId) => dispatch(ringActions.newRing(planId, userId)),
  removeRing: (ringId, planId, userId) => dispatch(ringActions.removeRing(ringId, planId, userId)),
  removeNode: (ring, featureId, planId, userId) => dispatch(ringActions.removeNode(ring, featureId, planId, userId)),
  saveRingChangesToServer: (ring, planId, userId) => dispatch(ringActions.saveRingChangesToServer(ring, planId, userId)),
  renameRing: (ring, name, planId, userId) => dispatch(ringActions.renameRing(ring, name, planId, userId))
})

const RingEditComponent = wrapComponentWithProvider(reduxStore, RingEdit, mapStateToProps, mapDispatchToProps)
export default RingEditComponent
