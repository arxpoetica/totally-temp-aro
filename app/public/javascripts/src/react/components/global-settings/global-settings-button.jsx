import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import GlobalsettingsActions from './globalsettings-action'
import GlobalSettings from './global-settings.jsx'

export class GlobalSettingsButton extends Component {
  constructor (props) {
    super(props);

    this.state = {
    }    
  }

  render () {
   return(
      <div>
        <button className="btn"
          data-toggle="tooltip"
          data-placement="bottom"
          title="Global Settings..."
          onClick={(e) => this.showGlobalSettings()}>
          <i className="fa fa-th"></i>
        </button>
        {this.props.showGlobalSettings &&
          <GlobalSettings/>
        }
      </div>
    )
  }

  showGlobalSettings(){
    this.props.setShowGlobalSettings(true)
  }
}

const mapStateToProps = (state) => ({
	showGlobalSettings: state.globalSettings.showGlobalSettings,
})

const mapDispatchToProps = (dispatch) => ({
  setShowGlobalSettings: (status) => dispatch(GlobalsettingsActions.setShowGlobalSettings(status))
})

const GlobalSettingsButtonComponent = wrapComponentWithProvider(reduxStore, GlobalSettingsButton, mapStateToProps, mapDispatchToProps)
export default GlobalSettingsButtonComponent