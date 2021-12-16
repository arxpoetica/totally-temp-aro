import React from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'

export const NetworkPlan = (props) => {
  const { activePlan, perspective, toolBarColor } = props
  const { name, ephemeral } = activePlan

  return (
    <div className="network-plan" style={{ backgroundColor: `${toolBarColor}` }}>
      {/* For ephemeral plans, the name has not been set by the user */}
      {ephemeral && perspective === 'admin'
        && <div className="ephemeral">Existing Network</div>
      }
      {/* For saved plans, display the plan name only */}
      {!ephemeral
        && <div className="non-ephemeral" title={name}>{name}</div>
      }
    </div>
  )
}

const mapStateToProps = (state) => ({
  activePlan: state.plan.activePlan !== null && state.plan.activePlan,
  perspective: state.user.loggedInUser && state.user.loggedInUser.perspective,
  toolBarColor: state.toolbar.appConfiguration.toolbar && state.toolbar.appConfiguration.toolbar.toolBarColor,
})

export default wrapComponentWithProvider(reduxStore, NetworkPlan, mapStateToProps, null)
