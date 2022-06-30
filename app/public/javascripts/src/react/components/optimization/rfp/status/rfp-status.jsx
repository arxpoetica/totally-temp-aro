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

    const {
      tabs,
      selectedTabId,
      setSelectedTabId,
      showAllRfpStatus,
      hideFullScreenContainer,
      showFullScreenContainer,
    } = this.props

    return (
      <>
        {showFullScreenContainer && showAllRfpStatus &&
          <div
            className="full-screen-container"
            style={{ animation: (showFullScreenContainer && showAllRfpStatus) ? 'fadeInDown 300ms' : 'fadeOutUp 300ms' }}
          >
            {/* A close button at the top right */}
            <div className="full-screen-container-close"
              onClick={() => hideFullScreenContainer()}
              data-toggle="tooltip"
              data-placement="bottom"
              title="Close"
            >
              <i className="fas fa-4x fa-times" />
            </div>
            <div className='container pt-5 pb-5 d-flex flex-column' style={{ height: '100%' }}>
              <h2>RFP Plans</h2>
              <ul className='nav nav-tabs mb-3'>
                {
                  tabs.map(tab => (
                    <li key={tab.id} className='nav-item'>
                      <a
                        id={`rfpStatusTab_${tab.id}`}
                        className={`nav-link ${tab.id === selectedTabId ? 'active' : ''}`}
                        href='#'
                        onClick={() => setSelectedTabId(tab.id)}
                      >
                        {tab.description}
                      </a>
                    </li>
                  ))
                }
              </ul>
              {this.renderActiveComponent()}
            </div>
          </div>
        }
        <style jsx>{`
          .full-screen-container {
            position: absolute;
            left: 0px;
            right: 0px;
            top: 0px;
            bottom: 0px;
            background-color: white;
            z-index: 4; /* Required because our sidebar has a z-index, which is required because of the google maps control */
          }
        
          .full-screen-container-close {
            position: absolute;
            padding: 0px 10px;
            margin: 10px;
            top: 0px;
            right: 0px;
            color: #777;
            cursor: pointer;
          }
        `}
      </style>
      </>
      
    )
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
  selectedTabId: state.optimization.rfp.selectedTabId,
  showFullScreenContainer: state.optimization.rfp.showFullScreenContainer,
  showAllRfpStatus: state.optimization.rfp.showAllRfpStatus,
})

const mapDispatchToProps = dispatch => ({
  setSelectedTabId: selectedTabId => dispatch(RfpStatusActions.setSelectedTabId(selectedTabId)),
  clearRfpState: () => dispatch(RfpActions.clearRfpState()),
  hideFullScreenContainer: () => dispatch(RfpActions.showOrHideFullScreenContainer(false)),
})

const RfpStatusComponent = wrapComponentWithProvider(reduxStore, RfpStatus, mapStateToProps, mapDispatchToProps)
export default RfpStatusComponent
