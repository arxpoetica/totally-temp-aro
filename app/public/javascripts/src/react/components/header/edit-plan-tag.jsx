import React, { Component } from 'react'
import { connect } from 'react-redux'
import Select from 'react-select'
import ToolBarActions from './tool-bar-actions'

const components = {
  DropdownIndicator: null,
}

const square = (color) => ({
  alignItems: 'center',
  display: 'flex',

  ':before': {
    backgroundColor: color,
    content: '" "',
    display: 'block',
    margin: 5,
    height: 10,
    width: 10,
  },
})

export class EditPlanTagMode extends Component {

  render() {
    const { searchList, selectedList, objectName } = this.props

    const customStyles = {
      control: styles => ({ ...styles, backgroundColor: 'white' }),
      option: (styles, state) => ({
        ...styles,
        ...square(this.props.getTagColour(state.data)),
      }),
      multiValue: (styles, state) => ({
        ...styles,
        ...square(this.props.getTagColour(state.data)),
      }),
    }

    let optionsList = []; let defaultList = [];
    if (objectName === 'Tag') {
      optionsList = searchList.map(function(newkey) {
        return {"id": newkey.id, "value": newkey.name, "label": newkey.name, "colourHue": newkey.colourHue}
      })
      defaultList = selectedList.map(function(newkey) {
        return {"id": newkey.id, "value": newkey.name, "label": newkey.name, "colourHue": newkey.colourHue}
      })
    } else if (objectName === 'Service Area'){
      optionsList = searchList.map(function(newkey) {
        return {"id": newkey.id, "value": newkey.code, "label": newkey.code}
      })
      defaultList = selectedList.map(function(newkey) {
        return {"id": newkey.id, "value": newkey.code, "label": newkey.code}
      })
    }

    return (
      <Select
        isMulti
        options={optionsList}
        defaultValue={defaultList}
        closeMenuOnSelect={false}
        hideSelectedOptions={true}
        backspaceRemovesValue={true}
        isSearchable={true}
        isClearable={false}
        components={components}
        placeholder={`Select ${objectName}...`}
        onChange={(event) => this.onSelectedItemsChanged(event)}
        styles={customStyles}
      />
    )
  }

  onSelectedItemsChanged (event) {
    const selectedItems = []
    if (event !== null) {
      const { objectName, searchList } = this.props
      if (objectName === 'Tag') {
        searchList.filter(function (o1) {
          return event.some(function (o2) {
            if (o1.id === o2.id) return selectedItems.push(o1)
          })
        })
        this.props.setCurrentPlanTags(selectedItems)
      } else if (objectName === 'Service Area') {
        searchList.filter(function (o1) {
          return event.some(function (o2) {
            if (o1.id === o2.id) return selectedItems.push(o1)
          })
        })
        this.props.setCurrentPlanServiceAreaTags(selectedItems)
      }
    }
  }
}

const mapDispatchToProps = (dispatch) => ({
  setCurrentPlanTags: (currentPlanTags) => dispatch(ToolBarActions.setCurrentPlanTags(currentPlanTags)),
  setCurrentPlanServiceAreaTags: (currentPlanServiceAreaTags) => dispatch(
    ToolBarActions.setCurrentPlanServiceAreaTags(currentPlanServiceAreaTags)
  ),
  getTagColour: (tag) => dispatch(ToolBarActions.getTagColour(tag)),
})

const EditPlanTagModeComponent = connect(null, mapDispatchToProps)(EditPlanTagMode)
export default EditPlanTagModeComponent
