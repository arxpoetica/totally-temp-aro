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

export class PlanSearchFilter extends Component {
  constructor (props) {
    super(props)

    this.state = {
      selectedItems: [],
    }

    const filterDropdown = jQuery('.filter-dropdown')

    filterDropdown.on('click', (event) => {
      const isDropdownHidden = filterDropdown.is(':hidden')
      if (!isDropdownHidden && event.target.id !== 'apply-filter') {
        event.stopPropagation()
      }
    })

    this.handleInputChange = _.debounce(this.handleInputChange.bind(this),250)
  }

  render() {

    const { objectName, searchList } = this.props
    const { selectedItems } = this.state

    const customStyles = {
      control: styles => ({ ...styles, backgroundColor: 'white' }),
      option: (styles, state) => ({
        ...styles,
        ...square(this.props.getTagColour(state.data)),
      }),
      singleValue: (styles, state) => ({
        ...styles,
        ...square(this.props.getTagColour(state.data)),
      }),
    }

    let optionsList = []
    if (objectName === 'Tag'){
      optionsList = searchList.map(function(newkey) {
        return {"id": newkey.id, "value": newkey.name, "label": newkey.name, "colourHue": newkey.colourHue}
      })
    } else if (objectName === 'Service Area'){
      optionsList = searchList.map(function(newkey) {
        return {"id": newkey.id, "value": newkey.code, "label": newkey.code}
      })
    } else if (objectName === 'Creator'){
      optionsList = searchList.map(function(newkey) {
        return {"id": newkey.fullName, "value": newkey.fullName, "label": newkey.fullName}
      })
    }

    return (
      <div className="dropdown">
        <button
          className="btn btn-light dropdown-toggle filter-dropdown-menu"
          type="button" id="dropdownMenu1"
          data-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="true"
        >
          {objectName}
        </button>
        <div className="dropdown-menu filter-dropdown" aria-labelledby="dropdownMenu1">
          <Select
            options={optionsList}
            closeMenuOnSelect={true}
            hideSelectedOptions={true}
            backspaceRemovesValue={true}
            isSearchable={true}
            isClearable={true}
            components={components}
            placeholder={`Select ${objectName}...`}
            onChange={(event) => this.onSelectedItemsChanged(event)}
            styles={customStyles}
            onInputChange={(e, action)=>this.handleInputChange(e, action)}
          />
          <div className="text-center" style={{marginTop: '2px'}}>
            <button
              id="apply-filter"
              disabled={(selectedItems.length < 0 ? 'disabled' : null)}
              className={`btn btn-sm ${selectedItems.length > 0 ? 'btn-primary' : ''}`}
              onClick={() => this.props.applySearch({selectedFilters: selectedItems})}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    )
  }

  handleInputChange (searchText, { action }) {
    const { objectName, dataItems, refreshTagList } = this.props
    switch (action) {
      case 'input-change':
        if (objectName === 'Service Area') {
          refreshTagList(dataItems, searchText, false)
        } else if (objectName === 'Creator') {
          refreshTagList(searchText)
        }
        return
      case 'menu-close':
        if (objectName === 'Creator') { refreshTagList(searchText) }
        return
      default:
        return
    }
  }

  onSelectedItemsChanged (event) {
    let selectedItems = []
    if (event !== null) {
      const { objectName, searchList } = this.props
      if (objectName === 'Creator') {
        searchList.map(function(newkey) {
          if (newkey.fullName === event.value) return selectedItems.push(newkey)
        })
      } else {
        searchList.map(function(newkey) {
          if (newkey.id === event.id) return selectedItems.push(newkey)
        })
      }
    } else {
      selectedItems = []
    }
    this.setState({ selectedItems })
  }
}

const mapStateToProps = (state) => ({
  dataItems: state.plan.dataItems,
})  

const mapDispatchToProps = (dispatch) => ({
  getTagColour: (tag) => dispatch(ToolBarActions.getTagColour(tag)),
})

const PlanSearchFilterComponent = connect(mapStateToProps, mapDispatchToProps)(PlanSearchFilter)
export default PlanSearchFilterComponent
