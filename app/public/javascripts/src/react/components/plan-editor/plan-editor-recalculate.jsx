import React, { useState } from 'react'
import { connect } from 'react-redux'
import PlanEditorActions from './plan-editor-actions'
import Select from 'react-select'
import Loader from '../common/Loader.jsx'
import { selectStylesBlue } from '../../common/view-utils'
import AroHttp from '../../common/aro-http'
import PlanEditorSelectors from './plan-editor-selectors.js'
import cx from 'clsx'

const PlanEditorRecalculate = props => {

  const {
    transaction,
    isCalculatingSubnets,
    selectedSubnetId,
    recalculateSubnets,
    isRecalcSettled,
    fiberAnnotations,
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

  const recalculate = () => {
    if (Object.keys(fiberAnnotations).length > 0) {
      swal({
        title: 'Are you sure you want to recalculate?',
        text: `Any adjusted feeder fiber will lose it's attributes.`,
        type: 'warning',
        showCancelButton: true,
        closeOnConfirm: true,
        confirmButtonColor: '#fdbc80',
        confirmButtonText: 'Yes, recalculate',
        cancelButtonText: 'Oops, nevermind.',
      }, (confirm) => {
        if (confirm) recalculateSubnets(transaction.id, [selectedSubnetId])
      })	
    } else {
      recalculateSubnets( transaction.id, [selectedSubnetId])
    }
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
              className={cx("btn", 
                fiberAnnotations && Object.keys(fiberAnnotations).length > 0
                  ? "btn-outline-danger" 
                  : "btn-outline-success" )}
              onClick={() => recalculate()}
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
  fiberAnnotations: state.planEditor.fiberAnnotations,
})

const mapDispatchToProps = dispatch => ({
  // discardTransaction: transactionId => dispatch(PlanEditorActions.discardTransaction(transactionId)),
  recalculateSubnets: (transactionId, subnetIds) => dispatch(PlanEditorActions.recalculateSubnets(transactionId, subnetIds)),
})

export default connect(mapStateToProps, mapDispatchToProps)(PlanEditorRecalculate)
