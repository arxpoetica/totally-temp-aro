import React, { useState } from 'react'
import { connect } from 'react-redux'
import cx from 'clsx'
import PlanEditorActions from './plan-editor-actions'
import PlanEditorSelectors from './plan-editor-selectors'
import { getIconUrl } from './shared'
import FiberThumbs from './plan-editor-fiber-thumbs.jsx'

const PlanEditorHeader = props => {

  const {
    equipments,
    features,
    selectedEditFeatureIds,
    selectedSubnetId,
    locationCounts,
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

  return (
    <>
      {selectedEditFeatureIds.map(id => {

        const { feature } = features[id]
        const { label } = equipments[feature.networkNodeType]
        const { coordinates } = feature.geometry

        return (
        <div
          key={id}
          className={cx(
            'plan-editor-thumb',
            id === selectedSubnetId && 'selected',
          )}
          onClick={event => onClick(event, id)}
        >
          <div className="info">
            <img src={getIconUrl(feature, props)} alt={label}/>
            <h2>{label}</h2>
          </div>
          {locationCounts[id] > 0 && <p className="household-connections">Household connections: {locationCounts[id]}</p>}
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
            className="btn btn-sm plan-editor-thumb-close" 
            aria-label="Close"
            onClick={event => onClose(event, id)}
          ><i className="fa fa-times"></i></button>
        </div>
        )
      })}
      <FiberThumbs />
    </>

  )

}

const mapStateToProps = state => ({
  ARO_CLIENT: state.configuration.system.ARO_CLIENT,
  equipments: state.mapLayers.networkEquipment.equipments,
  features: state.planEditor.features,
  selectedEditFeatureIds: state.planEditor.selectedEditFeatureIds,
  selectedSubnetId: state.planEditor.selectedSubnetId,
  locationAlerts: PlanEditorSelectors.getAlertsForSubnetTree(state),
  locationCounts: PlanEditorSelectors.getLocationCounts(state),
})

const mapDispatchToProps = dispatch => ({
  setSelectedSubnetId: id => dispatch(PlanEditorActions.setSelectedSubnetId(id)),
  deselectEditFeatureById: id => dispatch(PlanEditorActions.deselectEditFeatureById(id)),
})

export default connect(mapStateToProps, mapDispatchToProps)(PlanEditorHeader)
