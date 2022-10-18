import React, { useState } from 'react'
import { TextInput, CloseButton, Button } from '@mantine/core';
import { IconSearch } from '@tabler/icons'

// TODO: genericize into a library
export const RfpSearch = ({ onSearch }) => {

  const [searchValue, setSearchValue] = useState('')

  return (
    <div className="rfp-search">
      <div className="controls">
        <div className="input">
          <TextInput
            value={searchValue}
            placeholder="Search RFPs"
            onChange={event => setSearchValue(event.currentTarget.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                onSearch(searchValue)
              }
            }}
          />
          {searchValue &&
            <div className="close">
              <CloseButton
                onClick={() => {
                  setSearchValue('')
                  onSearch('')
                }}
                aria-label="Clear search input"
              />
            </div>
          }
        </div>
        <Button
          leftIcon={<IconSearch size={20} stroke={2}/>}
          onClick={() => onSearch(searchValue)}
        >
          Search
        </Button>
      </div>

      <style jsx>{`
        .rfp-search {
          display: flex;
          justify-content: center;
        }
        .controls {
          display: grid;
          grid-template-columns: auto 110px;
          align-items: center;
          gap: 10px;
          width: 500px;
        }
        .input {
          position: relative;
        }
        .close {
          position: absolute;
          top: 4px;
          right: 4px;
        }
        .rfp-search :global(.mantine-Input-input) {
          padding-right: 36px;
        }
      `}</style>
    </div>
  )

}
