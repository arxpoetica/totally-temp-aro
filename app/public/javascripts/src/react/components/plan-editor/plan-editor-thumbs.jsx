import React, { useState } from 'react'
import { connect } from 'react-redux'
import PlanEditorActions from './plan-editor-actions'
import cx from 'clsx'

const PlanEditorHeader = props => {

  const {
    equipments,
    features,
    selectedEditFeatureIds,
    selectedSubnetId,
    setSelectedSubnetId,
    deselectEditFeatureById,
  } = props

  function onClick(event, objectId) {
    event.stopPropagation()
    if (objectId === selectedSubnetId) { objectId = '' } // deselect
    if (!features[objectId]) { objectId = '' } // deselect
    setSelectedSubnetId(objectId)
  }

  function onClose(event, objectId) {
    event.stopPropagation()
    if (objectId === selectedSubnetId) { setSelectedSubnetId('') }
    deselectEditFeatureById(objectId)
  }

  return selectedEditFeatureIds.map(id => {

    const { feature } = features[id]
    const { iconUrl, label } = equipments[feature.networkNodeType]
    const { coordinates } = feature.geometry

    return (
    <div
      key={id}
      className={cx(
        'plan-editor-header',
        id === selectedSubnetId && 'selected',
      )}
      onClick={event => onClick(event, id)}
    >
      <div className="info">
        <img src={iconUrl} alt={label}/>
        <h2>{label}</h2>
      </div>
      <div className="subinfo">
        <div className="item">
          <div className="badge badge-dark">LATITUDE</div>
          {coordinates[1]}
        </div>
        <div className="item">
          <div className="badge badge-dark">LONGITUDE</div>
          {coordinates[0]}
        </div>
      </div>
      <button type="button" 
        className="btn btn-sm plan-editor-header-close" 
        aria-label="Close"
        onClick={event => onClose(event, id)}
      ><i className="fa fa-times"></i></button>
    </div>
    )
  })

}

const mapStateToProps = state => ({
  equipments: state.mapLayers.networkEquipment.equipments,
  features: state.planEditor.features,
  selectedEditFeatureIds: state.planEditor.selectedEditFeatureIds,
  selectedSubnetId: state.planEditor.selectedSubnetId,
})

const mapDispatchToProps = dispatch => ({
  setSelectedSubnetId: id => dispatch(PlanEditorActions.setSelectedSubnetId(id)),
  deselectEditFeatureById: id => dispatch(PlanEditorActions.deselectEditFeatureById(id)),
})

export default connect(mapStateToProps, mapDispatchToProps)(PlanEditorHeader)
