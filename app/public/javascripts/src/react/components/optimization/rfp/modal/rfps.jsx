import React, { useState, useEffect } from 'react'
import { Accordion, Badge } from '@mantine/core'
import { RfpSearch } from './rfp-search.jsx'
import { Pagination } from './rfp-pagination.jsx'
import AroHttp from '../../../../common/aro-http'
import { Notifier } from '../../../../common/notifications'

// FIXME: figure out how to get pagination totals accurately:
const PAGINATION_TOTAL = 33 / 10

export const Rfps = () => {

  const [rfps, setRfps] = useState([])
  const [values, setValues] = useState([])

  useEffect(() => { loadData() }, [])

  const loadData = async (query = {}) => {
    try {
      const { search, $top = '10', $skip } = query
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if ($top) params.set('$top', $top)
      if ($skip) params.set('$skip', $skip)

      const { data } = await AroHttp.get(`/service/v2/rfp/items?${params.toString()}`)
      setRfps(data)
    } catch (error) {
      Notifier.error(error)
    }
  }

  return (
    <div className="rfps">
      <RfpSearch onSearch={loadData}/>

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
                  <h2 className="h5">{rfp.request.rfpId}</h2>
                  <Badge>{rfp.status}</Badge>
                </div>
              </Accordion.Control>
              <Accordion.Panel>
                ...TODO:...
              </Accordion.Panel>
            </Accordion.Item>
          )}
        </Accordion>
      </div>

      <Pagination
        onPage={loadData}
        total={PAGINATION_TOTAL}
      />

      <style jsx>{`
        .rfps-list {
          margin: 0 0 40px;
        }
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
