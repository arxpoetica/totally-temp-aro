import React, { Component } from 'react'
import { connect } from 'react-redux'
import UserActions from './user-actions'

export class MyAccount extends Component {
  constructor(props) {
    super(props)
    this.state = {
      accountDetails: {
        first_name: '',
        last_name: '',
        email: '',
        old_password: '',
        password: '',
        password_confirm: '',
      },
    }
  }

  componentDidMount() {
    if (this.props.accountDetails !== null) {
      const { accountDetails } = this.state
      accountDetails.first_name = this.props.accountDetails.first_name
      accountDetails.last_name = this.props.accountDetails.last_name
      accountDetails.email = this.props.accountDetails.email

      this.setState({ accountDetails })
    }
  }

  render() {
    return this.props.accountDetails === null
      ? null
      : <div>{this.renderAccountDetails()}</div>
  }

  renderAccountDetails() {
    return (
      <div>
        <form>
          <fieldset>
            <div className="form-group">
              <label>First name *</label>
              <input
                type="text"
                name="first_name"
                onChange={(event) => this.handleChange(event)}
                value={this.state.accountDetails.first_name}
                className="form-control" />
            </div>
            <div className="form-group">
              <label>Last name *</label>
              <input
                type="text"
                name="last_name"
                className="form-control"
                onChange={(event) => this.handleChange(event)}
                value={this.state.accountDetails.last_name}
              />
            </div>
            <div className="form-group">
              <label>User ID</label>
              <input
                type="email"
                name="email"
                className="form-control"
                onChange={(event) => this.handleChange(event)}
                value={this.state.accountDetails.email}
                disabled
              />
            </div>
          </fieldset>

          <hr />

          <fieldset>
            <legend>Optionally change your password</legend>
            <div className="form-group">
              <label>Current password</label>
              <input 
                type="password"
                name="old_password"
                onChange={(event) => this.handleChange(event)}
                className="form-control"
                value={this.state.accountDetails.old_password}
                placeholder="Your current password"
              />
            </div>
            <div className="form-group">
              <label>New password</label>
              <input
                type="password"
                name="password"
                onChange={(event) => this.handleChange(event)}
                className="form-control"
                placeholder="The new password"
                value={this.state.accountDetails.password}
              />
            </div>
            <div className="form-group">
              <label>Confirm new password</label>
              <input
                type="password"
                name="password_confirm"
                onChange={(event) => this.handleChange(event)}
                className="form-control"
                placeholder="Confirm the new password"
                value={this.state.accountDetails.password_confirm}
              />
            </div>
          </fieldset>

        </form>
        <div style={{ flex: '0 0 auto' }}>
          <button className="btn btn-primary float-right" onClick={() => this.updateAccount()}>
            <i className="fa fa-save" />
            &nbsp;&nbsp;Update Settings
          </button>
        </div>
      </div>
    )
  }

  handleChange(event) {
    const { accountDetails } = this.state
    accountDetails[event.target.name] = event.target.value
    this.setState({ accountDetails })
  }

  updateAccount() {
    this.props.updateUserAccount(this.state.accountDetails)
  }
}

const mapStateToProps = (state) => ({
  accountDetails: state.user.loggedInUser,
})

const mapDispatchToProps = (dispatch) => ({
  updateUserAccount: (user) => dispatch(UserActions.updateUserAccount(user)),
})

const MyAccountComponent = connect(mapStateToProps, mapDispatchToProps)(MyAccount)
export default MyAccountComponent
