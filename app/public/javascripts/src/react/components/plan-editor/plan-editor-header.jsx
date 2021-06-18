import React, { useState } from 'react'
import { connect } from 'react-redux'

const PlanEditorHeader = props => {

  const {
    selectedFeatureId,
    equipments,
    features,
  } = props

  const { feature } = features[selectedFeatureId]
  const equipment = equipments[feature.networkNodeType]
  const { coordinates } = feature.geometry

  // const [..., ...] = useState()
  // const handleChange = change => {}

  return (
    <>

      {/* <div className="image-sample">
        {equipments && Object.entries(equipments).map(([key, definition]) => 
          <img key={key} src={definition.iconUrl} alt={definition.label} />
        )}
      </div> */}

      <div className="plan-editor-header">
        <div className="info">
          <img src={equipment.iconUrl} alt={equipment.label}/>
          <h2>{equipment.label}</h2>
        </div>
        <div className="subinfo">
          <div className="item">lat: {coordinates[1]}</div>
          <div className="item">long: {coordinates[0]}</div>
        </div>
      </div>

      {/* see equipment properties editor for former logic / binding / events */}
      {/* <div className="plan-editor-header">
        <img src={} style="vertical-align:middle; padding-right: 10px"/>
        <h2>Fiber Distribution Terminal (FDT)</h2>
        <div className="subinfo">
          <label className="item">
            <div className="badge badge-dark">LATITUDE</div>
            <input type="number" defaultValue="47.48186436198969" className="form-control form-control-sm" step="0.000001"/>
          </label>
          <label className="item">
            <div className="badge badge-dark">LONGITUDE</div>
            <input type="number" defaultValue="-118.25462573755699" className="form-control form-control-sm" step="0.000001"/>
          </label>
        </div>
      </div> */}
    </>
  )
}

const mapStateToProps = state => ({
  equipments: state.mapLayers.networkEquipment.equipments,
  features: state.planEditor.features,
})
const mapDispatchToProps = dispatch => ({})
export default connect(mapStateToProps, mapDispatchToProps)(PlanEditorHeader)
