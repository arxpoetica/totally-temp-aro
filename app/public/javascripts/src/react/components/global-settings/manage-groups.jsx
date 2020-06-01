import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import GlobalsettingsActions from '../global-settings/globalsettings-action'
import AroHttp from '../../common/aro-http'

export class ManageGroups extends Component {constructor (props) {
    super(props);
    this.state = {

    }
}

    componentDidMount () {
        this.props.loadGroups()
    }

    deleteGroup(id){
        this.props.deleteGroup(id)
    }

    addGroup () {
        this.props.addGroup()
    }

    editGroup(group){
        console.log(group)
        group.isEditing = true
        console.log(group)
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
            
            <div style={{display:'flex', flexDirection: 'column', height: '100%'}}>
                <div style={{flex: '1 1 auto', overflowY: 'auto'}}>
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
                                            {!group.isEditing &&
                                            <div><span>{group.name}</span></div>
                                            }
                                            {group.isEditing &&
                                            <div><input type="text" className="form-control" value={group.name}/></div>
                                            }
                                        </td>
                                        <td>
                                            {!group.isEditing &&
                                            <span>{group.description}</span>
                                            }
                                            {group.isEditing &&
                                            <textarea type="text" className="form-control" value={group.description}/>
                                            }
                                        </td>
                                        <td>
                                            <input type="checkbox" className="checkboxfill" value={group.isAdministrator} disabled={!group.isEditing}/>
                                        </td>
                                        <td style={{width: '120px'}}>
                                            <button className="btn btn-primary btn-sm" onClick={()=>this.editGroup(group)}><i className="fa fa-pencil-alt"></i></button>
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
                {this.props.userMessage.show &&
                    <div className="alert alert-success mt-3">
                        <span>{this.props.userMessage.text}</span>
                    </div>
                }
            </div>
        )
    }
}


const mapStateToProps = (state) => ({
    permission: state.globalSettings.permission,
    acl: state.globalSettings.acl,
    groups: state.globalSettings.groups,
    userMessage: state.globalSettings.userMessage
})

const mapDispatchToProps = (dispatch) => ({
    loadGroups: () => dispatch(GlobalsettingsActions.loadGroups()),
    addGroup: () => dispatch(GlobalsettingsActions.addGroup()),
    deleteGroup: (id) => dispatch(GlobalsettingsActions.deleteGroup(id))
})

const ManageGroupsComponent = wrapComponentWithProvider(reduxStore, ManageGroups, mapStateToProps, mapDispatchToProps)
export default ManageGroupsComponent