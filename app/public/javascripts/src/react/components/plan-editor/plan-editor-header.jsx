import React, { useState } from 'react'
import { connect } from 'react-redux'

const PlanEditorHeader = props => {

  // const [..., ...] = useState()
  // const handleChange = change => {}

  // FIXME: const { ARO_CLIENT } = configuration
  const ARO_CLIENT = 'aro'

  return (
    <>
      <div className="plan-editor-header">
        {/* above was ng-if $ctrl.getSelectedNetworkConfig() */}

        {/* was: $ctrl.getSelectedNetworkConfig().iconUrl */}
        {/* <img src={`/images/map_icons/${ARO_CLIENT}/fiber_distribution_terminal.png`} style="vertical-align: middle; padding-right: 10px;"/> */}
        {/* was $ctrl.getSelectedNetworkConfig().label */}
        <h2>Fiber Distribution Terminal (FDT)</h2>
        <div className="subinfo">
          {/* was $ctrl.selectedMapObjectLat */}
          <div className="item">lat: 47.48186436198969</div>
          {/* was $ctrl.selectedMapObjectLng */}
          <div className="item">long: -118.25462573755699</div>
        </div>
      </div>

      {/* see equipment properties editor for former logic / binding / events */}
      <div className="plan-editor-header">
        {/* <img src={} style="vertical-align:middle; padding-right: 10px"/> */}
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
      </div>
    </>
  )
}

const mapStateToProps = state => ({})
const mapDispatchToProps = dispatch => ({})
export default connect(mapStateToProps, mapDispatchToProps)(PlanEditorHeader)
