import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { displayModes } from './constants'
import ToolTip from '../common/tooltip.jsx'
import DisplayButton from './display-button.jsx'
import { constants } from '../plan-editor/shared'
const { DRAFT_STATES } = constants

const DisplayModeButtons = props => {
  const {
    plan,
    planType,
    currentUser,
    selectedDisplayMode,
    displayModeButtons,
    selection,
    draftsState,
    equipmentCosts
  } = props

  const [toolTip, setToolTip] = useState('')

  useEffect(() => {
    calculateIsDisabled()
  }, [
    JSON.stringify(equipmentCosts),
    JSON.stringify(selection.planTargetDescriptions),
    plan && plan.planState
  ])

  const calculateIsDisabled = () => {
    let baseMessage = 'Edit mode is only available for '
    if (!plan || plan.ephemeral) {
      baseMessage += 'a plan that has been saved, created, and run.'
    } else if (plan.planState !== 'COMPLETED') {
      baseMessage += 'a plan that has been run.'
    } else if (isMultipleServiceAreasOrCOs()) {
      baseMessage += 'one central office at a time.'
    } else {
      baseMessage = ''
    }

    setToolTip(baseMessage)
  }

  const disabledButton = () => {
    const editMode = selectedDisplayMode === (displayModes.EDIT_PLAN || displayModes.EDIT_RINGS)
    if (editMode && draftsState !== DRAFT_STATES.END_INITIALIZATION) {
      return 'disabled'
    }
  }

  const isMultipleServiceAreasOrCOs = () => {
    const centralOffice = equipmentCosts && equipmentCosts.find(equipment => equipment.costCode === "central_office")
    return (
      selection.planTargetDescriptions &&
        Object.keys(selection.planTargetDescriptions.serviceAreas).length > 1
    ) || (
      centralOffice && centralOffice.quantity > 1 && planType !== "RING"
    )
  }

  return (
    <>
      <div className="btn-group pull-left" role="group" aria-label="Mode buttons" style={{position: "absolute"}}>

        {displayModeButtons.VIEW &&
          <DisplayButton title="View Mode" mode="VIEW" disabled={disabledButton()}/>
        }

        {displayModeButtons.ANALYSIS && planType !== 'RING' && currentUser.perspective !== 'sales' &&
          <DisplayButton title="Analysis Mode" mode="ANALYSIS" disabled={disabledButton()} />
        }

        {planType === 'RING' && currentUser.perspective !== 'sales' &&
          <DisplayButton title="Edit Rings" mode="EDIT_RINGS" />
        }

        {displayModeButtons.EDIT_PLAN && currentUser.perspective !== 'sales' &&
          <ToolTip
            isActive={!!toolTip}
            toolTipText={toolTip}
            minWidth="350%"
          >
            <DisplayButton
              title="Edit Plan"
              mode="EDIT_PLAN"
              disabled={toolTip && 'disabled'}
            />
          </ToolTip>
        }
      </div>

      <div className="btn-group float-right">
        {displayModeButtons.DEBUG && currentUser.isAdministrator &&
          <DisplayButton title="Debugging Mode" mode="DEBUG" disabled={disabledButton()} />
        }

        {displayModeButtons.PLAN_SETTINGS &&
          <DisplayButton title="Plan Settings Mode" mode="PLAN_SETTINGS" disabled={disabledButton()} />
        }
      </div>
    </>
  )
}

const mapStateToProps = (state) => ({
  selectedDisplayMode: state.toolbar.rSelectedDisplayMode,
  displayModeButtons: Object.keys(state.toolbar.appConfiguration).length
    && state.toolbar.appConfiguration.perspective.showDisplayModeButtons,
  currentUser: state.user.loggedInUser ? state.user.loggedInUser : '',
  plan: state.plan.activePlan,
  planType: state.plan.activePlan && state.plan.activePlan.planType,
  selection: state.selection,
  draftsState: state.planEditor.draftsState,
  equipmentCosts: state.roicReports.roicResults && state.roicReports.roicResults.priceModel.equipmentCosts
})

const mapDispatchToProps = (dispatch) => ({})

export default connect(mapStateToProps, mapDispatchToProps)(DisplayModeButtons)
