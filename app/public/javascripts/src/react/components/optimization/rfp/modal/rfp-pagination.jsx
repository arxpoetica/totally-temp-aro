import React, { useState } from 'react'
import { Pagination as MantinePagination } from '@mantine/core'
// import { IconSearch } from '@tabler/icons'

// TODO: genericize into a library
export const Pagination = ({ onPage, total }) => {

  const [activePage, setActivePage] = useState(1)

  return (
    <div className="rfp-pagination">

      <MantinePagination
        page={activePage}
        onChange={setActivePage}
        total={total}
      />

      <style jsx>{`
        .rfp-pagination {
          display: flex;
          justify-content: center;
        }
      `}</style>
    </div>
  )

}
