import React, { Component } from 'react'
import { connect } from 'react-redux'
import { dequal } from 'dequal'; 
import UserActions from './user-actions'
import Select, { components } from 'react-select'
import createClass from 'create-react-class'
import ReactPaginate from 'react-paginate'
import GlobalsettingsActions from '../global-settings/globalsettings-action'

export class ManageUsers extends Component {
  constructor(props) {
    super(props)
    this.emailLabel = 'Email'
    this.state = {
      newUser: {
        firstName: '',
        lastName: '',
        email: '',
        confirmEmail: '',
        companyName: '',
        groups: [],
        isGlobalSuperUser: false,
        groupIds: [],
      },
      mail: {
        mailSubject: '',
        mailBody: '',
      },
      selectedPage: 0,
      searchText: '',
      selectedNav: '',
      userIdForSettingsEdit: '',
    }
  }

  componentDidMount() {
    this.props.loadGroups()
    this.props.loadUsers()
  }

  // When user move the screen back and forth without saving the added roles it leads to the UI issue,
  // so the modified usersList is cleared and loaded again to set back the data.
  // See: https://www.pivotaltracker.com/n/projects/2468285/stories/177604213
  componentWillUnmount() {
    this.props.clearUserList()
  }

  componentDidUpdate(_prevProps, prevState) {
    if (!dequal(this.state.selectedNav, prevState.selectedNav)) {
      this.navSelection()
    }

    if(this.props.goPrevious) {
      this.setState({
        selectedPage: 0,
        searchText: '',
        selectedNav: '',
        userIdForSettingsEdit: '',
      })
      this.props.setGoPrevious()
    }
  }

  handlePageClick(data) {
    this.props.handlePageClick(data.selected)
    this.setState({ selectedPage: data.selected })
  }

  searchUsers() {
    const { searchText } = this.state
    this.props.searchUsers(searchText)
    this.setState({ searchText })
  }

  render() {
    if (this.props.clientId.toLowerCase() === 'frontier') {
      this.emailLabel = 'Corp ID'
    }

    return this.props.userList && this.props.userList.length && this.renderUserList()
  }

  renderUserList() {

    const users = this.props.pageableData.paginateData

    let defaultIndex = 0
    const optionsList = this.props.allGroups.map(function(newkey, index) {
      if (newkey.name === 'Public') {
        defaultIndex = index
      }
      return { id: newkey.id, name: newkey.name, value: newkey.name, label: newkey.name }
    })

    return (
      <>
        {this.state.selectedNav !== 'UserSettings' &&
        <>
          {!this.props.isOpenSendMail && !this.props.isOpenNewUser &&
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ flex: '0 0 auto' }}>
                <div className="form-group row float-right">
                  <div className="col-sm-12 input-group">
                    <input
                      type="text"
                      className="form-control input-sm"
                      onChange={(event) => this.handleChange(event)}
                      onKeyDown={(event) => this.handleEnter(event)}
                      name="searchText"
                      value={this.state.searchText}
                    />
                    <button className="btn btn-light input-group-append" onClick={(event) => this.searchUsers(event)}>
                      <span className="fa fa-search" />
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ flex: '1 1 auto', overflowY: 'auto' }}>
                <table className="table table-striped table-sm">
                  <thead>
                    <tr>
                      <th style={{ width: '20%' }}>Name</th>
                      <th style={{ width: '20%' }}>{this.emailLabel}</th>
                      <th style={{ width: '50%' }}>Groups</th>
                      <th style={{ width: '10%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                    users.map((user, index) => {
                      // To map groups with user
                      const selectedGroups = user.userGroups
                      let selectedOptions = null
                      if (selectedGroups && selectedGroups.length) {
                        selectedOptions = selectedGroups.map(function(newkey) {
                          if (newkey.name) {
                            return { id: newkey.id, name: newkey.name, value: newkey.name, label: newkey.name }
                          }
                        })
                      }
                      return <React.Fragment key={user.id}><tr key={index}>
                        <td style={{ width: '20%' }}>{user.firstName} {user.lastName}</td>
                        <td style={{ width: '20%' }}>{user.email}</td>
                        <td style={{ width: '50%' }}>
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
                            onChange={(e, id) => this.handleListGroupChange(e, user.id)}
                          />
                        </td>
                        <td style={{ width: '10%' }}>
                          <div className="btn-group btn-group-sm float-right">
                            <button
                              onClick={() => this.resendLink(user)}
                              className="btn btn-xs btn-primary"
                              data-toggle="tooltip"
                              data-placement="bottom"
                              title="Resend email"
                            >
                              <span className="fa fa-envelope" />
                            </button>

                            <button
                              onClick={() => this.setState({ selectedNav: 'UserSettings', userIdForSettingsEdit: user.id })}
                              className="btn btn-xs btn-primary"
                              data-toggle="tooltip"
                              data-placement="bottom"
                              title="Open User Settings"
                            >
                              <span className="fa fa-cog" />
                            </button>

                            <button
                              onClick={() => this.deleteUser(user)}
                              className="btn btn-xs btn-danger"
                              data-toggle="tooltip"
                              data-placement="bottom"
                              title="Delete user"
                            >
                              <span className="fa fa-trash-alt" />
                            </button>

                          </div>
                        </td>
                      </tr></React.Fragment>
                    })
                  }
                  </tbody>
                </table>
              </div>

              <div style={{ flex: '0 0 auto', paddingTop: '10px' }}>
                <div className="float-right">
                  <ReactPaginate
                    previousLabel='«'
                    nextLabel='»'
                    breakLabel={<span className="gap">...</span>}
                    pageCount={this.props.pageableData.pageCount}
                    onPageChange={(event) => this.handlePageClick(event)}
                    forcePage={this.props.pageableData.currentPage}
                    activeClassName='active'
                    containerClassName='pagination'
                    pageClassName='page-item'
                    pageLinkClassName='page-link'
                    previousLinkClassName='page-link'
                    nextLinkClassName='page-link'
                  />
                </div>
              </div>

              <div style={{ flex: '0 0 auto' }}>
                <div className="float-right">
                  <a type="button" className="btn btn-light mr-2" href='/admin/users/csv'>Download CSV</a>
                  <a type="button" onClick={() => this.openSendMail()} className="btn btn-light mr-2" href='#'>
                    Send email to all users
                  </a>
                  <a type="button" onClick={() => this.openNewUser()} className="btn btn-light mr-2" href='#'>
                    Register a new user
                  </a>
                  <button className="btn btn-primary" onClick={() => this.saveUsers()}><i className="fa fa-save" />
                    &nbsp;&nbsp;Save
                  </button>
                </div>
              </div>
            </div>
          }

          {this.props.isOpenSendMail && !this.props.isOpenNewUser &&
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: '1 1 auto', overflowY: 'auto' }}>

              <div>
                <i className="fa fa-refresh fa-spin" />
              </div>

              <div>
                <form>
                  <div className="form-group">
                    <label>Subject</label>
                    <input
                      type="text"
                      className="form-control"
                      name="mailSubject"
                      onChange={(event) => this.handleMailChange(event)}
                      value={this.state.mail.mailSubject}
                    />
                  </div>
                  <div className="form-group">
                    <label>Text</label>
                    <textarea
                      className="form-control"
                      rows="10"
                      name="mailBody"
                      onChange={(event) => this.handleMailChange(event)}
                      value={this.state.mail.mailBody}
                    />
                  </div>
                </form>
              </div>
            </div>
            <div style={{ flex: '0 0 auto' }}>
              <button
                type="button"
                onClick={() => this.sendEmail()}
                className="btn btn-primary float-right"
              >
                Send mail
              </button>
            </div>
          </div>
          }

          {!this.props.isOpenSendMail && this.props.isOpenNewUser &&
          <div>

            <form className="form-horizontal">
              <div className="form-group">
                <label className="col-sm-4 control-label">First name</label>
                <div className="col-sm-8">
                  <input
                    name="firstName"
                    onChange={(event) => this.handleUserChange(event)}
                    value={this.state.newUser.firstName}
                    type="text"
                    className="form-control"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="col-sm-4 control-label">Last name</label>
                <div className="col-sm-8">
                  <input
                    name="lastName"
                    onChange={(event) => this.handleUserChange(event)}
                    value={this.state.newUser.lastName}
                    type="text"
                    className="form-control"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="col-sm-4 control-label">{this.emailLabel}</label>
                <div className="col-sm-8">
                  <input
                    name="email"
                    onChange={(event) => this.handleUserChange(event)}
                    value={this.state.newUser.email}
                    type="text"
                    className="form-control"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="col-sm-4 control-label">Confirm {this.emailLabel}</label>
                <div className="col-sm-8">
                  <input
                    name="confirmEmail"
                    onChange={(event) => this.handleUserChange(event)}
                    value={this.state.newUser.confirmEmail}
                    type="text"
                    className="form-control"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="col-sm-4 control-label">Company name</label>
                <div className="col-sm-8">
                  <input
                    name="companyName"
                    onChange={(event) => this.handleUserChange(event)}
                    value={this.state.newUser.companyName}
                    type="text"
                    className="form-control"
                  />
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
                    onChange={(event) => this.handleGroupChange(event)}
                    isSearchable={false}
                    defaultValue={[optionsList[defaultIndex]]}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="col-sm-4 control-label">System-wide Super User</label>
                <div className="col-sm-8">
                  <input
                    type="checkbox"
                    onChange={(event) => this.handleSuperUser(event)}
                    className="checkboxfill"
                    name="isGlobalSuperUser"
                    checked={this.state.newUser.isGlobalSuperUser === true}
                  />
                </div>
              </div>
            </form>
            <button onClick={() => this.registerUser()} className="btn btn-primary float-right">
              <i className="fa fa-save" />&nbsp;&nbsp;Register user
            </button>
          </div>
          }
        </>
        }
      </>
    )
  }

  handleSuperUser(event) {
    let { newUser } = this.state
    newUser.isGlobalSuperUser = event.target.checked
    if (event.target.checked) {
      newUser.isGlobalSuperUser = true
    } else {
      newUser.isGlobalSuperUser = false
    }
    this.setState({ newUser })
  }

  handleListGroupChange(event, id) {
    let { userList } = this.props
    userList.forEach((user) => {
      if (user.id === id) {
        user.userGroups = event
        user.isUpdated = true
      }
    })
  }

  handleGroupChange(event) {
    event = event || []
    let { newUser } = this.state
    newUser.groups = event
    this.setState({ newUser })
  }

  handleMailChange(event) {
    let { mail } = this.state
    mail[event.target.name] = event.target.value
    this.setState({ mail })
  }

  handleUserChange(event) {
    let { newUser } = this.state
    newUser[event.target.name] = event.target.value
    this.setState({ newUser })
  }

  handleChange(event) {
    let searchText = event.target.value
    event.target.name = searchText
    this.setState({ searchText })
  }

  handleEnter(event) {
    if (event.key === 'Enter') {
      let { searchText } = this.state
      this.props.searchUsers(searchText)
      this.setState({ searchText })
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
    if (this.props.defaultGroup !== null) {
      let { newUser } = this.state
      newUser.groups = this.props.defaultGroup
      this.setState({ newUser })
    }
    this.props.openNewUser()
  }

  sendEmail() {
    this.props.sendEmail(this.state.mail)
  }

  registerUser() {
    if (this.state.newUser.email !== '') {
      if (this.state.newUser.email !== this.state.newUser.confirmEmail) {
        this.props.customErrorHandle('Error', `${this.emailLabel}s do not match`, 'error')
      } else {
        this.props.registerUser(this.state.newUser)
        this.clearNewuser()
      }
    } else {
      this.props.customErrorHandle('Error', `${this.emailLabel} can not be empty`, 'error')
    }
  }

  clearNewuser() {
    let { newUser } = this.state
    newUser.firstName = ''
    newUser.lastName = ''
    newUser.email = ''
    newUser.confirmEmail = ''
    newUser.companyName = ''
    newUser.isGlobalSuperUser = false
    newUser.groupIds = []

    if (this.props.defaultGroup !== null) {
      newUser.groups = this.props.defaultGroup
    }
    this.setState({ newUser })
  }

  saveUsers() {
    this.props.saveUsers(this.props.userList)
    this.setState({ searchText: '' })
  }

  navSelection() {
    const val = this.state.selectedNav
    const { userIdForSettingsEdit } = this.state
    if (val === 'UserSettings') {
      this.props.openUserSettingsForUserId(
        userIdForSettingsEdit,
        'User Settings'
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
            onChange={event => null}
          />{' '}
          <label>{this.props.value} </label>
        </components.Option>
      </div>
    )
  }
})

const mapStateToProps = (state) => ({
  userList: state.user.userList,
  allGroups: state.user.allGroups,
  isOpenSendMail: state.user.isOpenSendMail,
  isOpenNewUser: state.user.isOpenNewUser,
  pageableData: state.user.pageableData,
  defaultGroup: state.user.defaultGroup,
  clientId: state.configuration.system.ARO_CLIENT,
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
  saveUsers: (userList) => dispatch(UserActions.saveUsers(userList)),
  customErrorHandle: (title, text, type) => dispatch(GlobalsettingsActions.customErrorHandle(title, text, type)),
  clearUserList: () => dispatch(UserActions.clearUserList()),
})

export default connect(mapStateToProps, mapDispatchToProps)(ManageUsers)
