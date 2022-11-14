import React, { useState } from 'react'
import { Accordion, Badge } from '@mantine/core'
import { RfpPlans } from './rfp-plans.jsx'
import AroHttp from '../../../../common/aro-http'
import { Notifier } from '../../../../common/notifications'

const planStateToBadgeColor = {
  UNDEFINED: 'red',
  START_STATE: 'dark',
  INITIALIZED: 'dark',
  STARTED: 'primary',
  COMPLETED: 'green',
  CANCELED: 'red',
  FAILED: 'red'
}

export const RfpsList = ({ rfps }) => {

  const [id, setId] = useState('')
  const [definitionsByVersion, setDefinitionsByVersion] = useState({})

  const loadDefinition = async id => {
    try {
      if (!id) return
      const { protocolVersion } = rfps.find(rfp => rfp.id === +id)
      if (definitionsByVersion[protocolVersion]) return

      // cache definitions by protocol version
      const url = `/service/rfp/report-definition?protocol_version=${protocolVersion}`
      const { data } = await AroHttp.get(url)
      setDefinitionsByVersion({ ...definitionsByVersion, [protocolVersion]: data })
    } catch (error) {
      Notifier.error(error)
    }
  }

  return <>
    <div className="rfps-list">
      <Accordion
        value={id}
        onChange={id => {
          setId(id)
          loadDefinition(id)
        }}
      >
        {rfps.map(rfp =>
          <Accordion.Item key={rfp.id} value={rfp.id.toString()}>
            <Accordion.Control>
              <div className="control">
                <h2 className="title h5">{rfp.rfpId}</h2>
                <Badge color={planStateToBadgeColor[rfp.status]}>{rfp.status}</Badge>
              </div>
            </Accordion.Control>
            <Accordion.Panel>
              {/* <pre>{JSON.stringify(rfp, null, '  ')}</pre> */}
              <RfpPlans rfp={rfp} definitionsByVersion={definitionsByVersion}/>
            </Accordion.Panel>
          </Accordion.Item>
        )}
      </Accordion>
    </div>

    <style jsx>{`
      .rfps-list {
        overflow: auto;
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
      }
      .control {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .title {
        margin: 0;
      }
    `}</style>
  </>

}
