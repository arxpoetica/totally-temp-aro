import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import ConfigurationActions from '../configuration/configuration-actions'
import SettingsEditor from './settings-editor.jsx'
import AssetManager from './asset-manager.jsx'

export class ConfigurationEditor extends Component {
  constructor (props) {
    super(props)
    this.navs = Object.freeze({
      SETTINGS: 'Settings',
      ASSET_MANAGER: 'Asset Manager'
    })
    this.state = {
      showInitialWarning: true,
      selectedNav: this.navs.SETTINGS
    }
  }

  render () {
    return <div>
      { this.state.showInitialWarning
        ? this.renderWarningMessage()
        : this.renderControls()
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

  renderControls () {
    return <div>
      <ul className='nav nav-tabs' style={{ marginBottom: '10px' }}>
        <li className='nav-item' onClick={() => this.setState({ selectedNav: this.navs.SETTINGS })}>
          <a className={`nav-link ${this.state.selectedNav === this.navs.SETTINGS ? 'active' : ''}`} href='#'>
            {this.navs.SETTINGS}
          </a>
        </li>
        <li className='nav-item' onClick={() => this.setState({ selectedNav: this.navs.ASSET_MANAGER })}>
          <a className={`nav-link ${this.state.selectedNav === this.navs.ASSET_MANAGER ? 'active' : ''}`} href='#'>
            {this.navs.ASSET_MANAGER}
          </a>
        </li>
      </ul>
      {
        (this.state.selectedNav === this.navs.SETTINGS)
          ? <SettingsEditor id='compSettingsEditor' />
          : <AssetManager />
      }
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
