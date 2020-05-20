/* global google, swal */
import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import dataEditActions from './data-edit-actions.js'
import planEditorActions from '../plan-editor/plan-editor-actions'
// import DeleteMenu from './maps-delete-menu.js'
import DropdownList from 'react-widgets/lib/DropdownList'
import './duct-edit.css'

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

    this.state = {
      selectedLib: null
    }
  }

  render () {
    this.drawLines()
    var revOrder = []
    Object.keys(this.props.ducts).sort().map((key) => (
      revOrder.unshift({ id: key, duct: this.props.ducts[key] })
    ))
    var jsx = []
    // jsx.push(<div key='title' onClick={(event) => { this.toggleSelect(null) }}>Ducts:</div>)
    revOrder.forEach((ductMeta) => {
      jsx.push(this.renderDuctRow(ductMeta.id, ductMeta.duct))
    })
    return (
      <React.Fragment>
        <div className="ei-header ei-no-pointer">Append to Library:</div>
        <div className="ei-items-contain">
          <div className='ei-property-item'>
            <div className='ei-property-label'>Library</div>
            <div className='ei-property-value'>
              <DropdownList
                data={this.props.fiberLibrarys}
                valueField='identifier'
                textField='name'
                value={this.state.selectedLib}
                readOnly={this.props.displayOnly}
                onChange={(val, event) => this.onLibChange(val, event)}
              />
            </div>
          </div>
        </div>
        <button onClick={() => this.onCommit()}
          disabled={(this.canCommit() ? null : 'disabled')}
        >Commit</button>
        <div className="ei-header ei-no-pointer">Ducts:</div>
        <div className="ei-items-contain">
          {jsx}
        </div>
      </React.Fragment>
    )
  }

  renderDuctRow (ductId, duct) {
    var onClick = (event) => { this.toggleSelect(ductId) }
    var classList = ''
    if (ductId === this.props.selectedDuctId) classList += ' selectedDuct'
    return (
      <div className='ei-property-item' key={ductId} id={ductId}>
        <div className={`ei-property-label ${classList}`} onClick={onClick}>{ductId}<br />{`${duct.geometry.length - 1} segments`}</div>
        <div className='ei-property-value'>
          <button
            id={`btnDuctDel_${ductId}`}
            className='btn btn-sm btn-outline-danger ring-del-btn'
            onClick={() => this.props.deleteDuct(ductId)}
            data-toggle='tooltip' data-placement='bottom' title='Delete'>
            <i className='fa ei-button-icon ng-scope fa-trash-alt' />
          </button>
        </div>
      </div>
    )
  }

  drawLines () {
    this.clearRendering()
    Object.keys(this.props.ducts).forEach(ductId => {
      const duct = this.props.ducts[ductId]
      if (duct.geometry.length > 0) {
        var isSelected = (ductId === this.props.selectedDuctId)
        
        var ductLine = new google.maps.Polyline({
          path: duct.geometry
        })
        
        if (isSelected) {
          ductLine.setOptions(this.selectedLineOptions)
          if (duct.geometry.length > 0) {
            var mapMarker = new google.maps.Marker({
              position: duct.geometry[duct.geometry.length - 1],
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 12,
                strokeWeight: 1,
                strokeColor: '#543500'
              },
              draggable: false,
              clickable: false
            })
            mapMarker.setMap(this.props.map.googleMaps)
            this.createdMapObjects.push(mapMarker)
          }
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

          // --- from 
          // var deleteMenu = new DeleteMenu();
          this.mapObjectListeners.push(
            google.maps.event.addListener(ductLinePath, 'rightclick', function(e) {
              // Check if click was on a vertex control point
              console.log(e)
              if (e.vertex == undefined) {
                return;
              }
              // deleteMenu.open(map, ductLinePath, e.vertex);
            })
          )
          // ---
        }

      }
    })
  }

  addPoint (point) {
    var newDuct = null
    if (!this.props.selectedDuctId) {
      newDuct = { geometry: [point] }
      this.props.newDuct(newDuct)
    } else {
      var selectedDuct = this.props.ducts[this.props.selectedDuctId]
      var newGeometry = selectedDuct.geometry.concat([point])
      newDuct = { ...selectedDuct, geometry: newGeometry }
      this.props.setDuct(this.props.selectedDuctId, newDuct)
    }
  }

  toggleSelect (ductId) {
    if (ductId === this.props.selectedDuctId) ductId = null
    this.props.setSelectedDuctId(ductId)
  }

  onLibChange (newVal, event) {
    this.setState({ selectedLib: newVal })
  }

  canCommit () {
    return (!this.props.displayOnly && this.state.selectedLib && !this.props.isEditProcessing)
  }

  onCommit () {
    console.log(this.state.selectedLib.identifier)
    //this.props.resumeOrCreateTransaction(this.props.plan.activePlan.id, this.props.user.loggedInUser.id)
    this.props.uploadDucts(this.state.selectedLib.identifier)
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
  ducts: state.dataEdit.ductEdit.ducts,
  fiberLibrarys: state.plan.dataItems.fiber.allLibraryItems,
  isEditProcessing: state.dataEdit.isEditProcessing
})

const mapDispatchToProps = dispatch => ({
  setSelectedDuctId: (ductId) => dispatch(dataEditActions.setSelectedDuctId(ductId)),
  deleteAllDucts: () => dispatch(dataEditActions.deleteAllDucts()),
  deleteDuct: (ductId) => dispatch(dataEditActions.deleteDuct(ductId)),
  newDuct: (duct) => dispatch(dataEditActions.newDuct(duct)),
  setDuct: (ductId, duct) => dispatch(dataEditActions.setDuct(ductId, duct)),
  uploadDucts: (libraryId) => dispatch(dataEditActions.uploadDucts(libraryId)),
  resumeOrCreateTransaction: (planId, userId) => dispatch(planEditorActions.resumeOrCreateTransaction(planId, userId))
})

const DuctEditComponent = wrapComponentWithProvider(reduxStore, DuctEdit, mapStateToProps, mapDispatchToProps)
export default DuctEditComponent
