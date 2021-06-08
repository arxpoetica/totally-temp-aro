import React, { useState } from 'react'
import { connect } from 'react-redux'

const PlanEditorActions = props => {

  // const [..., ...] = useState()
  // const handleChange = change => {}
  return (
    <div className="plan-editor-buttons">
      <div className="group">
        <button type="button" className="btn btn-outline-success">Reassign Households</button>
        <button type="button" className="btn btn-outline-danger">Reassign Connected Hub</button>
      </div>
      <div className="group">
        <h2>Reassign Households:</h2>
        <div className="group">
          <button type="button" className="btn btn-outline-secondary">Cancel</button>
          <button type="button" className="btn btn-primary">Save</button>
        </div>
      </div>
    </div>
  )
}

const mapStateToProps = state => ({})
const mapDispatchToProps = dispatch => ({})
export default connect(mapStateToProps, mapDispatchToProps)(PlanEditorActions)
