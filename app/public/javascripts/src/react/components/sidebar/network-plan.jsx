import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import AroHttp from '../../common/aro-http'
import ToolBarActions from '../header/tool-bar-actions'
import TopProgressBar from './top-progress-bar.jsx'
import { StateIcon } from '../common/state-icon.jsx'
import { displayModes } from './constants'

const displayTimestamp = epoch => {
  const datetime = new Date(epoch)
  const language = navigator.language || 'en-US'
  let display = datetime.toLocaleDateString(language) + ' '
  display += datetime
    .toLocaleTimeString(language, {
      hour: 'numeric',
      minute: '2-digit',
    })
    .split(' ')
    .join('')
  return display
}

const NetworkPlan = (props) => {
  const [userFullName, setUserFullName] = useState("N/A")
  const {
    activePlan: {
      planState,
      planType,
      createdBy,
      updatedDate, 
      createdDate,
      name,
      ephemeral,
      planErrors
    },
    selection,
    setSelectedDisplayMode
  } = props

  const planInProgress = planState === "STARTED"

  useEffect(() => {
    if (createdBy) {
      AroHttp.get(`/service/auth/users/${createdBy}`)
        .then((response) => {
          setUserFullName(response.data.fullName)
        })
        .catch(() => {
          setUserFullName("N/A")
        })
    }
  }, [createdBy])

  const getAlertState = () => {
    let state = ''
    if (planErrors) {
      const hasErrors = Object.values(planErrors).some(errorCategory => {
        return Object.values(errorCategory).length > 0
      })
  
      if (planInProgress) {
        state = 'loading'
      } else if (hasErrors) {
        if (Object.values(planErrors.PRE_VALIDATION).length > 0) {
          state = 'warn'
        }
        if (Object.values(planErrors.CANCELLED).length > 0) {
          state = 'warn'
        }
        if (Object.values(planErrors.RUNTIME_EXCEPTION).length > 0) {
          state = 'error'
        }
      } else if (planState === 'COMPLETED') {
        state = 'good'
      } else if (planState === 'CANCELED') {
        state = 'warn'
      }
    }

    return state
  }

  const getTitle = () => {
    let title = ephemeral ? "Existing Network" : name
    const serviceAreas = Object.values(selection.planTargetDescriptions.serviceAreas)
      if (serviceAreas.length === 1) {
      title = serviceAreas[0].code + ' - ' + title
    } else if (serviceAreas.length > 1) {
      title = 'Multiple - ' + title
    }
    return title
  }

  return (
    <div className="network-plan">
      <div
        className="plan-name"
        title={getTitle()}
        style={{ color: planInProgress ? '#1f7de6' : 'black' }}
      >
        {getAlertState() &&
          <StateIcon
            state={getAlertState()}
            onClick={() => setSelectedDisplayMode(
              planType === 'RING'
                ? displayModes.EDIT_RINGS
                : displayModes.ANALYSIS
            )}
          />
        }
        {getTitle()}
      </div>
      {name &&
        <div className="plan-metadata">
          {userFullName} |
          Created {new Date(createdDate).toLocaleDateString('en-US')} |
          Modified {displayTimestamp(updatedDate)}
        </div>
      }
      {planInProgress && <TopProgressBar />}

      <style jsx>{`
        .network-plan {
          margin: 0 0 12px;
        }
        .plan-name {
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          margin: 0 0 2px;
          color: black;
          font-size: 14px;
          font-weight: bold;
          text-overflow: ellipsis;
        }
        .plan-metadata {
          width: 100%;
          color: grey;
          font-size: 12px;
          text-align: center;
        }
      `}</style>
    </div>
  )
}

const mapStateToProps = (state) => ({
  activePlan: state.plan.activePlan || {},
  selection: state.selection
})

const mapDispatchToProps = (dispatch) => ({
  setSelectedDisplayMode: (value) => dispatch(ToolBarActions.selectedDisplayMode(value)),
})

export default connect(mapStateToProps, mapDispatchToProps)(NetworkPlan)
