import React from 'react'
import { connect } from 'react-redux'
import { Tabs } from '@mantine/core'
import { IconStar, IconArchive } from '@tabler/icons'
import { Rfps } from './rfps.jsx'
import { RfpLegacy } from '../status/rfp-legacy.jsx'
import RfpActions from '../rfp-actions'

const TABS = {
  NEW: {
    description: 'New RFPs',
    component: <Rfps/>,
    icon: <IconStar size={20} stroke={2}/>
  },
  LEGACY: {
    description: 'Legacy RFPs',
    component: <RfpLegacy/>,
    icon: <IconArchive size={20} stroke={2}/>
  },
}

function _RfpModal(props) {

  const {
    showAllRfpStatus,
    showFullScreenContainer,
    hideFullScreenContainer,
    clearRfpState,
  } = props

  return (
    showFullScreenContainer && showAllRfpStatus
    ? <div className="rfp-modal">

      {/* A close button at the top right */}
      <div
        className="rfp-close"
        onClick={() => {
          hideFullScreenContainer()
          clearRfpState()
        }}
        data-toggle="tooltip"
        data-placement="bottom"
      >
        <i className="fas fa-4x fa-times" />
      </div>

      <div className="content">
        <h2 className="title h1">RFPs</h2>
        {/* TODO: genericize this into a component */}
        <Tabs defaultValue="NEW" keepMounted={false}>
          <Tabs.List>
            {Object.entries(TABS).map(([tabId, { description, icon }]) =>
              <Tabs.Tab key={tabId} value={tabId} icon={icon}>
                {description}
              </Tabs.Tab>
            )}
          </Tabs.List>
          {Object.entries(TABS).map(([tabId, { component }]) =>
            <Tabs.Panel key={tabId} value={tabId} pt="xs">
              <div className="panel">
                {component}
              </div>
            </Tabs.Panel>
          )}
        </Tabs>
      </div>

      <style jsx>{`
        .rfp-modal {
          position: absolute;
          left: 0px;
          right: 0px;
          top: 0px;
          bottom: 0px;
          background-color: white;
          z-index: 4; /* Required because our sidebar has a z-index, which is required because of the google maps control */
        }
        .rfp-close {
          position: absolute;
          padding: 0px 10px;
          margin: 10px;
          top: 0px;
          right: 0px;
          color: #777;
          cursor: pointer;
        }
        .title {
          margin: 0;
        }
        .content {
          display: grid;
          grid-template-rows: auto 1fr;
          gap: 20px;
          max-width: 1000px;
          height: 100%;
          margin: 0 auto;
          padding: 50px;
        }
        .rfp-modal :global(.mantine-Tabs-root) {
          display: grid;
          grid-template-rows: auto 1fr;
          gap: 10px;
        }
        .panel {
          height: 100%;
        }
      `}</style>
    </div>
    : null
  )
}

const mapStateToProps = state => ({
  showFullScreenContainer: state.optimization.rfp.showFullScreenContainer,
  showAllRfpStatus: state.optimization.rfp.showAllRfpStatus,
})

const mapDispatchToProps = dispatch => ({
  clearRfpState: () => dispatch(RfpActions.clearRfpState()),
  hideFullScreenContainer: () => dispatch(RfpActions.showOrHideFullScreenContainer(false)),
})

export const RfpModal = connect(mapStateToProps, mapDispatchToProps)(_RfpModal)
