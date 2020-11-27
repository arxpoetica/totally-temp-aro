import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import PlanActions from '../plan/plan-actions'
import './global-settings.css';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import GlobalsettingsActions from './globalsettings-action'
import ResourceActions from '../resource-editor/resource-actions'

import MyAccount from '../user/my-account.jsx'
import MultiFactor from './multi-factor.jsx'
import ManageUsers from '../user/manage-users.jsx'
import ManageGroups from './manage-groups.jsx'
import UserSettings from '../user/user-settings.jsx'
import TagManager from './tag-manager.jsx'
import ReleaseNotes from './release-notes.jsx'
import ConfigurationEditor from '../configuration/ui/configuration-editor.jsx'
import ReportModuleList from '../configuration/report/report-module-list.jsx'
import DataUpload from '../data-upload/data-upload.jsx'
import ResourceEditor from '../resource-editor/resource-editor.jsx'
import Broadcast from './broadcast.jsx'

export class GlobalSettings extends Component {
  constructor (props) {
    super(props);

    this.views = Object.freeze({
      GLOBAL_SETTINGS: 'Global Settings',
      MY_ACCOUNT: 'My Account',
      MULTIFACTOR_AUTHENTICATION: 'Multi Factor Authentication',
      MANAGE_USERS: 'Manage Users',
      MANAGE_GROUPS: 'Manage Groups',
      USER_SETTINGS: 'User Settings',
      TAG_MANAGER: 'Tag Manager',
      RELEASE_NOTES: 'Release Notes',
      CONFIGURATION_EDITOR: 'Configuration Editor',
      REPORTS_EDITOR: 'Reports Editor',
      DATA_UPLOAD: 'Upload Data Resources',
      RESOURCE_EDITOR: 'Resource Managers',
      BROADCAST: 'BROADCAST'
    })

    this.state = {
      modal: true,
      currentView: '',
      userIdForSettingsEdit: '',
      resourceEditorProps: '',
      dataUploadProps: '',
      dataSelectionID: ''
    }    

    this.toggle = this.toggle.bind(this);
    this.openUserSettingsForUserId = this.openUserSettingsForUserId.bind(this);
  }

  static getDerivedStateFromProps(nextProps, prevState) {

    if(nextProps.currentViewProps !== undefined){
      if((nextProps.currentViewProps === 'Resource Managers' || nextProps.currentViewProps === 'Upload Data Resources') && prevState.currentView === ''){
        return {
          currentView: nextProps.currentViewProps,
          resourceEditorProps: nextProps.resourceEditorProps,
          dataUploadProps:  nextProps.dataUploadProps,
          dataSelectionID: nextProps.dataSelectionID,
        };
      } else {
        return {
          currentView: prevState.currentView,
        };
      }
    } else if(prevState.currentView === ''){
      return {
        currentView: 'Global Settings'
      };
    } else{
      return {
        currentView: prevState.currentView
      };
    }
  }

  render () {
    const {loggedInUser, isRrmManager} = this.props
    const {currentView, userIdForSettingsEdit} = this.state

    return(
      <div>
        <Modal isOpen={this.state.modal} toggle={this.toggle} 
        size={ currentView === this.views.RESOURCE_EDITOR && isRrmManager === true 
                ? 'xl'
                : currentView === this.views.MANAGE_USERS || currentView === this.views.REPORTS_EDITOR ||
                  currentView === this.views.DATA_UPLOAD || currentView === this.views.RESOURCE_EDITOR
                  ? 'lg'
                  : 'md'
              }
        >
        <ModalHeader toggle={this.toggle}>
          {currentView === this.views.RESOURCE_EDITOR
            ? this.props.modalTitle
            : currentView
          }
          </ModalHeader>
          <ModalBody style={{height: '500px',overflow: 'auto'}}>

            {currentView === this.views.GLOBAL_SETTINGS &&
              <div id="global-settings">
                <button className="btn btn-light settings-btn" onClick={(e) => this.handleChangeView(this.views.MY_ACCOUNT)}>
                  <i className="fa fa-2x fa-user"></i>
                  <br/>My Account
                </button>
                
                <button className="btn btn-light settings-btn" onClick={(e) => this.handleChangeView(this.views.MULTIFACTOR_AUTHENTICATION)}>
                  <i className="fa fa-2x fa-user-shield"></i>
                  <br/>Multi Factor Authentication
                </button>

                {loggedInUser.isAdministrator &&
                  <button className="btn btn-light settings-btn" onClick={(e) => this.handleChangeView(this.views.MANAGE_USERS)}>
                    <i className="fa fa-2x fa-users"></i>
                    <br/>Manage Users
                  </button>
                }

                {loggedInUser.isAdministrator &&
                  <button className="btn btn-light settings-btn" onClick={(e) => this.handleChangeView(this.views.MANAGE_GROUPS)}>
                    <i className="fa fa-2x fa-users"></i>
                    <br/>Manage Groups
                  </button>
                }

                <button className="btn btn-light settings-btn" onClick={(e) => this.openUserSettingsForUserId(loggedInUser.id, this.views.USER_SETTINGS)}>
                  <i className="fa fa-2x fa-cogs"></i>
                  <br/>User Settings
                </button>

                {loggedInUser.isAdministrator &&
                  <button className="btn btn-light settings-btn" onClick={(e) => this.handleChangeView(this.views.TAG_MANAGER)}>
                    <i className="fa fa-2x fa-tags"></i>
                    <br/>Tag Manager
                  </button>
                }

                <button className="btn btn-light settings-btn notification" onClick={(e) => this.handleChangeView(this.views.RELEASE_NOTES)}>
                  <i className="fa fa-2x fa-bell"></i>
                  <br/>Release Notes
                </button>

                {loggedInUser.isAdministrator &&
                  <button className="btn btn-light settings-btn" onClick={(e) => this.handleChangeView(this.views.CONFIGURATION_EDITOR)}>
                    <i className="fa fa-2x fa-sliders-h"></i>
                    <br/>Configuration Editor
                  </button>
                }

                {loggedInUser.isAdministrator &&
                  <button className="btn btn-light settings-btn" onClick={(e) => this.handleChangeView(this.views.REPORTS_EDITOR)}>
                    <i className="fas fa-2x fa-file-download"></i>
                    <br/>Reports Editor
                  </button>
                }

                {loggedInUser.isAdministrator &&
                  <button className="btn btn-light settings-btn" onClick={(e) => this.handleChangeView(this.views.DATA_UPLOAD)}>
                    <i className="fa fa-2x fa-upload"></i>
                    <br/>Data Upload
                  </button>
                }

                {loggedInUser.isAdministrator &&
                  <button className="btn btn-light settings-btn" onClick={(e) => this.handleChangeView(this.views.RESOURCE_EDITOR)}>
                    <i className="fa fa-2x fa-edit"></i>
                    <br/>Resource Editor
                  </button>
                }

                {loggedInUser.isAdministrator &&
                  <button className="btn btn-light settings-btn" onClick={(e) => this.handleChangeView(this.views.BROADCAST)}>
                    <i className="fa fa-2x fa-bullhorn"></i>
                    <br/>BroadCast
                  </button>
                }
              </div>
            }

            {/* Other Components */}

            {currentView === this.views.MY_ACCOUNT &&
              <MyAccount/>
            }
            {currentView === this.views.MULTIFACTOR_AUTHENTICATION &&
              <MultiFactor/>
            }
            {currentView === this.views.MANAGE_USERS &&
              <ManageUsers openUserSettingsForUserId={this.openUserSettingsForUserId}/>
            }
            {currentView === this.views.MANAGE_GROUPS &&
              <ManageGroups/>
            }
            {currentView === this.views.USER_SETTINGS &&
              <UserSettings userIdForSettingsEdit={userIdForSettingsEdit}/>
            }
            {currentView === this.views.TAG_MANAGER &&
              <TagManager/>
            }
            {currentView === this.views.RELEASE_NOTES &&
              <ReleaseNotes/>
            }
            {currentView === this.views.CONFIGURATION_EDITOR &&
              <ConfigurationEditor/>
            }
            {currentView === this.views.REPORTS_EDITOR &&
              <ReportModuleList/>
            }
            {currentView === this.views.DATA_UPLOAD &&
              <DataUpload selectedDataSourceName={this.state.dataUploadProps}
                          selectedDataTypeId={this.state.dataSelectionID}
                          onSave={() => {this.toggle()}}
                          />
            }
            {currentView === this.views.RESOURCE_EDITOR &&
              <ResourceEditor filterText={this.state.resourceEditorProps} selectedResourceName={this.props.selectedResourceNameProps}/>
            }    
            {currentView === this.views.BROADCAST &&
              <Broadcast/>
            }

          </ModalBody>
          <ModalFooter>
            {currentView === this.views.GLOBAL_SETTINGS
              ? <Button color="primary" onClick={this.toggle}>Close</Button>
              : <Button color="primary" onClick={(e) => this.handleChangeView(this.views.GLOBAL_SETTINGS)}>Back</Button>
            }
          </ModalFooter>
        </Modal>
      </div>
    )
  }

  openUserSettingsForUserId(userId, currentView){
    this.setState({ userIdForSettingsEdit: userId, currentView: currentView });
  }

  handleChangeView(currentView){
    this.setState({ currentView: currentView, resourceEditorProps: 'all', dataUploadProps : 'location', dataSelectionID: 1});
    this.props.setIsRrmManager(false)
  }
  
  toggle() {
    this.setState({ modal: !this.state.modal});
    this.props.setIsResourceSelection(false)
    this.props.setIsDataSelection(false)
    this.props.setShowGlobalSettings(false)
    this.props.setIsRrmManager(false)
  }
}

const mapStateToProps = (state) => ({
  loggedInUser: state.user.loggedInUser,
  modalTitle: state.resourceEditor.modalTitle,
  isRrmManager: state.resourceEditor.isRrmManager,
})

const mapDispatchToProps = (dispatch) => ({
  setIsResourceSelection: (status) => dispatch(PlanActions.setIsResourceSelection(status)),
  setIsDataSelection: (status) => dispatch(PlanActions.setIsDataSelection(status)),
  setShowGlobalSettings: (status) => dispatch(GlobalsettingsActions.setShowGlobalSettings(status)),
  setIsRrmManager: (status) => dispatch(ResourceActions.setIsRrmManager(status)),
})

const GlobalSettingsComponent = wrapComponentWithProvider(reduxStore, GlobalSettings, mapStateToProps, mapDispatchToProps)
export default GlobalSettingsComponent