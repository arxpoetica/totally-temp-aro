import React, { Component } from 'react'

export class SearchableSelect extends Component {
  constructor (props) {
    super(props)

    // props.optionLists - can be array of options OR group of named arrays of options
    // props.resultsMax - integer, max length of dropdown results
    this.dropdownRef = React.createRef()
    this.searchPool = {}
    this.state = {
      searchResults: {}, // group of named arrays
      searchTerm: '',
      newUserId: null,
      newUserName: ''
    }
  }

  render () {
    return (
      <div className='btn-group'>
        <input type='text'
          onChange={event => this.onSearchInput(event)}
          placeholder='Search Users'
          className='form-control'
          value={this.state.searchTerm}
          id='dropdownMenu'
          data-toggle='dropdown' aria-haspopup='true' aria-expanded='false' />
        <button className='btn btn-secondary dropdown-toggle' type='button' id='dropdownMenu' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
          {this.state.newUserName}
        </button>
        {this.renderOptions()}
      </div>
    )
  }

  renderOptions () {
    var jsx = []
    var itemCount = 0
    Object.keys(this.state.searchResults).forEach((key) => {
      if (key) {
        jsx.push(<h6 key={`search-select-header-${key}`} className='dropdown-header'>-- {key} --</h6>)
        jsx.push(<div className='dropdown-divider' key={`search-select-divider-${key}`} />)
      }

      this.state.searchResults[key].forEach(item => {
        itemCount++
        jsx.push(<button onClick={(event) => this.onSelectChange(event, item)} key={`search-select-option-${key}-${item.id}`} className='dropdown-item' type='button'>{item.name}</button>)
      })
    })

    return (
      <div id='dropdownItem' ref={this.dropdownRef} className='dropdown-menu' aria-labelledby='dropdownMenu' data-num-items={itemCount}>
        {jsx}
      </div>
    )
  }

  onSearchInput (event) {
    var searchTerm = event.target.value
    var searchResults = this.filterLists(event.target.value)
    this.setState({ ...this.state,
      searchResults: searchResults,
      searchTerm: searchTerm
    })
    // React.findDOMNode(this.dropdownRef).dropdown('update')
    // $('#dropdownItem').dropdown('update')
    // ToDo: need to run .dropdown('update') on dropdown to refigure the offset after changing the number list items
  }

  filterLists (searchTerm) {
    var searchResults = {}
    Object.keys(this.searchPool).forEach((key) => {
      searchResults[key] = this.searchPool[key].filter(item => { return this.filterItem(item, searchTerm) })
      if (searchResults[key].length === 0) delete searchResults[key]
    })
    return searchResults
  }

  onSelectChange (event, item) {
    var searchResults = this.filterLists(item.name)
    this.setState({ ...this.state,
      newUserId: item.id,
      newUserName: item.name,
      searchResults: searchResults,
      searchTerm: item.name
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
    this.setState({ ...this.state, searchResults: searchResults })
  }
}

export default SearchableSelect
