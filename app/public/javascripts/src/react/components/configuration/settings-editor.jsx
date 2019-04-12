import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import ConfigurationActions from '../configuration/configuration-actions'

export class SettingsEditor extends Component {
  constructor (props) {
    super(props)
    // Form component state does not need to go into Redux
    this.state = {
      selectedConfigurationType: 'locationCategories',
      configurationTypes: Object.keys(props.initialConfiguration)
    }
    this.state.configuration = {}
    Object.keys(props.initialConfiguration).forEach(configurationType => {
      this.state.configuration[configurationType] = JSON.stringify(props.initialConfiguration[configurationType], null, 2)
    })
  }

  render () {
    return <div id='divConfigurationForm'>
      <form>
        <div className='form-group row'>
          {/* The configuration type (e.g. locationCategories) */}
          <label className='col-sm-4 col-form-label'>Configuration Type</label>
          <div className='col-sm-8'>
            <select id='selectConfigurationType'
              className='form-control'
              value={this.state.selectedConfigurationType}
              onChange={event => this.setState({ selectedConfigurationType: event.target.value })}>
              {
                this.state.configurationTypes.map(configurationType =>
                  <option value={configurationType} key={configurationType}>{configurationType}</option>)
              }
            </select>
          </div>
        </div>
        <div className='form-group row'>
          {/* The value of the selected configuration type */}
          <label className='col-sm-4 col-form-label'>Value</label>
          <div className='col-sm-8'>
            <textarea className='form-control'
              style={{ height: '350px' }}
              value={this.state.configuration[this.state.selectedConfigurationType]}
              onChange={event => this.handleConfigurationChange(this.state.selectedConfigurationType, event.target.value)} />
          </div>
        </div>
        {/* Show an error message if we have one */}
        {
          this.state.errorMessage
            ? <div className='alert alert-danger'>{this.state.errorMessage}</div>
            : null
        }
      </form>
      <button className='btn btn-primary float-right' onClick={() => this.saveSelectedConfigurationToServer()}>
        <i className='fa fa-save' />Save settings
      </button>
    </div>
  }

  handleConfigurationChange (configurationType, newValue) {
    this.setState({
      configuration: {
        ...this.state.configuration,
        [configurationType]: newValue
      }
    })
  }

  saveSelectedConfigurationToServer () {
    // First, try to parse the JSON of the currently selected configuration to make sure it is valid.
    this.setState({ errorMessage: null })
    var newConfiguration = null
    try {
      newConfiguration = JSON.parse(this.state.configuration[this.state.selectedConfigurationType])
    } catch (err) {
      this.setState({
        errorMessage: `There is an error in your JSON. Please fix it before continuing:\n${err.message}`
      })
    }
    if (newConfiguration) {
      // Save the setting to the server
      this.props.saveConfigurationToServerAndReload(this.state.selectedConfigurationType, newConfiguration)
    }
  }
}

SettingsEditor.propTypes = {
  configuration: PropTypes.object
}

const mapStateToProps = (state) => ({
  initialConfiguration: state.configuration.items
})

const mapDispatchToProps = (dispatch, ownProps) => ({
  saveConfigurationToServerAndReload: (type, configuration) => dispatch(ConfigurationActions.saveConfigurationToServerAndReload(type, configuration))
})

const SettingsEditorComponent = wrapComponentWithProvider(reduxStore, SettingsEditor, mapStateToProps, mapDispatchToProps)
export default SettingsEditorComponent
