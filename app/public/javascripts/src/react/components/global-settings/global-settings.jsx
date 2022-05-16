import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { klona } from "klona"
import PlanActions from '../plan/plan-actions'
import './global-settings.css'
import { Modal, Button } from '@mantine/core';
import ModalBreadCrumb from './bread-crumb.jsx'
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
  BROADCAST: 'Broadcast'
})

export function GlobalSettings(props) {
  const [modal, setModal] = useState(true)
  const [breadCrumb, setBreadCrumb] = useState([])
  const [userIdForSettingsEdit, setUserIdForSettingsEdit] = useState('')
  const [resourceEditorProps, setResourceEditorProps] = useState('')
  const [dataUploadProps, setDataUploadProps] = useState('')
  const [dataSelectionID, setDataSelectionID] = useState('')
  const buttons = [
    { title: views.MY_ACCOUNT, className: "fa-user", conditional: true },
    { title: views.MULTIFACTOR_AUTHENTICATION, className: "fa-user-shield", conditional: true },
    { title: views.MANAGE_USERS, className: "fa-users", conditional: props.loggedInUser.isAdministrator },
    { title: views.MANAGE_GROUPS, className: "fa-users", conditional: props.loggedInUser.isAdministrator },
    { title: views.USER_SETTINGS, className: "fa-cogs", conditional: true },
    { title: views.TAG_MANAGER, className: "fa-tags", conditional: props.loggedInUser.isAdministrator },
    { title: views.RELEASE_NOTES, className: "fa-bell", conditional: true },
    { title: views.CONFIGURATION_EDITOR, className: "fa-sliders-h", conditional: props.loggedInUser.isAdministrator },
    { title: views.REPORTS_EDITOR, className: "fa-file-download", conditional: props.loggedInUser.isAdministrator },
    { title: views.DATA_UPLOAD, className: "fa-upload", conditional: props.loggedInUser.isAdministrator },
    { title: views.RESOURCE_EDITOR, className: "fa-edit", conditional: props.loggedInUser.isAdministrator },
    { title: views.BROADCAST, className: "fa-bullhorn", conditional: props.loggedInUser.isAdministrator },
  ]

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
    if(!Object.values(views).includes(currentBreadCrumb())) {
      props.setIsResourceEditor(true)
    } else {
      const breadCrumbClone = klona(breadCrumb);
      breadCrumbClone.pop()
      setBreadCrumb(breadCrumbClone)
    }
  }

  const currentBreadCrumb = () => {
    return breadCrumb[breadCrumb.length - 1]
  }

  const renderBreadCrumb = () => {
    return <ModalBreadCrumb breadCrumb={breadCrumb} />
  }

  const { loggedInUser, isRrmManager, selectedResourceNameProps } = props

  return(
    <Modal
      opened={modal}
      onClose={toggle}
      size={
        breadCrumb.length === 1 
          ? '40%' 
          : !Object.values(views).includes(currentBreadCrumb()) 
            ? '60%' 
            :'xl'
      }
      title={renderBreadCrumb()}
      overflow="inside"
    >
      {breadCrumb.length === 1 &&
        <div id="global-settings">
          {buttons.map(buttonInfo => {
            if (buttonInfo.conditional) {
              return (
                <button
                  key={buttonInfo.title}
                  className="btn btn-light settings-btn"
                  onClick={() => 
                    buttonInfo.title === views.USER_SETTINGS 
                      ? openUserSettingsForUserId(loggedInUser.id, views.USER_SETTINGS)
                      : handleChangeView(buttonInfo.title)
                  }
                >
                  <i className={`fa fa-2x ${buttonInfo.className}`} />
                  <br/>{buttonInfo.title}
                </button>
              )
            } else {
              return <></>
            }
          })}
        </div>
      }

      {/* Other Components */}

      {breadCrumb.includes(views.MY_ACCOUNT) &&
        <MyAccount/>
      }
      {breadCrumb.includes(views.MULTIFACTOR_AUTHENTICATION) &&
        <MultiFactor/>
      }
      {breadCrumb.includes(views.MANAGE_USERS) &&
        <ManageUsers openUserSettingsForUserId={openUserSettingsForUserId}/>
      }
      {breadCrumb.includes(views.MANAGE_GROUPS) &&
        <ManageGroups/>
      }
      {breadCrumb.includes(views.USER_SETTINGS) &&
        <UserSettings userIdForSettingsEdit={userIdForSettingsEdit}/>
      }
      {breadCrumb.includes(views.TAG_MANAGER) &&
        <TagManager/>
      }
      {breadCrumb.includes(views.RELEASE_NOTES) &&
        <ReleaseNotes/>
      }
      {breadCrumb.includes(views.CONFIGURATION_EDITOR) &&
        <ConfigurationEditor/>
      }
      {breadCrumb.includes(views.REPORTS_EDITOR) &&
        <ReportModuleList/>
      }
      {breadCrumb.includes(views.DATA_UPLOAD) &&
        <DataUpload
          selectedDataSourceName={dataUploadProps}
          selectedDataTypeId={dataSelectionID}
          onSave={() => {toggle()}}
        />
      }
      {breadCrumb.includes(views.RESOURCE_EDITOR) &&
        <ResourceEditor
          breadCrumb={breadCrumb}
          setBreadCrumb={setBreadCrumb}
          filterText={resourceEditorProps}
          selectedResourceName={selectedResourceNameProps}
        />
      }
      {breadCrumb.includes(views.BROADCAST) &&
        <Broadcast/>
      }

      {
        currentBreadCrumb() === views.GLOBAL_SETTINGS
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
  setIsResourceEditor: (status) => dispatch(ResourceActions.setIsResourceEditor(status)),
})

const GlobalSettingsComponent = connect(mapStateToProps, mapDispatchToProps)(GlobalSettings)
export default GlobalSettingsComponent
