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
        <div className="scroll">
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
                </Accordion.Panel>
              </Accordion.Item>
            )}
          </Accordion>
        </div>
      </div>

      <Pagination
        onPage={loadData}
        total={PAGINATION_TOTAL}
      />

      <style jsx>{`
        .rfps {
          height: 100%;
          display: grid;
          grid-template-rows: 36px auto 32px;
          gap: 20px;
          min-height: 0;
        }
        .rfps-list {
          position: relative;
        }
        .scroll {
          overflow: auto;
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
        }
        .rfp {
          margin: 0 0 20px;
          border: 1px solid gray;
        }
        .title {
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
