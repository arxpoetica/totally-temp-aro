import React from 'react'
import { Tabs } from '@mantine/core'
import { IconList, IconUpload, IconSettings } from '@tabler/icons'
import RfpPlanList from '../status/rfp-plan-list.jsx'
import RfpSubmitter from '../status/rfp-submitter.jsx'
import RfpTemplateManager from '../status/rfp-template-manager.jsx'

const TABS = {
  LIST_PLANS: {
    description: 'List all plans',
    component: <RfpPlanList/>,
    icon: <IconList size={20} stroke={2}/>
  },
  SUBMIT_RFP: {
    description: 'Submit RFP',
    component: <RfpSubmitter/>,
    icon: <IconUpload size={20} stroke={2}/>
  },
  MANAGE_RFP_TEMPLATES: {
    description: 'Manage RFP templates',
    component: <RfpTemplateManager/>,
    icon: <IconSettings size={20} stroke={2}/>
  },
}

export const RfpLegacy = () =>
  <div className="rfp-legacy">
    <h4>RFP Plans</h4>
    <Tabs defaultValue="LIST_PLANS">
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

    <style jsx>{`
      .panel {
        padding: 20px;
      }
    `}</style>
  </div>
