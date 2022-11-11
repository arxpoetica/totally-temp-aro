import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Chip, TextInput, Button } from '@mantine/core';

const AccordionMultiInput = (props) => {
  const {
    filter,
    onChange,
    data
  } = props
  const [savedInputs, setSavedInputs] = useState([])
  const [textInput, setTextInput] = useState('')
  
  const setChips = () => {
    setSavedInputs(savedInputs.concat(textInput))
    onChange(filter.attributeKey, filter.type, data[filter.type].concat(textInput))

    setTextInput("")
  }

  useEffect(() => {
    onChange(filter.attributeKey, filter.type, [])
  }, [])
  
  return (
    <div>
      <div
        style={{
          justifyContent: 'space-between',
          marginBottom: '1em',
          display: 'flex'
        }}
      >
        <TextInput
          value={textInput}
          onChange={event => setTextInput(
            event.currentTarget.value
          )}
        />
        <Button
          onClick={() => setChips()}
          styles={{
            root: {
              borderRadius: '5px'
            }
          }}
        >
          Add Filter
        </Button>
      </div>
      <Chip.Group
        multiple
        value={data[filter.type]}
        onChange={(value) => {
          onChange(filter.attributeKey, filter.type, value)
        }}
        styles={{
          root: {
            gap: '4px',
            padding: '.5em',
            borderRadius: '5px'
          }
        }}
      >
        {savedInputs.map(chip => <Chip key={chip} value={chip}> {chip} </Chip>)}
      </Chip.Group>
    </div>
  )
}

const mapStateToProps = () => {
  return {}
}

const mapDispatchToProps = () => ({})

const AccordionMultiInputComponent = connect(mapStateToProps, mapDispatchToProps)(AccordionMultiInput)
export default AccordionMultiInputComponent
