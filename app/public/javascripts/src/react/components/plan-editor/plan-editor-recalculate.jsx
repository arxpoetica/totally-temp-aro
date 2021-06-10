import React, { useState } from 'react'
import { connect } from 'react-redux'
import Select from 'react-select'
import { selectStylesBlue } from '../../common/view-utils'

const PlanEditorRecalculate = props => {

  const [options, setOptions] = useState([
    { label: 'Auto assign to a boundary', value: 0 },
    { label: 'Delete this hub', value: 1 },
  ])

  const [selectedOption, setSelectedOption] = useState()
  const handleChange = change => {
    console.log(change)
    setSelectedOption(change)
  }

  return (
    <div className="plan-editor-recalculate">
      <div className="actions">
        <h2>Recalculate Plan:</h2>
        <Select
          className="select"
          value={selectedOption}
          options={options}
          placeholder="Select Calculation Type"
          onChange={handleChange}
          styles={selectStylesBlue}
        />
      </div>
      <div className="checkboxes">
        <label>
          <input type="checkbox" className="checkboxfill layer-type-checkboxes"/>
          <span>Sticky assignment</span>
        </label>
        <label>
          <input type="checkbox" className="checkboxfill layer-type-checkboxes"/>
          <span>Auto recalculate</span>
        </label>
      </div>
    </div>
  )
}

const mapStateToProps = state => ({})
const mapDispatchToProps = dispatch => ({})
export default connect(mapStateToProps, mapDispatchToProps)(PlanEditorRecalculate)
