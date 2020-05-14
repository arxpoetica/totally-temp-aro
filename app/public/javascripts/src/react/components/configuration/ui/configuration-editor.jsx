import React, { Component } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import UiActions from './ui-actions'
import SettingsEditor from './settings-editor.jsx'
import AssetManager from './asset-manager.jsx'
import StylesheetsManager from './stylesheets-manager.jsx'
import EtlTemplateManager from './etl-template-manager.jsx'

export class ConfigurationEditor extends Component {
  constructor (props) {
    super(props)
    this.navs = Object.freeze({
      SETTINGS: 'Settings',
      ASSET_MANAGER: 'Asset Manager',
      STYLESHEETS: 'Stylesheets',
      ETL_TEMPLATE_MANAGER: 'Templates'
    })
    this.state = {
      showInitialWarning: true,
      selectedNav: this.navs.SETTINGS
    }
  }
  navSelection () {
    let val = this.state.selectedNav

    if (val === 'Settings') {
      return (
        <SettingsEditor id='compSettingsEditor' />
      )
    } else if (val === 'Asset Manager') {
      return (
        <AssetManager />
      )
    } else if (val === 'Stylesheets') {
      return (
        <StylesheetsManager />
      )
    } else {
      return (
        <EtlTemplateManager />
      )
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
        <li className='nav-item' onClick={() => this.setState({ selectedNav: this.navs.STYLESHEETS })}>
          <a className={`nav-link ${this.state.selectedNav === this.navs.STYLESHEETS ? 'active' : ''}`} href='#'>
            {this.navs.STYLESHEETS}
          </a>
        </li>
        <li className='nav-item' onClick={() => this.setState({ selectedNav: this.navs.ETL_TEMPLATES })}>
          <a className={`nav-link ${this.state.selectedNav === this.navs.ETL_TEMPLATES ? 'active' : ''}`} href='#'>
            {this.navs.ETL_TEMPLATE_MANAGER}
          </a>
        </li>
      </ul>
      {
        this.navSelection()
        // (this.state.selectedNav === this.navs.SETTINGS)
        //   ? <SettingsEditor id='compSettingsEditor' />
        //   : <AssetManager />
      }
    </div>
  }
}

ConfigurationEditor.propTypes = {}

const mapStateToProps = (state) => ({})

const mapDispatchToProps = (dispatch, ownProps) => ({
  saveConfigurationToServerAndReload: (type, configuration) => dispatch(UiActions.saveConfigurationToServerAndReload(type, configuration))
})

const ConfigurationEditorComponent = wrapComponentWithProvider(reduxStore, ConfigurationEditor, mapStateToProps, mapDispatchToProps)
export default ConfigurationEditorComponent
