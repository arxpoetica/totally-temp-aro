/* globals swal */
import React, { Component, Fragment } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import PermissionsTable from './permissions-table.jsx'

export class ProjectPermissions extends Component {
  constructor (props) {
    super(props)
  }

  render () {
    if (!this.props.loggedInUser || !this.props.authPermissions['RESOURCE_ADMIN'])
      return null

    const project = { identifier:this.props.currentProjectTemplateId, dataType:"", name:"", permissions:63, id:this.props.currentProjectTemplateId}
    return (
      <Fragment>
        <div className='ei-table-contain' style={{ 'maxHeight': 'calc(100vh + 50rem)', 'overflow': 'scroll' }}>
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
