import React, { useState } from 'react'
import { Accordion, Badge } from '@mantine/core'
import { RfpPlans } from './rfp-plans.jsx'

export const RfpsList = ({ rfps }) => {

  const [values, setValues] = useState([])

  return <>
    <div className="rfps-list">
      <Accordion
        value={values}
        onChange={setValues}
        multiple
      >
        {rfps.map(rfp =>
          <Accordion.Item key={rfp.id} value={rfp.request.rfpId}>
            <Accordion.Control>
              <div className="control">
                <h2 className="title h5">{rfp.request.rfpId}</h2>
                <Badge>{rfp.status}</Badge>
              </div>
            </Accordion.Control>
            <Accordion.Panel>
              {/* <pre>{JSON.stringify(rfp, null, '  ')}</pre> */}
              <RfpPlans rfp={rfp}/>
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
