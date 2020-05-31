import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import GlobalsettingsActions from '../global-settings/globalsettings-action'
import AroHttp from '../../common/aro-http'

export class ManageGroups extends Component {constructor (props) {
    super(props);
    this.state = {
        userMessage : {
            show: false,
            type: '',
            text: ''
        }
    }
}

    componentDidMount () {
        this.props.loadGroups()
    }

    deleteGroup(id){
        AroHttp.delete(`/service/auth/groups/${id}`)
          .then(result => {
            let userMessage = {
                show: true,
                type: 'success',
                text: 'Group deleted successfully'
            }
            this.setState({userMessage: userMessage})
          })
          .catch(err => console.error(err))
    }

    addGroup () {
        // Create a group in aro-service and then add it to our groups list. This ensures we will have a valid group id.
        // Don't do anything with ACL as the default is a non-administrator group
        /*groups.forEach((group) => group.isEditing = false)

        AroHttp.post('/service/auth/groups', {
          name: `Group ${Math.round(Math.random() * 10000)}`, // Try to not have a duplicate group name
          description: 'Group Description'
        })
        .then((result) => {
            var group = result.data
            group.isEditing = true
            groups.push(group)
        })
        .catch((err) => console.error(err))*/
        this.props.addGroup()
    }

    render () {
        return this.props.permission ===null && this.props.groups===null && this.props.acl === null
        ? null
        : <div>{this.renderManageGroups()}</div>
    }

    renderManageGroups () {

        let groups = []
        
        if(this.props.permission !==null && this.props.groups!==null && this.props.acl !== null){
            let userAdminPermissions = false
            let permissions = this.props.permission
            let acls = this.props.acl

            groups = this.props.groups
            userAdminPermissions = permissions.filter((item) => item.name === 'USER_ADMIN')[0].id
            
            let groupIdToGroup = {}
            groups.forEach((group) => group.isEditing = false)
            groups.forEach((group) => groupIdToGroup[group.id] = group)
            
            // For each group, we want to determine whether the "Administrator" flag should be set.
            // The "userAdminPermissions" is a bit flag. When set, then the system actor (user/group) is an administrator.
            acls.resourcePermissions.forEach((resourcePermission) => {
                const isAdministrator = (resourcePermission.rolePermissions & userAdminPermissions) > 0
                if (groupIdToGroup.hasOwnProperty(resourcePermission.systemActorId)) {
                    groupIdToGroup[resourcePermission.systemActorId].isAdministrator = isAdministrator
                }
            })
        }

        return (
            <div>
                <div>
                    <table className="table table-striped">
                        <thead>
                            <tr>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Admin</th>
                            <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                        
                            {
                                groups.map((group,index)=>{  
                                    return <tr key={index}>
                                        <td>
                                            <span>{group.name}</span>
                                        </td>
                                        <td>
                                            <span>{group.description}</span>
                                        </td>
                                        <td>
                                            <input type="checkbox" className="checkboxfill" />
                                        </td>
                                        <td>
                                            <button className="btn btn-primary btn-sm" ><i className="fa fa-pencil-alt"></i></button>
                                            <button className="btn btn-primary btn-sm" ><i className="fa fa-save"></i></button>
                                            <button className='btn btn-danger btn-sm' onClick={()=>this.deleteGroup(group.id)}><i className="fa fa-trash-alt"></i></button>
                                        </td>
                                    </tr>
                                })
                            }
                            
                        </tbody>
                    </table>
                </div>
                <div>
                    <button className="btn btn-light" onClick={()=>this.addGroup()}><i className="fa fa-plus"></i>&nbsp; Add new group</button>
                </div>
                {!this.state.userMessage.show &
                    <div>
                        <span>{this.state.userMessage.text}</span>
                    </div>
                }
            </div>
        )
    }
}


const mapStateToProps = (state) => ({
    permission: state.globalSettings.permission,
    acl: state.globalSettings.acl,
    groups: state.globalSettings.groups
})

const mapDispatchToProps = (dispatch) => ({
    loadGroups: () => dispatch(GlobalsettingsActions.loadGroups()),
    addGroup: () => dispatch(GlobalsettingsActions.addGroup())
})

const ManageGroupsComponent = wrapComponentWithProvider(reduxStore, ManageGroups, mapStateToProps, mapDispatchToProps)
export default ManageGroupsComponent