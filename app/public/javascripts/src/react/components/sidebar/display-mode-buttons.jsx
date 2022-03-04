import React from 'react'
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
  } = props

  const disableEditPlan = () => {
    return !!(
      // Disable if no plan present
      !plan || plan.ephemeral ||
      // Disable if plan has not been ran
      plan.planState !== 'COMPLETED' ||
      (
        // TEMPORARY UNTIL WE ALLOW MULTIPLE SERVICE AREA PLAN EDIT
        // Disable if there is more than 1 service area in a plan
        selection.planTargetDescriptions &&
        Object.keys(selection.planTargetDescriptions.serviceAreas).length > 1
      )
    )
  }

  const editPlanToolTipText = () => {
    let baseMessage = 'Edit mode is only available for '
    if (!plan || plan.ephemeral) {
      baseMessage += 'a plan that has been saved, created, and run.'
    } else if (plan.planState !== 'COMPLETED') {
      baseMessage += 'a plan that has been run.'
    } else if (
      selection.planTargetDescriptions &&
      Object.keys(selection.planTargetDescriptions.serviceAreas).length > 1
    ) {
      baseMessage += 'one service area at a time.'
    } else {
      baseMessage = ''
    }

    return baseMessage
  }

  const disabledButton = () => {
    const editMode = selectedDisplayMode === (displayModes.EDIT_PLAN || displayModes.EDIT_RINGS)
    if (editMode && draftsState !== DRAFT_STATES.END_INITIALIZATION) {
      return 'disabled'
    }
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
          <ToolTip isActive={disableEditPlan()} toolTipText={editPlanToolTipText()}>
            <DisplayButton
              title="Edit Plan"
              mode="EDIT_PLAN"
              disabled={disableEditPlan() ? 'disabled' : null}
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
})

const mapDispatchToProps = (dispatch) => ({})

export default connect(mapStateToProps, mapDispatchToProps)(DisplayModeButtons)
