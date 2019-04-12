import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import ConfigurationActions from '../configuration/configuration-actions'
import SettingsEditor from './settings-editor.jsx'

export class ConfigurationEditor extends Component {
  constructor (props) {
    super(props)
    // Form component state does not need to go into Redux
    this.state = {
      showInitialWarning: true
    }
  }

  render () {
    return <div>
      { this.state.showInitialWarning
        ? this.renderWarningMessage()
        : <SettingsEditor id='compSettingsEditor' />
      }
    </div>
  }

  renderWarningMessage () {
    return <div id='divConfigurationWarning'>
      <div className='alert alert-danger'>
        <strong>Careful:</strong> These settings are intended to be changed by system administrators. Incorrect settings
        can cause the entire platform to stop working <strong>for all users</strong>.
      </div>
      <button id='btnAcceptConfigurationWarning' className='btn btn-block btn-danger'
        onClick={event => this.setState({ showInitialWarning: false })}>
        I understand, take me to the configuration editor
      </button>
    </div>
  }
}

ConfigurationEditor.propTypes = {
  configuration: PropTypes.object
}

const mapStateToProps = (state) => ({
  initialConfiguration: state.configuration
})

const mapDispatchToProps = (dispatch, ownProps) => ({
  saveConfigurationToServerAndReload: (type, configuration) => dispatch(ConfigurationActions.saveConfigurationToServerAndReload(type, configuration))
})

const ConfigurationEditorComponent = wrapComponentWithProvider(reduxStore, ConfigurationEditor, mapStateToProps, mapDispatchToProps)
export default ConfigurationEditorComponent
