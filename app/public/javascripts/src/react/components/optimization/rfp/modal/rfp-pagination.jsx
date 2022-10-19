import React, { useState } from 'react'
import { Pagination as MantinePagination } from '@mantine/core'
// import { IconSearch } from '@tabler/icons'

// TODO: genericize into a library
export const Pagination = ({ page, total, onChange }) =>
  <div className="rfp-pagination">
    <MantinePagination
      page={page}
      onChange={onChange}
      total={total}
    />
    <style jsx>{`
      .rfp-pagination {
        display: flex;
        justify-content: center;
      }
    `}</style>
  </div>
