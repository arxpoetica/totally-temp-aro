/* global google, swal */
import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import dataEditActions from './data-edit-actions.js'

export class DuctEdit extends Component {
  constructor (props) {
    super(props)

    this.createdMapObjects = []
    this.mapObjectListeners = []
    // this.mapClickListener = null

    this.selectedLineOptions = {
      geodesic: true,
      strokeColor: '#FF1493',
      strokeOpacity: 1.0,
      strokeWeight: 2,
      clickable: false,
      draggable: false,
      editable: true
    }

    this.lineOptions = {
      geodesic: true,
      strokeColor: '#543500',
      strokeOpacity: 1.0,
      strokeWeight: 1,
      clickable: false,
      draggable: false,
      editable: false
    }
  }

  render () {
    this.drawLines()
    var revOrder = []
    Object.keys(this.props.ducts).sort().map((key) => (
      revOrder.unshift(this.props.ducts[key])
    ))
    var jsx = []
    jsx.push(<div key='title'>Ducts:</div>)
    revOrder.forEach((duct) => {
      jsx.push(this.renderDuctRow(duct))
    })
    return jsx
  }

  renderDuctRow (duct) {
    return (
      <div key={duct.id} id={duct.id} onClick={this.props.setSelectedDuctId(duct.id)}>
        {duct.geometry.length} delete
      </div>
    )
  }

  drawLines () {
    this.clearRendering()
    Object.keys(this.props.ducts).forEach(ductId => {
      console.log(this.props.ducts)
      const duct = this.props.ducts[ductId]
      console.log(duct)
      if (duct.geometry.length > 0) {
        var isSelected = (ductId === this.props.selectedDuctId)
        
        var ductLine = new google.maps.Polyline({
          path: duct.geometry
        })
        
        if (isSelected) {
          ductLine.setOptions(this.selectedLineOptions)
        } else {
          ductLine.setOptions(this.lineOptions)
        }
        
        ductLine.setMap(this.props.map.googleMaps)
        this.createdMapObjects.push(ductLine)

        if (isSelected) {
          var onPathChange = (path) => {
            var newPath = []
            var vertices = ductLine.getPath()

            for (var i = 0; i < vertices.getLength(); i++) {
              newPath.push(vertices.getAt(i))
            }
            
            var newDuct = { ...duct, geometry: newPath }
            this.props.setDuct(ductId, newDuct)
          }

          var ductLinePath = ductLine.getPath()
          this.mapObjectListeners.push(
            google.maps.event.addListener(ductLinePath, 'insert_at', onPathChange)
          )
          this.mapObjectListeners.push(
            google.maps.event.addListener(ductLinePath, 'remove_at', onPathChange)
          )
          this.mapObjectListeners.push(
            google.maps.event.addListener(ductLinePath, 'set_at', onPathChange)
          )
        }

      }
    })
  }

  addPoint (point) {
    var newDuct = null
    if (!this.props.selectedDuctId) {
      newDuct = {geometry: [point]}
      this.props.newDuct(newDuct)
    } else {
      var selectedDuct = this.props.ducts[this.props.selectedDuctId]
      var newGeometry = selectedDuct.geometry.concat([point])
      newDuct = { ...selectedDuct, geometry: newGeometry }
      this.props.setDuct(this.props.selectedDuctId, newDuct)
    }
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
  /*
  selectNewestRing () {
    var ringId = Object.keys(this.props.rings).sort().pop()
    this.props.setSelectedRingId(ringId)
  }
  */
  componentDidMount () {
    /*
    if (!this.props.selectedRingId) {
      this.selectNewestRing()
    }
    */
    this.mapClickListener = this.props.map.googleMaps.addListener('click', event => this.addPoint(event.latLng))
  }

  componentWillUnmount () {
    this.clearRendering()
    this.mapClickListener.remove()
  }
}

const mapStateToProps = (state) => ({
  plan: state.plan,
  user: state.user,
  map: state.map,
  selectedDuctId: state.dataEdit.ductEdit.selectedDuctId,
  ducts: state.dataEdit.ductEdit.ducts
})

const mapDispatchToProps = dispatch => ({
  setSelectedDuctId: (ductId) => dispatch(dataEditActions.setSelectedDuctId(ductId)),
  deleteAllDucts: () => dispatch(dataEditActions.deleteAllDucts()),
  newDuct: (duct) => dispatch(dataEditActions.newDuct(duct)),
  setDuct: (ductId, duct) => dispatch(dataEditActions.setDuct(ductId, duct))
})

const DuctEditComponent = wrapComponentWithProvider(reduxStore, DuctEdit, mapStateToProps, mapDispatchToProps)
export default DuctEditComponent
