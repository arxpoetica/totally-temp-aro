import React, { Component } from 'react'
import { PropTypes } from 'prop-types'

export class ReportDefinitionEditor extends Component {
  constructor (props) {
    super(props)
    // Make a copy of the initial values
    this.state = {
      displayName: this.props.initialDisplayName,
      name: this.props.initialName,
      queryType: this.props.initialQueryType,
      query: this.props.initialQuery
    }
  }

  render () {
    return <form className='d-flex flex-column' style={{ height: '100%' }} onSubmit={event => event.preventDefault()}>
      <div className='form-row flex-grow-0'>
        <div className='col'>
          <input className='form-control' type='text' value={this.state.name} onChange={event => this.setState({ name: event.target.value })} />
        </div>
        <div className='col'>
          <input className='form-control' type='text' value={this.state.displayName} onChange={event => this.setState({ displayName: event.target.value })} />
        </div>
        <div className='col'>
          <input className='form-control' type='text' value={this.state.queryType} onChange={event => this.setState({ queryType: event.target.value })} />
        </div>
      </div>
      <div className='form-row flex-grow-1' style={{ paddingTop: '10px' }}>
        <div className='col' style={{ height: '100%' }}>
          <textarea className='form-control' type='text' value={this.state.query} onChange={event => this.setState({ query: event.target.value })}
            style={{ height: '100%', fontFamily: 'Courier New', fontSize: '12px' }} />
        </div>
      </div>
    </form>
  }

  submit (values) {
    // print the form values to the console
    console.log(values)
  }
}

ReportDefinitionEditor.propTypes = {
  initialDisplayName: PropTypes.string,
  initialName: PropTypes.string,
  initialQueryType: PropTypes.string,
  initialQuery: PropTypes.string
}

export default ReportDefinitionEditor
