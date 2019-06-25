import React, { Component } from 'react'
// import { PropTypes } from 'prop-types'
import reduxStore from '../../../../../redux-store'
import wrapComponentWithProvider from '../../../../common/provider-wrapped-component'
// import RfpActions from '../rfp-actions'
import RfpPlanList from './rfp-plan-list.jsx'

export class RfpStatus extends Component {
  render () {
    return <RfpPlanList />
  }
}

RfpStatus.propTypes = {
}

const mapStateToProps = state => ({
})

const mapDispatchToProps = dispatch => ({
})

const RfpStatusComponent = wrapComponentWithProvider(reduxStore, RfpStatus, mapStateToProps, mapDispatchToProps)
export default RfpStatusComponent
