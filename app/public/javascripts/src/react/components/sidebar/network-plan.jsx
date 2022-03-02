import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import AroHttp from '../../common/aro-http'
import TopProgressBar from './top-progress-bar.jsx'
import './network-plan.css'

const NetworkPlan = (props) => {
  const [userFullName, setUserFullName] = useState("N/A")
  const {
    activePlan: {
      planState,
      createdBy,
      updatedDate, 
      createdDate,
      name,
      ephemeral
    },
    selection
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
    <div className="network-plan" style={{ paddingBottom: ephemeral && "10px" }}>
      <div
        className="plan-name"
        title={getTitle()}
        style={{ color: planInProgress ? "#1f7de6" : "black" }}
      >
        {getTitle()}
      </div>
      {name &&
        <div className="plan-metadata" style={{ marginBottom: !planInProgress && "10px" }}>
          {userFullName} |
          Created {new Date(createdDate).toLocaleDateString('en-US')} |
          Modified {new Date(updatedDate).toLocaleDateString('en-US')}
        </div>
      }
      {planInProgress && <TopProgressBar /> }
    </div>
  )
}

const mapStateToProps = (state) => ({
  activePlan: state.plan.activePlan || {},
  selection: state.selection
})

export default connect(mapStateToProps, null)(NetworkPlan)