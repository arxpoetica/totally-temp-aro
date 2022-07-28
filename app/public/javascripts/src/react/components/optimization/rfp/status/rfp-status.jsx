import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../../../redux-store'
import wrapComponentWithProvider from '../../../../common/provider-wrapped-component'
import RfpActions from '../rfp-actions'
import RfpStatusActions from './actions'
import RfpPlanList from './rfp-plan-list.jsx'
import RfpSubmitter from './rfp-submitter.jsx'
import RfpTemplateManager from './rfp-template-manager.jsx'

export class RfpStatus extends Component {
  render () {
    return <div className='container pt-5 pb-5 d-flex flex-column' style={{ height: '100%' }}>
      <h2>RFP Plans</h2>
      <ul className='nav nav-tabs mb-3'>
        {
          this.props.tabs.map(tab => (
            <li key={tab.id} className='nav-item'>
              <a
                id={`rfpStatusTab_${tab.id}`}
                className={`nav-link ${tab.id === this.props.selectedTabId ? 'active' : ''}`}
                href='#'
                onClick={() => this.props.setSelectedTabId(tab.id)}
              >
                {tab.description}
              </a>
            </li>
          ))
        }
      </ul>
      {this.renderActiveComponent()}
    </div>
  }

  renderActiveComponent () {
    switch (this.props.selectedTabId) {
      case 'LIST_PLANS':
        return <RfpPlanList />

      case 'SUBMIT_RFP':
        return <RfpSubmitter />

      case 'MANAGE_RFP_TEMPLATES':
        return <RfpTemplateManager />

      default:
        return <div>ERROR: Unknown tab selected</div>
    }
  }

  componentWillUnmount () {
    this.props.clearRfpState()
  }
}

RfpStatus.propTypes = {
  tabs: PropTypes.array,
  selectedTabId: PropTypes.string
}

const mapStateToProps = state => ({
  tabs: state.optimization.rfp.tabs,
  selectedTabId: state.optimization.rfp.selectedTabId
})

const mapDispatchToProps = dispatch => ({
  setSelectedTabId: selectedTabId => dispatch(RfpStatusActions.setSelectedTabId(selectedTabId)),
  clearRfpState: () => dispatch(RfpActions.clearRfpState())
})

const RfpStatusComponent = wrapComponentWithProvider(reduxStore, RfpStatus, mapStateToProps, mapDispatchToProps)
export default RfpStatusComponent
