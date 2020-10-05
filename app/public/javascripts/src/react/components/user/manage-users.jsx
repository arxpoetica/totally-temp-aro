import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import UserActions from './user-actions'
import Select, { components } from "react-select";
import createClass from "create-react-class";
import ReactPaginate from 'react-paginate';
import UserSettings from './user-settings.jsx'

export class ManageUsers extends Component {constructor (props) {
  super(props)
  this.emailLabel = 'Email'
  this.state = {
    newUser:{
      firstName:'',
      lastName:'',
      email:'',
      confirmEmail:'',
      companyName: '',
      groups:{},
      isGlobalSuperUser:false,
      groupIds: []
    },
    mail:{
      mailSubject:'',
      mailBody:''
    },
    selectedPage:0,
    searchText:'',
    selectedNav: '',
    userIdForSettingsEdit: ''
  }
}

  componentDidMount () {
    this.props.loadGroups()
    this.props.loadUsers()
  }

  handlePageClick (data) { 
    this.props.handlePageClick(data.selected)
    this.setState({selectedPage: data.selected})
  }

  searchUsers() {
    let searchText = this.state.searchText;
    this.props.searchUsers(searchText)
    this.setState({searchText: searchText})
  }

  render () {
    if (this.props.clientId.toLowerCase() === 'frontier') {
      this.emailLabel = 'Corp ID'
    }
    return this.props.userList===null
    ? null
    : <>{this.renderUserList()}</>
  }

  renderUserList () {

    const users = this.props.pageableData.paginateData

    let defaultIndex = 0;
    let optionsList = this.props.allGroups.map(function(newkey, index) { 
      if(newkey.name === 'Public'){
        defaultIndex = index
      }
      return {"id":newkey.id, "value": newkey.name, "label": newkey.name}; 
    });

    return (
      <>
        {this.state.selectedNav !== 'UserSettings' &&
        <>
          {!this.props.isOpenSendMail && !this.props.isOpenNewUser &&
            <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
              <div style={{flex: '0 0 auto'}}>
                <div className="form-group row float-right">
                  <div className="col-sm-12 input-group">
                    <input type="text" className="form-control input-sm" onChange={(e)=>this.handleChange(e)} onKeyDown={(e)=>this.handleEnter(e)} name="searchText" value={this.state.searchText}/>
                    <button className="btn btn-light input-group-append" onClick={(e) => this.searchUsers(e)}>
                      <span className="fa fa-search"></span>
                    </button>
                  </div>
                </div>       
                </div>
            <div style={{flex: '1 1 auto', overflowY: 'auto'}}>
              <table className="table table-striped table-sm">
                <thead>
                  <tr>
                    <th style={{width: '20%'}}>Name</th>
                    <th style={{width: '20%'}}>{this.emailLabel}</th>
                    <th style={{width: '50%'}}>Groups</th>
                    <th style={{width: '10%'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                {
                  users.map((user,index)=>{  
                    
                    // To map groups with user
                    var selectedGroups = user.userGroups
                    var selectedOptions = null;
                    if(selectedGroups !== null && selectedGroups !== undefined && selectedGroups !== []){
                      selectedOptions = selectedGroups.map(function(newkey) { 
                        return {"id":newkey.id, "value": newkey.name, "label": newkey.name}; 
                      }); 
                    }

                    return <React.Fragment key={user.id}><tr key={index}>
                      <td style={{width: '20%'}}>{user.firstName} {user.lastName}</td>
                      <td style={{width: '20%'}}>{user.email}</td>
                      <td style={{width: '50%'}}>
                        <Select
                          defaultValue={selectedOptions}
                          closeMenuOnSelect={false}
                          isMulti
                          components={{ Option }}
                          options={optionsList}
                          hideSelectedOptions={false}
                          backspaceRemovesValue={false}
                          isSearchable={false} 
                          placeholder="None Selected"
                          onChange={(e,id)=>this.handleListGroupChange(e,user.id)}
                        />
                      </td>
                      <td style={{width: '10%'}}>
                        <div className="btn-group btn-group-sm float-right">
                          <button onClick={() => this.resendLink(user)} className="btn btn-xs btn-primary" data-toggle="tooltip" data-placement="bottom" title="Resend email">
                          <span className="fa fa-envelope"></span>
                          </button>
                          
                          <button onClick={() => this.setState({ selectedNav: 'UserSettings', userIdForSettingsEdit : user.id})} className="btn btn-xs btn-primary" data-toggle="tooltip" data-placement="bottom" title="Open User Settings">
                          <span className="fa fa-cog"></span>
                          </button>
                          
                          <button onClick={() => this.deleteUser(user)} className="btn btn-xs btn-danger" data-toggle="tooltip" data-placement="bottom" title="Delete user">
                          <span className="fa fa-trash-alt"></span>
                          </button>

                        </div>
                      </td>
                    </tr></React.Fragment>
                  })
                }
                </tbody>
              </table>
            </div>

            <div style={{flex: '0 0 auto', paddingTop:'10px'}}>
              <div className="float-right"> 
                <ReactPaginate 
                  previousLabel={'«'}
                  nextLabel={'»'}  
                  breakLabel={<span className="gap">...</span>} 
                  pageCount={this.props.pageableData.pageCount} 
                  onPageChange={(e)=>this.handlePageClick(e)}
                  forcePage={this.props.pageableData.currentPage} 
                  activeClassName={"active"} 
                  containerClassName={'pagination'} 
                  pageClassName={'page-item'} 
                  pageLinkClassName={'page-link'} 
                  previousLinkClassName={'page-link'}
                  nextLinkClassName={'page-link'}
                /> 
            </div>
            </div>

            <div style={{flex: '0 0 auto'}}>
              <div className="float-right">
                <a type="button" className="btn btn-light mr-2" href='/admin/users/csv'>Download CSV</a>
                <a type="button" onClick={() => this.openSendMail()} className="btn btn-light mr-2" href='#'>Send email to all users</a>
                <a type="button" onClick={() => this.openNewUser()} className="btn btn-light mr-2" href='#'>Register a new user</a>
                <button className="btn btn-primary" onClick={() => this.saveUsers()}><i className="fa fa-save"></i>&nbsp;&nbsp;Save</button>

              </div>
            </div>
          </div>
          }
          
          {this.props.isOpenSendMail && !this.props.isOpenNewUser &&
          <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
            <div style={{flex: '1 1 auto', overflowY: 'auto'}}>

            <div>
              <i className="fa fa-refresh fa-spin"></i>
            </div>
          
            <div>
              <form>
                <div className="form-group">
                  <label>Subject</label>
                  <input type="text" className="form-control" name="mailSubject" onChange={(e)=>this.handleMailChange(e)} value={this.state.mail.mailSubject} />
                </div>
                <div className="form-group">
                  <label>Text</label>
                  <textarea className="form-control" rows="10"  name="mailBody" onChange={(e)=>this.handleMailChange(e)} value={this.state.mail.mailBody}></textarea>
                </div>
              </form>
            </div>
            </div>
            <div style={{flex: '0 0 auto'}}>
              <button type="button" onClick={() => this.sendEmail()} className="btn btn-primary float-right">Send mail</button>
            </div>
          </div>
          }

          {!this.props.isOpenSendMail && this.props.isOpenNewUser &&
          <div>

            <form className="form-horizontal">  
              <div className="form-group">
                <label className="col-sm-4 control-label">First name</label>
                <div className="col-sm-8">
                  <input name="firstName" onChange={(e)=>this.handleUserChange(e)} value={this.state.newUser.firstName} type="text" className="form-control"/>
                </div>
              </div>
              <div className="form-group">
                <label className="col-sm-4 control-label">Last name</label>
                <div className="col-sm-8">
                  <input name="lastName" onChange={(e)=>this.handleUserChange(e)} value={this.state.newUser.lastName} type="text" className="form-control"/>
                </div>
              </div>
              <div className="form-group">
                <label className="col-sm-4 control-label">{this.emailLabel}</label>
                <div className="col-sm-8">
                  <input name="email" onChange={(e)=>this.handleUserChange(e)} value={this.state.newUser.email} type="text" className="form-control"/>
                </div>
              </div>
              <div className="form-group">
                <label className="col-sm-4 control-label">Confirm {this.emailLabel}</label>
                <div className="col-sm-8">
                  <input name="confirmEmail" onChange={(e)=>this.handleUserChange(e)} value={this.state.newUser.confirmEmail} type="text" className="form-control"/>
                </div>
              </div>
              <div className="form-group">
                <label className="col-sm-4 control-label">Company name</label>
                <div className="col-sm-8">
                  <input name="companyName" onChange={(e)=>this.handleUserChange(e)} value={this.state.newUser.companyName} type="text" className="form-control"/>
                </div>
              </div>
          
              <div className="form-group">
                <label className="col-sm-4 control-label">Groups</label>
                <div className="col-sm-8">
                  <Select
                    closeMenuOnSelect={false}
                    isMulti
                    components={{ Option }}
                    options={optionsList}
                    hideSelectedOptions={false}
                    backspaceRemovesValue={false}
                    onChange={(e)=>this.handleGroupChange(e)}
                    isSearchable={false} 
                    defaultValue={[optionsList[defaultIndex]]}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="col-sm-4 control-label">System-wide Super User</label>
                <div className="col-sm-8">
                  <input type="checkbox" onChange={(e)=>this.handleSuperUser(e)} className="checkboxfill" 
                  name="isGlobalSuperUser" checked={this.state.newUser.isGlobalSuperUser === true}/>
                </div>
              </div>
            </form>
            <button onClick={() => this.registerUser()} className="btn btn-primary float-right"><i className="fa fa-save"></i>&nbsp;&nbsp;Register user</button>
          </div>
          }
        </>
        }
        {this.navSelection()}
      </>
    )
  }

  handleSuperUser(event){
    let newUser = this.state.newUser;
    newUser['isGlobalSuperUser'] = event.target.checked;
    if (event.target.checked) {
      newUser['isGlobalSuperUser'] = true;
    } else {
      newUser['isGlobalSuperUser'] = false;
    }
    this.setState({ newUser: newUser });
  }

  handleListGroupChange(e,id) {
    let userList = this.props.userList;
    userList.forEach((user) => {
      if (user.id == id) {
        user.userGroups = e;
        user.isUpdated = true;
      }
    })
  }

  handleGroupChange (e) {
    let newUser = this.state.newUser;
    newUser['groups'] = e;
    this.setState({ newUser: newUser });
  }

  handleMailChange (e) {
    let mail = this.state.mail;
    mail[e.target.name] = e.target.value;
    this.setState({ mail: mail });
  }

  handleUserChange (e) {
    let newUser = this.state.newUser;
    newUser[e.target.name] = e.target.value;
    this.setState({ newUser: newUser });
  }

  handleChange (e) {      
      let searchText = e.target.value;
      e.target.name = searchText;
      this.setState({ searchText: searchText });
  }

  handleEnter(e){
    if(e.key === 'Enter'){
      let searchText = this.state.searchText;
      this.props.searchUsers(searchText)
      this.setState({searchText: searchText})
    }
  }
  resendLink(user) {
    swal({
      title: 'Are you sure?',
      text: 'A new mail will be sent to this user',
      type: 'warning',
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Yes, send it!',
      showCancelButton: true,
      closeOnConfirm: true
    }, () => {
      this.props.resendLink(user)
    })
    
  }

  deleteUser(user) {
    swal({
      title: 'Are you sure?',
      text: 'You will not be able to recover the deleted user!',
      type: 'warning',
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Yes, delete it!',
      showCancelButton: true,
      closeOnConfirm: true
    }, () => {
      this.props.deleteUser(user)
    })
  }

  openSendMail() {
    this.props.openSendMail()
  }

  openNewUser() {
    if(this.props.defaultGroup !== null){
      let newUser = this.state.newUser;
      newUser['groups'] = this.props.defaultGroup;
      this.setState({ newUser: newUser });
    }
    this.props.openNewUser()
  }

  sendEmail() {
    this.props.sendEmail(this.state.mail)
  }

  registerUser() {
   if (this.state.newUser.email !== this.state.newUser.confirmEmail) {
      return swal({
        title: 'Error',
        text: `${this.emailLabel}s do not match`,
        type: 'error'
      })
    } else {
      this.props.registerUser(this.state.newUser)
    }
    this.clearNewuser()
  }

  clearNewuser(){
    let newUser = this.state.newUser;
    newUser['firstName'] = ''
    newUser['lastName'] = ''
    newUser['email'] = ''
    newUser['confirmEmail'] = ''
    newUser['companyName'] = ''
    newUser['isGlobalSuperUser'] = false
    newUser['groupIds'] = []

    if(this.props.defaultGroup !== null){
      newUser['groups'] = this.props.defaultGroup;
    }
    this.setState({ newUser: newUser });
  }

  saveUsers() {
    this.props.saveUsers(this.props.userList)
    this.setState({searchText:''})
  }

  navSelection (){
    let val = this.state.selectedNav
    let userIdForSettingsEdit = this.state.userIdForSettingsEdit
    if (val === 'UserSettings') {
      return (
        this.props.openUserSettingsForUserId(userIdForSettingsEdit, 'User Settings')
      )
    }
  }
}

const Option = createClass({
  render() {
    return (
      <div>
        <components.Option {...this.props}>
          <input
            type="checkbox"
            checked={this.props.isSelected}
            onChange={e => null}
          />{" "}
          <label>{this.props.value} </label>
        </components.Option>
      </div>
    );
  }
});

const mapStateToProps = (state) => ({
    userList: state.user.userList,
    allGroups: state.user.allGroups,
    isOpenSendMail: state.user.isOpenSendMail,
    isOpenNewUser: state.user.isOpenNewUser,
    pageableData:  state.user.pageableData,
    defaultGroup : state.user.defaultGroup,
    clientId: state.configuration.system.ARO_CLIENT
})

const mapDispatchToProps = (dispatch) => ({
  loadGroups: () => dispatch(UserActions.loadGroups()),
  loadUsers: () => dispatch(UserActions.loadUsers()),
  resendLink: (user) => dispatch(UserActions.resendLink(user)),
  deleteUser: (user) => dispatch(UserActions.deleteUser(user)),
  openSendMail: () => dispatch(UserActions.openSendMail()),
  openNewUser: () => dispatch(UserActions.openNewUser()),
  sendEmail: (mail) => dispatch(UserActions.sendEmail(mail)),
  registerUser: (newUser) => dispatch(UserActions.registerUser(newUser)),
  handlePageClick: (selectedPage) => dispatch(UserActions.handlePageClick(selectedPage)),
  searchUsers: (searchText) => dispatch(UserActions.searchUsers(searchText)),
  saveUsers: (userList) => dispatch(UserActions.saveUsers(userList))
})

const ManageUsersComponent = wrapComponentWithProvider(reduxStore, ManageUsers, mapStateToProps, mapDispatchToProps)
export default ManageUsersComponent