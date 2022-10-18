import React, { useState, useEffect } from 'react'
import { RfpsList } from './rfps-list.jsx'
import { RfpSearch } from './rfp-search.jsx'
import { Pagination } from './rfp-pagination.jsx'
import AroHttp from '../../../../common/aro-http'
import { Notifier } from '../../../../common/notifications'

const PAGE_SIZE = 10
// FIXME: figure out how to get pagination totals accurately:
const PAGINATION_TOTAL = Math.ceil(33 / PAGE_SIZE)

export const Rfps = () => {

  const [rfps, setRfps] = useState([])
  const [search, setSearch] = useState('')
  const [skip, setSkip] = useState(0)

  useEffect(() => { loadData() }, [])

  const loadData = async (query = {}) => {
    try {
      const { search, skip } = query

      const params = new URLSearchParams()
      params.set('$top', PAGE_SIZE)
      if (skip) params.set('$skip', skip)
      if (search) params.set('search', search)

      const { data } = await AroHttp.get(`/service/v2/rfp/items?${params.toString()}`)
      setRfps(data)
    } catch (error) {
      Notifier.error(error)
    }
  }

  return (
    <div className="rfps">
      <RfpSearch onSearch={search => {
        loadData({ search })
        setSearch(search || '')
        setSkip(0)
      }}/>

      <div className="content">
        {rfps.length > 0
          ? <RfpsList rfps={rfps}/>
          : <p>No results.</p>
        }
      </div>

      <Pagination
        onPage={page => {
          const skip = (page - 1) * PAGE_SIZE
          loadData({ skip, search })
          setSkip(skip)
          // setSearch(search || '')
        }}
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
        .content {
          position: relative;
        }
      `}</style>
    </div>
  )

}
