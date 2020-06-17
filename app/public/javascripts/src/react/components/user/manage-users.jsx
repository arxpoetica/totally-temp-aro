import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import UserActions from './user-actions'
import Select, { components } from "react-select";
import createClass from "create-react-class";

export class ManageUsers extends Component {constructor (props) {
    super(props)
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
      selectedOption:{}
    }
}

  componentDidMount () {
    this.props.loadGroups()
    this.props.loadUsers()
  }

  render () {
      return this.props.userList===null
      ? null
      : <div>{this.renderUserList()}</div>
  }

  renderUserList () {
    const users = this.props.userList
    let optionsList = this.props.allGroups.map(function(newkey) { 
      return {"id":newkey.id, "value": newkey.name, "label": newkey.name}; 
    });

    return (
      <div>
        {!this.props.isOpenSendMail && !this.props.isOpenNewUser &&
        <div>
          <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
            <div style={{flex: '0 0 auto'}}>
              <div className="float-right input-group" style={{maxWidth: '250px'}}>
                <input className="form-control" type="text"/>
                <span className="input-group-btn">
                  <button className="btn btn-light" type="button"><i className="fa fa-search"></i></button>
                </span>
              </div>
          </div>
          <div style={{flex: '1 1 auto; overflow-y: auto'}}>
            <table className="table table-striped table-sm">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Groups</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
              {
                users.map((user,index)=>{  
                  return <tr key={index}>
                    <td>{user.firstName} {user.lastName}</td>
                    <td>{user.email}</td>
                    <td></td>
                    <td>
                      <div className="btn-group btn-group-sm float-right">
                        <button onClick={() => this.resendLink(user)} className="btn btn-xs btn-primary" data-toggle="tooltip" data-placement="bottom" title="Resend email">
                        <span className="fa fa-envelope"></span>
                        </button>
                        
                        <button className="btn btn-xs btn-primary" data-toggle="tooltip" data-placement="bottom" title="Open User Settings">
                        <span className="fa fa-cog"></span>
                        </button>
                        
                        <button onClick={() => this.deleteUser(user)} className="btn btn-xs btn-danger" data-toggle="tooltip" data-placement="bottom" title="Delete user">
                        <span className="fa fa-trash-alt"></span>
                        </button>

                      </div>
                    </td>
                  </tr>
                })
              }
              </tbody>
            </table>
          </div>
          <div style={{flex: '0 0 auto'}}>
            <div className="float-right" style={{flex: '0 0 auto'}}>

              <a type="button" className="btn btn-light" href='/admin/users/csv'>Download CSV</a>
              <a type="button" onClick={() => this.openSendMail()} className="btn btn-light" href='#'>Send email to all users</a>
              <a type="button" onClick={() => this.openNewUser()} className="btn btn-light" href='#'>Register a new user</a>
              <button className="btn btn-primary"><i className="fa fa-save"></i>&nbsp;&nbsp;Save</button>

            </div>
          </div>
        </div>
        </div>}
        
        {this.props.isOpenSendMail && !this.props.isOpenNewUser &&
        <div>
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
          <button type="button" onClick={() => this.sendEmail()} className="btn btn-primary float-right">Send mail</button>
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
              <label className="col-sm-4 control-label">Email</label>
              <div className="col-sm-8">
                <input name="email" onChange={(e)=>this.handleUserChange(e)} value={this.state.newUser.email} type="text" className="form-control"/>
              </div>
            </div>
            <div className="form-group">
              <label className="col-sm-4 control-label">Confirm email</label>
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
        </div>}

      </div>
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
    this.setState({ newUser: {} });
    this.props.openNewUser()
  }

  sendEmail() {
    this.props.sendEmail(this.state.mail)
  }

  registerUser() {
    if (this.state.newUser.email !== this.state.newUser.confirmEmail) {
      return swal({
        title: 'Error',
        text: 'Emails do not match',
        type: 'error'
      })
    }else{
      this.props.registerUser(this.state.newUser)
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
    isOpenNewUser: state.user.isOpenNewUser
})

const mapDispatchToProps = (dispatch) => ({
  loadGroups: () => dispatch(UserActions.loadGroups()),
  loadUsers: () => dispatch(UserActions.loadUsers()),
  resendLink: (user) => dispatch(UserActions.resendLink(user)),
  deleteUser: (user) => dispatch(UserActions.deleteUser(user)),
  openSendMail: () => dispatch(UserActions.openSendMail()),
  openNewUser: () => dispatch(UserActions.openNewUser()),
  sendEmail: (mail) => dispatch(UserActions.sendEmail(mail)),
  registerUser: (newUser) => dispatch(UserActions.registerUser(newUser))
})

const ManageUsersComponent = wrapComponentWithProvider(reduxStore, ManageUsers, mapStateToProps, mapDispatchToProps)
export default ManageUsersComponent