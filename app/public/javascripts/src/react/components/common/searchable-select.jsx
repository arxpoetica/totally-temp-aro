import React, { Component, Fragment } from 'react'

export class SearchableSelect extends Component {
  constructor (props) {
    super(props)

    // props.optionLists - can be array of options OR group of named arrays of options
    // props.resultsMax - integer, max length of dropdown results
    this.searchPool = {}
    this.state = {
      searchResults: {} // group of named arrays
    }
  }

  render () {
    return (
      <div className='dropdown'>
        <button className='btn btn-secondary dropdown-toggle' type='button' id='dropdownMenu' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
          Search Users
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
        jsx.push(<h6 key={`search-select-option-${key}`} className='dropdown-header'>-- {key} --</h6>)
        jsx.push(<div className='dropdown-divider' />)
      }

      this.state.searchResults[key].forEach(item => {
        jsx.push(<button key={`search-select-option-${key}-${item.id}`} className='dropdown-item' type='button'>{item.name}</button>)
      })
    })

    return jsx
  }

  onSelectChange (event) {
    console.log(event.target.value)
  }

  componentWillMount () {
    console.log()
    var searchResults = {}
    if (Array.isArray(this.props.optionLists)) {
      searchResults = { '': this.props.optionLists } // yes, an empty string can be an object key
    } else {
      searchResults = this.props.optionLists
    }
    this.setState({ ...this.state, 'searchResults': searchResults })
  }
}

export default SearchableSelect
