import React, { Component } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import { PropTypes } from 'prop-types'

export class ResourcePermissions extends Component {
  constructor (props) {
    super(props)
    // more here
  }

  render () {
    return <div>from react</div>
  }

}

// --- //

ResourcePermissions.propTypes = {
  /*
  rings: PropTypes.objectOf(PropTypes.instanceOf(Ring)),
  selectedRingId: PropTypes.number,
  plan: PropTypes.object,
  user: PropTypes.object,
  map: PropTypes.object
  */
}

const mapStateToProps = (state) => ({
  /*
  rings: state.ringEdit.rings,
  selectedRingId: state.ringEdit.selectedRingId,
  plan: state.plan,
  user: state.user,
  map: state.map,
  status: state.plan.activePlan && state.plan.activePlan.planState
  */
})

const mapDispatchToProps = dispatch => ({
  /*
  setSelectedRingId: ringId => dispatch(ringActions.setSelectedRingId(ringId)),
  newRing: (planId, userId) => dispatch(ringActions.newRing(planId, userId)),
  removeRing: (ringId, planId, userId) => dispatch(ringActions.removeRing(ringId, planId, userId)),
  removeNode: (ring, featureId, planId, userId) => dispatch(ringActions.removeNode(ring, featureId, planId, userId)),
  saveRingChangesToServer: (ring, planId, userId) => dispatch(ringActions.saveRingChangesToServer(ring, planId, userId)),
  renameRing: (ring, name, planId, userId) => dispatch(ringActions.renameRing(ring, name, planId, userId))
  */
})

const ResourcePermissionsComponent = wrapComponentWithProvider(reduxStore, ResourcePermissions, mapStateToProps, mapDispatchToProps)
export default ResourcePermissionsComponent