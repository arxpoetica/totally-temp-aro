import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import UiActions from './ui-actions'

export class StylesheetManager extends Component {
  constructor (props) {
    super(props)
    this.state = {
      styleValues: props.initialConfiguration,
      errorMessage: null
    }
    this.handleChanges = this.handleChanges.bind(this)
  }

  render () {
    return <div id='divStylesheetForm'>
      <form>
        <div className='form-group row'>
          {/* The value of the selected configuration type */}
          <label className='col-sm-4 col-form-label'>Value</label>
          <div className='col-sm-8'>
            <textarea className='form-control'
              style={{ height: '350px' }}
              value={this.state.styleValues}
              onChange={this.handleChanges} />
          </div>
        </div>

      </form>
      <button className='btn btn-primary float-right save-stylesheet' onClick={() => this.props.saveStylesheetsToServerAndReload(this.state.styleValues)}>
        <i className='fa fa-save' />Save settings
      </button>
    </div>
  }
  handleChanges (event) {
    this.setState({
      styleValues: event.target.value
    })
  }
}

StylesheetManager.propTypes = {
  styleValues: PropTypes.string
}
const mapStateToProps = (state) => ({
  initialConfiguration: state.configuration.ui.styleValues
})

const mapDispatchToProps = (dispatch, ownProps) => ({
  saveStylesheetsToServerAndReload: (styleValues) => dispatch(UiActions.saveStylesheetsToServerAndReload(styleValues))
})

const StylesheetManagerComponent = wrapComponentWithProvider(reduxStore, StylesheetManager, mapStateToProps, mapDispatchToProps)
export default StylesheetManagerComponent
