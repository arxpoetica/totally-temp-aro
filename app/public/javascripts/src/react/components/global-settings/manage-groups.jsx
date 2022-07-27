import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import GlobalsettingsActions from '../global-settings/globalsettings-action'

export class ManageGroups extends Component {constructor (props) {
	super(props);
	this.state = {
		group: {
			id:'',
			name: '',
			description:'',
			isAdministrator: false
		}
	}
}

	componentDidMount () {
		this.props.loadGroups()
	}
		
	componentWillReceiveProps(newProps) {
		let groups = newProps.groups
		if(groups !== null){
			groups.map((groupValue,index)=>{ 
				if(groupValue.isEditing){
					let group = this.state.group;
					group["id"] = groupValue.id;
					group["name"] = groupValue.name;
					group["description"] = groupValue.description;
					group["isAdministrator"] = groupValue.isAdministrator;
					this.setState({group:group})
				}
			})
		}
	}

	deleteGroup(id, name){
		this.props.askUserToConfirmBeforeDelete('Group', name)
		.then((okToDelete) => {
			if (okToDelete) {
				this.props.deleteGroup(id)
			}
		})
		.catch((err) => console.error(err))
	}

	addGroup () {
		this.props.addGroup()
	}

	editGroup(editGroup){
		let group = this.state.group;
		group["id"] = editGroup.id;
		group["name"] = editGroup.name;
		group["description"] = editGroup.description;
		group["isAdministrator"] = editGroup.isAdministrator;
		this.setState({group:group})
		this.props.editGroup(editGroup.id)
	}

	handleChange (e) {
		let group = this.state.group;
		group[e.target.name] = e.target.value;
		this.setState({ group: group });
	}

	handleAdminChange (event) {
		let group = this.state.group;
		group[event.target.name] = event.target.checked;
		if (event.target.checked) {
				group[event.target.name] = true;

		} else {
				group[event.target.name] = false;

		}
		this.setState({ group: group });
	}

	saveGroup(){
		this.props.saveGroup(this.state.group)
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
																				<div><input type="text" name="name" onChange={(e)=>this.handleChange(e)} className="form-control" value={this.state.group.name}/></div>
																				}
																		</td>
																		<td>
																				{!group.isEditing &&
																				<span>{group.description}</span>
																				}
																				{group.isEditing &&
																				<textarea type="text" name="description" onChange={(e)=>this.handleChange(e)} className="form-control" value={this.state.group.description}/>
																				}
																		</td>
																		<td>
																				{!group.isEditing &&
																						<input type="checkbox" disabled={true} className="checkboxfill" checked={group.isAdministrator === true ? 'checked' : ''}/>
																				}
																				{group.isEditing &&
																						<input type="checkbox" name="isAdministrator" onChange={(e)=>this.handleAdminChange(e)} className="checkboxfill" checked={this.state.group.isAdministrator === true ? 'checked' : ''}/>
																				}
																		</td>
																		<td style={{width: '90px'}}>
																				{!group.isEditing &&
																						<button className="btn btn-primary btn-sm" onClick={()=>this.editGroup(group)}><i className="fa fa-pencil-alt"></i></button>
																				}
																				{group.isEditing &&
																						<button className="btn btn-primary btn-sm" onClick={()=>this.saveGroup(group)}><i className="fa fa-save"></i></button>
																				}
																				<button className='btn btn-danger btn-sm' onClick={()=>this.deleteGroup(group.id, group.name)}><i className="fa fa-trash-alt"></i></button>
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
	deleteGroup: (id) => dispatch(GlobalsettingsActions.deleteGroup(id)),
	editGroup: (id) => dispatch(GlobalsettingsActions.editGroup(id)),
	saveGroup: (group) => dispatch(GlobalsettingsActions.saveGroup(group)),
	askUserToConfirmBeforeDelete: (title, text) => dispatch(GlobalsettingsActions.askUserToConfirmBeforeDelete(title, text))
})

const ManageGroupsComponent = wrapComponentWithProvider(reduxStore, ManageGroups, mapStateToProps, mapDispatchToProps)
export default ManageGroupsComponent