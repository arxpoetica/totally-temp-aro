import React, { Component } from 'react'
// import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import ringActions from './ring-edit-actions.js'
import uuidv4 from 'uuid/v4'
// import Utilities from '../../../components/common/utilities'
import AroHttp from '../../common/aro-http'
import Ring from '../../common/ring.js'
import './ring-edit.css'


export class RingEdit extends Component {
  
  constructor (props) {
    super(props)
    this.createdMapObjects = []
  }
  
  render () {
    this.drawRings()
    return <div>
      <div className='m-2 p-2'>
        <button id='btnRingDoathing'
          className='btn btn-sm btn-light'
          onClick={() => this.requestAddNewRing()}>
          <i className='fas fa-pencil-alt' /> Add Ring
        </button>
      </div>
      <div className='m-2 p-2'>
        <h4>Rings</h4>
        <table className='table table-sm table-striped'>
          <tbody>
          {
            Object.keys(this.props.rings).map((key) => (
              this.renderRingRow(this.props.rings[key])
            ))
          }
          </tbody>
        </table>
      </div>
      <div className='m-2 p-2'>
        <button className="pull-left btn btn-primary button-export ng-scope"
                onClick={() => this.requestSubNet()}>
          <i className="fa fa-bolt"></i> Run
        </button>
      </div>
    </div>
  }
  
  renderRingRow (ring) {
    if (ring.id == this.props.selectedRingId){
      // selected ring
      return <tr key={ring.id}>
        <td className='ring-table-item-selected'> 
          <div className='ring-table-item-title ring-table-item-title-selected clearfix'>
            {ring.name}

            <button className="btn btn-sm btn-outline-danger ring-del-btn" 
                    onClick={() => this.requestDeleteRing(ring)}
                    data-toggle="tooltip" data-placement="bottom" title="Delete">
              <i className="fa ei-button-icon ng-scope fa-trash-alt"></i>
            </button>

          </div>
          <div className='ring-sub-table'>
            <table className='table table-sm table-striped'>
              <tbody>
                {
                  ring.nodes.map((node, index) => (
                    <tr className='m-2 p-2' key={ring.id+'_'+node.objectId}>
                      <td>
                        {node.objectId} {node.siteClli} 
                        <button className="btn btn-sm btn-outline-danger ring-del-btn" 
                                onClick={() => this.deleteNode(ring, node.objectId)}
                                data-toggle="tooltip" data-placement="bottom" title="Delete">
                          <i className="fa ei-button-icon ng-scope fa-trash-alt"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </td>
      </tr>
    }else{
      return <tr key={ring.id}>
        <td>
          <div onClick={() => this.props.setSelectedRingId(ring.id)}>
            {ring.name}
          </div>
        </td>
      </tr>
    }
  }
  

  requestAddNewRing () {
    //var ringId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)// ToDo: replace this with proper get ID
    //var ringId = uuidv4() // ToDo: use /src/components/common/utilitias.js > getUUID()
    //var ringId = Utilities.getUUID
    //var ring = new Ring(ringId)
    const planId = this.props.plan.activePlan.id
    const userId = this.props.user.loggedInUser.id
    this.props.newRing(planId, userId)
  }
  

  drawRings(){
    // clear prev lines
    this.clearRendering()

    for (let [ringId, ring] of Object.entries(this.props.rings)) {
      if (ring.nodes.length > 0){
        var pathCoords = []
        
        ring.nodes.forEach(node => {
          const coords = node.data.geometry.coordinates
          pathCoords.push({lat:coords[1],lng:coords[0]})
        })
        
        if (ringId == this.props.selectedRingId){
          var ringPath = new google.maps.Polyline({
            path: pathCoords,
            geodesic: true,
            strokeColor: '#FF1493',
            strokeOpacity: 0.4,
            strokeWeight: 400, 
            clickable: false,
            draggable: false
          })
          ringPath.setMap(this.props.map.googleMaps)
          this.createdMapObjects.push(ringPath)
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
    }
  }
  
  requestDeleteRing(ring){
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
    });
  }
  
  deleteNode(ring, nodeId){
    const planId = this.props.plan.activePlan.id
    const userId = this.props.user.loggedInUser.id
    this.props.removeNode(ring, nodeId, planId, userId)
  }

  requestSubNet(){
    var ringIds = []
    for (var key in this.props.rings) {
      ringIds.push(''+this.props.rings[key].id)
    }
    console.log(ringIds)
    const planId = this.props.plan.activePlan.id
    const userId = this.props.user.loggedInUser.id
    //this.props.calculateSubNet(ringIds, planId, userId)
    AroHttp.post(`/service/plan/${planId}/ring-cmd`, {ringIds: ringIds})
    .then(result => {
      //ToDo check for error
    }).catch(err => console.error(err))
  }

  clearRendering(){
    this.createdMapObjects.forEach(path => {
      path.setMap(null)
    })
    this.createdMapObjects = []
  }

  /*
  componentDidMount () {
    // set panel active = true
    console.log('------- ON')
  }
  */
  componentWillUnmount () {
    this.clearRendering()
  }
  
}

// --- //

RingEdit.propTypes = {
}

const mapStateToProps = (state) => ({
  rings: state.ringEdit.rings, 
  selectedRingId: state.ringEdit.selectedRingId, 
  plan: state.plan, 
  user: state.user, 
  map: state.map
})

const mapDispatchToProps = dispatch => ({
  setSelectedRingId: ringId => dispatch(ringActions.setSelectedRingId(ringId)), 
  newRing: (planId, userId) => dispatch(ringActions.newRing(planId, userId)), 
  removeRing: (ringId, planId, userId) => dispatch(ringActions.removeRing(ringId, planId, userId)),
  removeNode: (ring, featureId, planId, userId) => dispatch( ringActions.removeNode(ring, featureId, planId, userId) )
})

const RingEditComponent = wrapComponentWithProvider(reduxStore, RingEdit, mapStateToProps, mapDispatchToProps)
export default RingEditComponent
