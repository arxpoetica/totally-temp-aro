import React from 'react'
import { connect } from 'react-redux'
import ToolBarActions from '../header/tool-bar-actions'
import { displayModes } from './constants'

const DisplayModeButtons = (props) => {
  const {
    plan,
    planType,
    currentUser,
    displayModeButtons,
    selectedDisplayMode,
    setSelectedDisplayMode,
   } = props

  return (
    <>
      <div className="btn-group pull-left" role="group" aria-label="Mode buttons">
        {/* View Mode */}
        {displayModeButtons.VIEW &&
          <button
            type="button"
            className={`
              btn display-mode-button
              ${selectedDisplayMode !== displayModes.VIEW ? 'btn-light' : ''}
              ${selectedDisplayMode === displayModes.VIEW ? 'btn-primary' : ''}
            `}
            onClick={() => setSelectedDisplayMode(displayModes.VIEW)}
          >
            <div className="fa fa-2x fa-eye" data-toggle="tooltip" data-placement="bottom" title="View Mode" />
          </button>
        }

        {/* Analysis Mode */}
        {displayModeButtons.ANALYSIS && planType !== 'RING' && currentUser.perspective !== 'sales' &&
          <button
            type="button"
            className={`
              btn display-mode-button
              ${selectedDisplayMode !== displayModes.ANALYSIS ? 'btn-light' : ''}
              ${selectedDisplayMode === displayModes.ANALYSIS ? 'btn-primary' : ''}
            `}
            onClick={() => setSelectedDisplayMode(displayModes.ANALYSIS)}
          >
            <div className="fa fa-2x fa-gavel" data-toggle="tooltip" data-placement="bottom" title="Analysis Mode" />
          </button>
        }

        {/* Edit Rings */}
        {planType === 'RING' && currentUser.perspective !== 'sales' &&
          <button
            type="button"
            className={`
              btn display-mode-button
              ${selectedDisplayMode !== displayModes.EDIT_RINGS ? 'btn-light' : ''}
              ${selectedDisplayMode === displayModes.EDIT_RINGS ? 'btn-primary' : ''}
            `}
            onClick={() => setSelectedDisplayMode(displayModes.EDIT_RINGS)}
          >
            <div className="fa fa-2x fa-project-diagram" data-toggle="tooltip" data-placement="bottom" title="Edit Rings" />
          </button>
        }

        {/* Edit Plan */}
        {displayModeButtons.EDIT_PLAN && currentUser.perspective !== 'sales' &&
          <button
            type="button"
            className={`
              btn display-mode-button
              ${selectedDisplayMode !== displayModes.EDIT_PLAN ? 'btn-light' : ''}
              ${selectedDisplayMode === displayModes.EDIT_PLAN ? 'btn-primary' : ''}
            `}
            disabled={(!plan || plan.ephemeral || plan.planState === 'START_STATE') ? 'disabled' : null}
            onClick={() => setSelectedDisplayMode(displayModes.EDIT_PLAN)}
          >
            <div className="fa fa-2x fa-pencil-alt" data-toggle="tooltip" data-placement="bottom" title="Edit Plan" />
          </button>
        }
      </div>

      <div className="btn-group float-right">
        {/* Debugging Mode */}
        {displayModeButtons.DEBUG && currentUser.isAdministrator &&
          <button
            type="button"
            className={`
              btn display-mode-button
              ${selectedDisplayMode !== displayModes.DEBUG ? 'btn-light' : ''}
              ${selectedDisplayMode === displayModes.DEBUG ? 'btn-primary' : ''}
            `}
            onClick={() => setSelectedDisplayMode(displayModes.DEBUG)}
          >
            <div className="fa fa-2x fa-bug" data-toggle="tooltip" data-placement="bottom" title="Debugging Mode" />
          </button>
        }

        {/* Plan Settings Mode */}
        {displayModeButtons.PLAN_SETTINGS &&
          <button
            type="button"
            className={`
              btn display-mode-button
              ${selectedDisplayMode !== displayModes.PLAN_SETTINGS ? 'btn-light' : ''}
              ${selectedDisplayMode === displayModes.PLAN_SETTINGS ? 'btn-primary' : ''}
            `}
            onClick={() => setSelectedDisplayMode(displayModes.PLAN_SETTINGS)}
          >
            <div className="fa fa-2x fa-cog" data-toggle="tooltip" data-placement="bottom" title="Plan Settings Mode" />
          </button>
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

})

const mapDispatchToProps = (dispatch) => ({
  setSelectedDisplayMode: (value) => dispatch(ToolBarActions.selectedDisplayMode(value)),
})

export default connect(mapStateToProps, mapDispatchToProps)(DisplayModeButtons)
