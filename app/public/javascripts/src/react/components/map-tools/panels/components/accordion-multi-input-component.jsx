import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Chip, TextInput, Button } from '@mantine/core';
import MapLayerActions from '../../../map-layers/map-layer-actions'

const AccordionMultiInput = (props) => {
  const {
    nearNetFilters,
    filter,
    updateMapLayerFilters,
    layer
  } = props
  const [savedInputs, setSavedInputs] = useState([])
  const [activeChips, setActiveChips] = useState([])
  const [textInput, setTextInput] = useState('')
  
  const setChips = () => {
    setSavedInputs(savedInputs.concat(textInput))
    setActiveChips(activeChips.concat(textInput))
    // Async issue where the value isn't added to state before we call action
    updateMapLayerFilters(layer, filter.attributeKey, { multiInput: activeChips.concat(textInput) })

    setTextInput("")
  }

  useEffect(() => {
    updateMapLayerFilters(layer, filter.attributeKey, { multiInput: activeChips })
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
        value={activeChips}
        onChange={(value) => {
          setActiveChips(value)
          updateMapLayerFilters(layer, filter.attributeKey, { multiInput: value })
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

const mapStateToProps = (state) => {
  return {
    nearNetFilters: state.mapLayers.filters.near_net
  }
}

const mapDispatchToProps = (dispatch) => ({
  updateMapLayerFilters: (layer, key, value) => dispatch(MapLayerActions.updateMapLayerFilters(layer, key, value)),
})

const AccordionMultiInputComponent = connect(mapStateToProps, mapDispatchToProps)(AccordionMultiInput)
export default AccordionMultiInputComponent
