import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { klona } from "klona"
import PlanActions from '../plan/plan-actions'
import './global-settings.css'
import { Modal, Button, Group } from '@mantine/core';
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

const views = Object.freeze({
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

export function GlobalSettings(props) {
  const [modal, setModal] = useState(true)
  const [breadCrumb, setBreadCrumb] = useState([])
  const [userIdForSettingsEdit, setUserIdForSettingsEdit] = useState('')
  const [resourceEditorProps, setResourceEditorProps] = useState('')
  const [dataUploadProps, setDataUploadProps] = useState('')
  const [dataSelectionID, setDataSelectionID] = useState('')

  // toggle = this.toggle.bind(this)
  // this.openUserSettingsForUserId = this.openUserSettingsForUserId.bind(this)

  useEffect(() => {
    if (props.isGlobalSettingsView) {
      setBreadCrumb(['Global Settings'])
      return
    }
  
    if (props.currentViewProps !== undefined) {
      if ((props.currentViewProps === 'Resource Managers'
        || props.currentViewProps === 'Upload Data Resources'
        || props.currentViewProps === 'My Account') && breadCrumb.length === 0) {
          const newBreadCrumbs = [props.currentViewProps]
          if (props.currentViewProps !== 'Global Settings') {
            newBreadCrumbs.unshift('Global Settings')
          }
          setBreadCrumb(newBreadCrumbs)
          setResourceEditorProps(props.resourceEditorProps)
          setDataUploadProps(props.dataUploadProps)
          setDataSelectionID(props.dataSelectionID)  
          return      
      } else {
        setBreadCrumb(breadCrumb)
        return
      }
    } else if (breadCrumb.length === 0) {
        if (props.currentUserView === 'Release Notes' && props.showGlobalSettings) {
          setBreadCrumb(['Global Settings', props.currentUserView])
          return
        }
        setBreadCrumb(['Global Settings'])
        return
    } else {
      setBreadCrumb(breadCrumb)
      return
    }
  }, [])

  const openUserSettingsForUserId = (userId, currentView) => {
    const breadCrumbClone = klona(breadCrumb);
    breadCrumbClone.push(currentView)
    setUserIdForSettingsEdit(userId)
    setBreadCrumb(breadCrumbClone)
  }
  
  const handleChangeView = (currentView) => {
    
    const breadCrumbClone = klona(breadCrumb);
    breadCrumbClone.push(currentView)
    setResourceEditorProps('all')
    setDataUploadProps('location')
    setDataSelectionID(1)
    setBreadCrumb(currentView === "Global Settings" ? [currentView] : breadCrumbClone)
    props.setIsRrmManager(false)
    props.searchManagers('')
    props.setGlobalSettingsView(false)
  }
  
  const toggle = () => {
    setModal(!modal)
    props.setIsResourceSelection(false)
    props.setIsDataSelection(false)
    props.setShowGlobalSettings(false)
    props.setIsRrmManager(false)
    props.setGlobalSettingsView(false)
    if (props.currentViewProps === views.MY_ACCOUNT) { props.openAccountSettingsModal(false) }
  }
  
  const back = () => {
    const breadCrumbClone = klona(breadCrumb);
    breadCrumbClone.pop()
    setBreadCrumb(breadCrumbClone)
  }

  const currentBreadCrumb = () => {
    return breadCrumb[breadCrumb.length - 1]
  }

  const { loggedInUser, isRrmManager, selectedResourceNameProps } = props
  // const { currentView, userIdForSettingsEdit, modal, dataUploadProps, dataSelectionID, resourceEditorProps } = this.state

  return(
    <Modal
      opened={modal}
      onClose={toggle}
      size={breadCrumb.length === 1 ? '40%' : 'xl'}
      title={breadCrumb.join(" > ")}
      overflow="inside"
    >
      {breadCrumb.length === 1 &&
        <div id="global-settings">
          <button
            className="btn btn-light settings-btn"
            onClick={() => handleChangeView(views.MY_ACCOUNT)}>
            <i className="fa fa-2x fa-user" />
            <br/>My Account
          </button>

          <button
            className="btn btn-light settings-btn"
            onClick={() => handleChangeView(views.MULTIFACTOR_AUTHENTICATION)}>
            <i className="fa fa-2x fa-user-shield" />
            <br/>Multi Factor Authentication
          </button>

          {loggedInUser.isAdministrator &&
            <button
              className="btn btn-light settings-btn"
              onClick={() => handleChangeView(views.MANAGE_USERS)}>
              <i className="fa fa-2x fa-users" />
              <br/>Manage Users
            </button>
          }

          {loggedInUser.isAdministrator &&
            <button
              className="btn btn-light settings-btn"
              onClick={() => handleChangeView(views.MANAGE_GROUPS)}>
              <i className="fa fa-2x fa-users" />
              <br/>Manage Groups
            </button>
          }

          <button
            className="btn btn-light settings-btn"
            onClick={() => openUserSettingsForUserId(loggedInUser.id, views.USER_SETTINGS)}>
            <i className="fa fa-2x fa-cogs" />
            <br/>User Settings
          </button>

          {loggedInUser.isAdministrator &&
            <button
              className="btn btn-light settings-btn"
              onClick={() => handleChangeView(views.TAG_MANAGER)}>
              <i className="fa fa-2x fa-tags" />
              <br/>Tag Manager
            </button>
          }

          <button
            className="btn btn-light settings-btn notification"
            onClick={() => handleChangeView(views.RELEASE_NOTES)}>
            <i className="fa fa-2x fa-bell" />
            <br/>Release Notes
          </button>

          {loggedInUser.isAdministrator &&
            <button
              className="btn btn-light settings-btn"
              onClick={() => handleChangeView(views.CONFIGURATION_EDITOR)}>
              <i className="fa fa-2x fa-sliders-h" />
              <br/>Configuration Editor
            </button>
          }

          {loggedInUser.isAdministrator &&
            <button
              className="btn btn-light settings-btn"
              onClick={() => handleChangeView(views.REPORTS_EDITOR)}>
              <i className="fas fa-2x fa-file-download" />
              <br/>Reports Editor
            </button>
          }

          {loggedInUser.isAdministrator &&
            <button
              className="btn btn-light settings-btn"
              onClick={() => handleChangeView(views.DATA_UPLOAD)}>
              <i className="fa fa-2x fa-upload" />
              <br/>Data Upload
            </button>
          }

          {loggedInUser.isAdministrator &&
            <button
              className="btn btn-light settings-btn"
              onClick={() => handleChangeView(views.RESOURCE_EDITOR)}>
              <i className="fa fa-2x fa-edit" />
              <br/>Resource Editor
            </button>
          }

          {loggedInUser.isAdministrator &&
            <button
              className="btn btn-light settings-btn"
              onClick={() => handleChangeView(views.BROADCAST)}>
              <i className="fa fa-2x fa-bullhorn" />
              <br/>BroadCast
            </button>
          }
        </div>
      }

      {/* Other Components */}

      {currentBreadCrumb() === views.MY_ACCOUNT &&
        <MyAccount/>
      }
      {currentBreadCrumb() === views.MULTIFACTOR_AUTHENTICATION &&
        <MultiFactor/>
      }
      {currentBreadCrumb() === views.MANAGE_USERS &&
        <ManageUsers openUserSettingsForUserId={openUserSettingsForUserId}/>
      }
      {currentBreadCrumb() === views.MANAGE_GROUPS &&
        <ManageGroups/>
      }
      {currentBreadCrumb() === views.USER_SETTINGS &&
        <UserSettings userIdForSettingsEdit={userIdForSettingsEdit}/>
      }
      {currentBreadCrumb() === views.TAG_MANAGER &&
        <TagManager/>
      }
      {currentBreadCrumb() === views.RELEASE_NOTES &&
        <ReleaseNotes/>
      }
      {currentBreadCrumb() === views.CONFIGURATION_EDITOR &&
        <ConfigurationEditor/>
      }
      {currentBreadCrumb() === views.REPORTS_EDITOR &&
        <ReportModuleList/>
      }
      {currentBreadCrumb() === views.DATA_UPLOAD &&
        <DataUpload
          selectedDataSourceName={dataUploadProps}
          selectedDataTypeId={dataSelectionID}
          onSave={() => {toggle()}}
        />
      }
      {currentBreadCrumb() === views.RESOURCE_EDITOR &&
        <ResourceEditor
          filterText={resourceEditorProps}
          selectedResourceName={selectedResourceNameProps}
        />
      }
      {currentBreadCrumb() === views.BROADCAST &&
        <Broadcast/>
      }

      {currentBreadCrumb() === views.GLOBAL_SETTINGS
        ? <Button color="primary" onClick={toggle}>Close</Button>
        : <Button color="primary" onClick={back}>Back</Button>
      }
    </Modal>
  )
}

const mapStateToProps = (state) => ({
  loggedInUser: state.user.loggedInUser,
  modalTitle: state.resourceEditor.modalTitle,
  isRrmManager: state.resourceEditor.isRrmManager,
  isGlobalSettingsView: state.globalSettings.isGlobalSettingsView,
  currentUserView: state.globalSettings.currentView,
  showGlobalSettings: state.globalSettings.showGlobalSettings,
})

const mapDispatchToProps = (dispatch) => ({
  setIsResourceSelection: (status) => dispatch(PlanActions.setIsResourceSelection(status)),
  setIsDataSelection: (status) => dispatch(PlanActions.setIsDataSelection(status)),
  setShowGlobalSettings: (status) => dispatch(GlobalsettingsActions.setShowGlobalSettings(status)),
  setIsRrmManager: (status) => dispatch(ResourceActions.setIsRrmManager(status)),
  searchManagers: (searchText) => dispatch(ResourceActions.searchManagers(searchText)),
  setGlobalSettingsView: (status) => dispatch(GlobalsettingsActions.setGlobalSettingsView(status)),
})

const GlobalSettingsComponent = connect(mapStateToProps, mapDispatchToProps)(GlobalSettings)
export default GlobalSettingsComponent
