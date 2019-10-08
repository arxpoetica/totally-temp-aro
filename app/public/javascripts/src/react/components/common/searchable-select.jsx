import React, { Component } from 'react'

export class SearchableSelect extends Component {
  constructor (props) {
    super(props)

    // props.optionLists - can be array of options OR group of named arrays of options
    // props.resultsMax - integer, max length of dropdown results
    this.searchPool = {}
    this.state = {
      searchResults: {}, // group of named arrays
      newUserId: null,
      newUserName: ''
    }
  }

  render () {
    return (
      <div className='btn-group'>
        <input type='text'
          onInput={event => this.onSearchInput(event)}
          placeholder='Search Users'
          className='form-control'
          id='dropdownMenu'
          data-toggle='dropdown' aria-haspopup='true' aria-expanded='false' />
        <button className='btn btn-secondary dropdown-toggle' type='button' id='dropdownMenu' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
          {this.state.newUserName}
        </button>
        <div className='dropdown-menu' aria-labelledby='dropdownMenu'>
          {this.renderOptions()}
        </div>
      </div>
    )
  }

  renderOptions () {
    var jsx = []
    Object.keys(this.state.searchResults).forEach((key) => {
      if (key) {
        jsx.push(<h6 key={`search-select-header-${key}`} className='dropdown-header'>-- {key} --</h6>)
        jsx.push(<div className='dropdown-divider' key={`search-select-divider-${key}`} />)
      }

      this.state.searchResults[key].forEach(item => {
        jsx.push(<button onClick={(event) => this.onSelectChange(event, item)} key={`search-select-option-${key}-${item.id}`} className='dropdown-item' type='button'>{item.name}</button>)
      })
    })

    return jsx
  }

  onSearchInput (event) {
    var searchTerm = event.target.value
    var searchResults = {}
    Object.keys(this.searchPool).forEach((key) => {
      searchResults[key] = this.searchPool[key].filter(item => { return this.filterItem(item, searchTerm) })
      if (searchResults[key].length === 0) delete searchResults[key]
    })
    this.setState({ ...this.state, 'searchResults': searchResults })
  }

  onSelectChange (event, item) {
    this.setState({ ...this.state,
      newUserId: item.id,
      newUserName: item.name
    })
  }

  filterItem (item, searchTerm) {
    return (item.name.toLowerCase().includes(searchTerm.toLowerCase())) // optomize: do toLowerCase on search once
  }

  componentWillMount () {
    // tokenize name here
    var searchResults = {}
    if (Array.isArray(this.props.optionLists)) {
      searchResults = { '': this.props.optionLists } // yes, an empty string can be an object key
    } else {
      searchResults = this.props.optionLists
    }
    this.searchPool = searchResults
    this.setState({ ...this.state, 'searchResults': searchResults })
  }
}

export default SearchableSelect
