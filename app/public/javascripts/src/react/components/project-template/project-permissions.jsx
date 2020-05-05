import React, { Component, Fragment } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import PermissionsTable from '../acl/resource-permissions/permissions-table.jsx'

export class ProjectPermissions extends Component {
  constructor (props) {
    super(props)
  }

  render () {
    if (!this.props.loggedInUser || !this.props.authPermissions['RESOURCE_ADMIN'])
      return null

    // dataType, name, permission and id are not used by PermissionTable this.component
    // so the value passed are ignored. Only identifier is used downstream
    const project = { identifier:this.props.currentProjectTemplateId, dataType:"", name:"", permissions:63, id:this.props.currentProjectTemplateId}
    return (
      <Fragment>
        <div className='ei-table-contain' style={{ 'overflow': 'scroll' }}>
          {/* We pass isOwner=true because user cannot get here if he is not a owner */}
          <PermissionsTable resource={project} resourceType='PROJECT_TEMPLATE' isOwner={true} />
        </div>
      </Fragment>
    )
  }
}

const mapStateToProps = (state) => ({
  currentProjectTemplateId: state.projectTemplate.currentProjectTemplateId,
  loggedInUser: state.user.loggedInUser,
  authPermissions: state.user.authPermissions
})

const mapDispatchToProps = dispatch => ({
})

const ProjectPermissionsComponent = wrapComponentWithProvider(reduxStore, ProjectPermissions, mapStateToProps, mapDispatchToProps)
export default ProjectPermissionsComponent
