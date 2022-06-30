import React, { Component } from 'react'

export class SearchableSelect extends Component {
  constructor (props) {
    super(props)

    // props.optionLists - can be array of options OR group of named arrays of options
    // props.resultsMax - integer, max length of dropdown results
    this.dropdownRef = React.createRef()
    this.state = {
      prevProps: {}, // HACK to get around the fact that getDerivedStateFromProps is fired from state change as well, will find a different way
      searchPool: {},
      searchResults: {}, // group of named arrays
      searchTerm: '',
      selectedItem: null
    }
  }

  render () {
    return (
      <div className='btn-group'>
        <input
          type='text'
          onChange={event => this.onSearchInput(event)}
          placeholder='Search Users'
          className='form-control'
          value={this.state.searchTerm}
          id='dropdownMenu'
          autoComplete='off'
          data-toggle='dropdown'
          aria-haspopup='true'
          aria-expanded='false'
          style={{ width: 'unset' }}
        />
        {this.props.onButton
          ? (
            <button className={'btn ' + (this.state.selectedItem ? 'btn-primary' : 'btn-secondary')}
              onClick={(event) => { this.onButton(this.state.selectedItem, event) }}
              type='button' id='dropdownMenuBtn'
              disabled={(this.state.selectedItem ? null : 'disabled')}>
              {this.props.btnLabel}
            </button>
          )
          : null
        }
        {this.renderOptions()}
      </div>
    )
  }

  renderOptions () {
    var jsx = []
    var itemCount = 0
    var isFirst = true
    Object.keys(this.state.searchResults).forEach((key) => {
      if (key) {
        if (!isFirst) jsx.push(<div className='dropdown-divider' key={`search-select-divider-${key}`} />)
        jsx.push(<h6 key={`search-select-header-${key}`} className='dropdown-header text-right'> {key}</h6>)
        isFirst = false
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

  onButton (selectedItem, event) {
    this.props.onButton(selectedItem, event)
    var searchResults = this.filterThisLists('')
    this.setState({ ...this.state,
      selectedItem: null,
      searchResults: searchResults,
      searchTerm: ''
    })
  }

  onSearchInput (event) {
    // ToDo: only trigger this after typing has stopped for say 200ms
    var searchTerm = event.target.value
    var searchResults = this.filterThisLists(event.target.value)
    var resultsArrays = Object.values(searchResults) // convert to array
    var selectedItem = null
    if (resultsArrays[0] && resultsArrays[0].length === 1 && resultsArrays[0][0].name === searchTerm) selectedItem = { ...resultsArrays[0][0] }
    this.setState({ ...this.state,
      selectedItem: selectedItem,
      searchResults: searchResults,
      searchTerm: searchTerm
    })
    // React.findDOMNode(this.dropdownRef).dropdown('update')
    // $('#dropdownItem').dropdown('update')
    // ToDo: need to run .dropdown('update') on dropdown to refigure the offset after changing the number list items
  }

  onSelectChange (event, item) {
    var searchResults = this.filterThisLists(item.name)
    this.setState({ ...this.state,
      selectedItem: item,
      searchResults: searchResults,
      searchTerm: item.name
    })
    this.props.onSelect(item, event)
  }

  filterThisLists (searchTerm) {
    return SearchableSelect.filterLists(searchTerm, this.state.searchPool, this.props.resultsMax)
  }

  static filterLists (searchTerm, searchPool, resultsMax) {
    var searchResults = {}
    // ToDo: resultsMax should refer to total results not per categorie
    // var itemCount = 0
    Object.keys(searchPool).forEach((key) => {
      // searchResults[key] = searchPool[key].filter(item => { return this.filterItem(item, searchTerm) })
      searchResults[key] = []
      for (var i = 0; i < searchPool[key].length; i++) {
        if (SearchableSelect.filterItem(searchPool[key][i], searchTerm)) {
          searchResults[key].push(searchPool[key][i])
          if (searchResults[key].length >= resultsMax) break
        }
      }
      if (searchResults[key].length === 0) delete searchResults[key]
    })
    return searchResults
  }

  static filterItem (item, searchTerm) {
    return (item.name.toLowerCase().includes(searchTerm.toLowerCase())) // optomize: do toLowerCase on search once
  }

  static getDerivedStateFromProps (props, state) {
    if (JSON.stringify(props) === JSON.stringify(state.prevProps)) return null
    // tokenize name here
    var optionLists = {}
    if (Array.isArray(props.optionLists)) {
      optionLists = { '': props.optionLists } // yes, an empty string can be an object key
    } else {
      optionLists = props.optionLists
    }
    // this.state.searchPool = optionLists
    var searchResults = SearchableSelect.filterLists('', optionLists, props.resultsMax)
    return {
      prevProps: { ...props },
      searchPool: optionLists,
      searchResults: searchResults
    }
  }
}

SearchableSelect.defaultProps = {
  resultsMax: 10,
  btnLabel: 'Select',
  onSelect: (item, event) => {}
}

export default SearchableSelect
