import React, { useState } from 'react'
import { connect } from 'react-redux'

const PlanEditorHeader = props => {

  const {
    selectedFeatureId,
    equipments,
    features,
  } = props

  const isSelected = props.isSelected || false

  const { feature } = features[selectedFeatureId]
  const equipment = equipments[feature.networkNodeType]
  const { coordinates } = feature.geometry

  // const [..., ...] = useState()
  // const handleChange = change => {}

  function onClick (event) {
    //event.preventDefault()
    event.stopPropagation()
    if (props.onClick) {
      props.onClick(event, selectedFeatureId)
    }
  }

  function onClose (event) {
    //event.preventDefault()
    event.stopPropagation()
    if (props.onClose) {
      props.onClose(event, selectedFeatureId)
    }
  }

  return (
    <div className={`plan-editor-header 
        ${isSelected ? "plan-editor-header-selected" : ""}
        ${props.onClick ? "plan-editor-use-pointer" : ""}
      `}
      onClick={event => onClick(event)}
    >
      <div className="info">
        <img src={equipment.iconUrl} alt={equipment.label}/>
        <h2>{equipment.label}</h2>
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
      {props.onClose 
        ? <button type="button" 
            className="btn btn-sm plan-editor-header-close" 
            aria-label="Close"
            onClick={event => onClose(event)}
          ><i className="fa fa-times"></i></button>
        : null
      }
    </div>
  )
}

const mapStateToProps = state => ({
  equipments: state.mapLayers.networkEquipment.equipments,
  features: state.planEditor.features,
})
const mapDispatchToProps = dispatch => ({})
export default connect(mapStateToProps, mapDispatchToProps)(PlanEditorHeader)
