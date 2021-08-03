import React, { useState } from 'react'
import { connect } from 'react-redux'
import PlanEditorActions from './plan-editor-actions'
import Select from 'react-select'
import Loader from '../common/Loader.jsx'
import { selectStylesBlue } from '../../common/view-utils'
import AroHttp from '../../common/aro-http'
import PlanEditorSelectors from './plan-editor-selectors.js'

const PlanEditorRecalculate = props => {

  const {
    transaction,
    isCalculatingSubnets,
    selectedSubnetId,
    recalculateSubnets,
    isRecalcSettled,
  } = props

  const [options, setOptions] = useState([
    { label: 'Auto assign to a boundary', value: 0 },
    { label: 'Delete this hub', value: 1 },
    { label: 'Recalculate Entire Plan', value: 2 },
    { label: 'Recalculate Boundaries', value: 3 },
    { label: 'Calculate and Place Hubs', value: 4 },
    { label: 'Calculate and Place Hubs & Terminals', value: 5 },
  ])

  const [selectedOption, setSelectedOption] = useState()

  const handleSelectChange = change => {
    console.log(change)
    setSelectedOption(change)
  }

  return (
    <div className="plan-editor-recalculate">

      {/* TODO: the following will come back when ready */}
      {/* FIXME: only show this group when subnets have actually changed */}
      {/* {selectedSubnetId &&
        <div className="actions">
          <h2>Recalculate Plan:</h2>
          <Select
            className="select"
            value={selectedOption}
            options={options}
            placeholder="Select Calculation Type"
            onChange={handleSelectChange}
            styles={selectStylesBlue}
          />
        </div>
      } */}

      <div className="plan-editor-buttons">

        {/* FIXME: only show this group when subnets have actually changed */}
        {selectedSubnetId &&
          <div className="group">
            <button
              type="button"
              className="btn btn-outline-success"
              onClick={() => recalculateSubnets(
                transaction.id,
                [selectedSubnetId]
              )}
              disabled={!isRecalcSettled}
            >
              Recalculate Hubs & Terminals
            </button>
            <Loader loading={isCalculatingSubnets} title="recalculating..."/>
          </div>
        }

        {/* TODO: the following will come back when ready */}
        {/* <div className="group">
          <button type="button" className="btn btn-outline-success">Reassign Households</button>
          <button type="button" className="btn btn-outline-danger">Reassign Connected Hub</button>
        </div> */}
        {/* TODO: the following will come back when ready */}
        {/* <div className="group">
          <h2>Reassign Households:</h2>
          <div className="group">
            <button type="button" className="btn btn-outline-secondary">Cancel</button>
            <button type="button" className="btn btn-primary">Save</button>
          </div>
        </div> */}
      </div>

    </div>
  )
}

const mapStateToProps = state => ({
  transaction: state.planEditor.transaction,
  subnets: state.planEditor.subnets,
  selectedSubnetId: state.planEditor.selectedSubnetId,
  isCalculatingSubnets: state.planEditor.isCalculatingSubnets,
  isRecalcSettled: PlanEditorSelectors.getIsRecalcSettled(state),
})

const mapDispatchToProps = dispatch => ({
  // discardTransaction: transactionId => dispatch(PlanEditorActions.discardTransaction(transactionId)),
  recalculateSubnets: (transactionId, subnetIds) => dispatch(PlanEditorActions.recalculateSubnets(transactionId, subnetIds)),
})

export default connect(mapStateToProps, mapDispatchToProps)(PlanEditorRecalculate)
