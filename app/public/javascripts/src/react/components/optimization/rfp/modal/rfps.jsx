import React, { useState, useEffect } from 'react'
import { Accordion, Badge } from '@mantine/core';
import AroHttp from '../../../../common/aro-http'
import { Notifier } from '../../../../common/notifications'

export const Rfps = () => {

  const [rfps, setRfps] = useState([])
  const [values, setValues] = useState([])

  useEffect(() => { loadData() }, [])
  const loadData = async () => {
    try {
      const { data } = await AroHttp.get(`/service/v2/rfp/items?$top=10`)
      setRfps(data)
    } catch (error) {
      Notifier.error(error)
    }
  }

  return (
    <div className="rfps">
      <Accordion
        value={values}
        onChange={setValues}
        multiple
      >
        {rfps.map(rfp =>
          <Accordion.Item key={rfp.id} value={rfp.request.rfpId}>
            <Accordion.Control>
              <div className="control">
                <h4>{rfp.request.rfpId}</h4>
                <Badge variant="filled">{rfp.status}</Badge>
              </div>
            </Accordion.Control>
            <Accordion.Panel>
              ...TODO:...
            </Accordion.Panel>
          </Accordion.Item>
        )}
      </Accordion>

      <style jsx>{`
        .rfp {
          margin: 0 0 20px;
          border: 1px solid gray;
        }
        h4 {
          margin: 0;
        }
        .control {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
      `}</style>
    </div>
  )

}