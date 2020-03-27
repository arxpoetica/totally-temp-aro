/* globals swal */
import React, { Component, Fragment } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import PermissionsTable from './permissions-table.jsx'
import PlanActions from '../../plan/plan-actions.js'

export class ProjectPermissions extends Component {
  constructor (props) {
    super(props)

    this.isAdmin = false
    this.state = {
      'openRowId': null,
      'selectedSourceName': 'all'
    }
  }

  render () {
    if (!this.props.loggedInUser || !this.props.authPermissions['RESOURCE_ADMIN']) return null // maybe fix this little hard code?
    if (this.props.loggedInUser.hasPermissions(this.props.authPermissions['RESOURCE_ADMIN'].permissionBits)) {
      this.isAdmin = true
    }

    const isOwner = true;
    const libItem = { identifier:this.props.currentProjectTemplateId, dataType:"location", name:"Businesses (InfoUSA 2018)", permissions:63, id:5}
    return (
      <Fragment>
        <div className='ei-table-contain' style={{ 'maxHeight': 'calc(100vh + 50rem)', 'overflow': 'scroll' }}>
          <PermissionsTable resource={libItem} resourceType='PROJECT_TEMPLATE' isOwner={isOwner} />
        </div>
      </Fragment>
    )
  }

  onDeleteRequest (libItem) {
    this.confirmDelete(libItem.name)
      .then((okToDelete) => {
        if (okToDelete) {
          this.props.deleteLibraryEntry(libItem)
        }
      })
      .catch((err) => console.error(err))
  }

  confirmDelete (name) {
    return new Promise((resolve, reject) => {
      swal({
        title: 'Delete data source?',
        text: `Are you sure you want to delete "${name}"?`,
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#DD6B55',
        confirmButtonText: 'Yes',
        cancelButtonText: 'No'
      }, (result) => {
        if (result) {
          resolve(true)
        } else {
          resolve(false)
        }
      })
    })
  }
}

// --- //

const mapStateToProps = (state) => ({
  currentProjectTemplateId: state.projectTemplate.currentProjectTemplateId,
  dataItems: state.plan.dataItems,
  loggedInUser: state.user.loggedInUser,
  uploadDataSources: state.plan.uploadDataSources,
  systemActors: state.user.systemActors,
  authPermissions: state.user.authPermissions
})

const mapDispatchToProps = dispatch => ({
  deleteLibraryEntry: (dataSource) => dispatch(PlanActions.deleteLibraryEntry(dataSource))
  // selectDataItems: (dataItemKey, selectedLibraryItems) => dispatch(PlanActions.selectDataItems(dataItemKey, selectedLibraryItems)),
  // setAllLibraryItems: (dataItemKey, allLibraryItems) => dispatch(PlanActions.setAllLibraryItems(dataItemKey, allLibraryItems))
})

const ProjectPermissionsComponent = wrapComponentWithProvider(reduxStore, ProjectPermissions, mapStateToProps, mapDispatchToProps)
export default ProjectPermissionsComponent
