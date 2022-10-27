import React, { useContext, useState, useEffect } from 'react'
import { RfpContext } from './rfp-modal.jsx'
import { RfpsList } from './rfp-list.jsx'
import { RfpSearch } from './rfp-search.jsx'
import { Pagination } from './rfp-pagination.jsx'
import AroHttp from '../../../../common/aro-http'
import { Notifier } from '../../../../common/notifications'

const PAGE_SIZE = 10
const $TOP = 200

export const Rfps = () => {

  const ctx = useContext(RfpContext)

  const [initialListCount, setInitialListCount] = useState(0)
  const [page, setPage] = useState(1)
  const rfpsStart = (page - 1) * PAGE_SIZE
  const rfpsEnd = rfpsStart + PAGE_SIZE

  useEffect(() => { loadRfps({ initial: true }) }, [])

  const loadRfps = async (query = {}) => {
    try {
      const { initial, search, skip, top } = query

      const params = new URLSearchParams()
      params.set('$top', top || $TOP)
      if (skip) params.set('$skip', skip)
      if (search) params.set('search', search)

      const { data } = await AroHttp.get(`/service/v2/rfp/items?${params.toString()}`)
      if (initial) setInitialListCount(data.length)
      ctx.setRfps(data)
    } catch (error) {
      Notifier.error(error)
    }
  }

  return (
    <div className="rfps">
      <RfpSearch
        onSearch={search => {
          if (!search && initialListCount === ctx.rfps.length) return
          loadRfps({ search })
          setPage(1)
        }}
        canClear={ctx.rfps.length < initialListCount}
      />

      <div className="content">
        {ctx.rfps.length > 0
          ? <RfpsList rfps={ctx.rfps.slice(rfpsStart, rfpsEnd)}/>
          : <p>No results.</p>
        }
      </div>

      <Pagination
        page={page}
        total={Math.ceil(ctx.rfps.length / PAGE_SIZE)}
        onChange={setPage}
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
