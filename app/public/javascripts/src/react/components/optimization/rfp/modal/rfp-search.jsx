import React, { useState } from 'react'
import { TextInput, Button } from '@mantine/core';
import { IconSearch } from '@tabler/icons'

// TODO: genericize into a library
export const RfpSearch = ({ onSearch }) => {

  const [searchValue, setSearchValue] = useState('')

  return (
    <div className="rfp-search">
      <div className="controls">
        <TextInput
          value={searchValue}
          placeholder="Search RFPs"
          onChange={event => setSearchValue(event.currentTarget.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              onSearch({ search: searchValue })
            }
          }}
        />
        <Button
          leftIcon={<IconSearch size={20} stroke={2}/>}
          onClick={() => onSearch({ search: searchValue })}
        >
          Search
        </Button>
      </div>

      <style jsx>{`
        .rfp-search {
          display: flex;
          justify-content: center;
          margin: 0 20px;
        }
        .controls {
          display: grid;
          grid-template-columns: auto 110px;
          align-items: center;
          gap: 10px;
          width: 500px;
        }
      `}</style>
    </div>
  )

}
