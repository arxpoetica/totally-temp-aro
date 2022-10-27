import React, { createContext, useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Tabs } from '@mantine/core'
import { IconList, IconUpload, IconSettings } from '@tabler/icons'
import { Rfps } from './rfp-list-lander.jsx'
import RfpPlanList from '../status/rfp-plan-list.jsx'
import { RfpUploader } from './rfp-uploader.jsx'
import { RfpTemplateManager } from './rfp-template-manager.jsx'
import RfpActions from '../rfp-actions'
import AroHttp from '../../../../common/aro-http'
import { Notifier } from '../../../../common/notifications'

export const RfpContext = createContext()

const TABS = {
  RFPS_LIST: {
    description: 'List all RFPs',
    component: <Rfps/>, // <RfpPlanList/>
    icon: <IconList size={20} stroke={2}/>
  },
  DELETE_THIS_SOON: {
    description: 'OLD RFPs TO DELETE',
    component: <RfpPlanList/>,
    icon: <IconList size={20} stroke={2}/>
  },
  SUBMIT_RFP: {
    description: 'Submit RFP',
    component: <RfpUploader/>,
    icon: <IconUpload size={20} stroke={2}/>
  },
  MANAGE_RFP_TEMPLATES: {
    description: 'Manage RFP templates',
    component: <RfpTemplateManager/>,
    icon: <IconSettings size={20} stroke={2}/>
  },
}

function _RfpModal(props) {

  const [rfps, setRfps] = useState([])
  const [reportDefinitions, setReportDefinitions] = useState([])
  const ctx = {
    rfps, setRfps,
    reportDefinitions, setReportDefinitions,
  }

  const {
    showAllRfpStatus,
    showFullScreenContainer,
    hideFullScreenContainer,
    clearRfpState,
  } = props

  useEffect(() => { loadOldDefinitions() }, [])

  const loadOldDefinitions = async () => {
    try {
      const { data = [] } = await AroHttp.get('/service/rfp/report-definition')
      const filteredDefinitions = data.filter(definition => {
        const { reportData: { reportType } } = definition
        return reportType === 'COVERAGE' || reportType === 'RFP'
      })
      ctx.setReportDefinitions(filteredDefinitions)
    } catch (error) {
      Notifier.error(error)
    }
  }

  return <RfpContext.Provider value={ctx}>
    {showFullScreenContainer && showAllRfpStatus &&
      <div className="rfp-modal">

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
          <Tabs defaultValue="RFPS_LIST" keepMounted={false}>
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

      </div>
    }
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
  </RfpContext.Provider>
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
