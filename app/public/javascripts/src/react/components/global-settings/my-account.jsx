import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import globalsettingsActions from '../global-settings/globalsettings-action'
import UserActions from '../user/user-actions'

export class MyAccount extends Component {constructor (props) {
    super(props)
    this.state = {
        accountDetails: {
            first_name:'',
            last_name:'',
            email:'',
            old_password:'',
            password:'',
            password_confirm:''
        }
    }
}

    componentDidMount () {
        if(this.props.accountDetails !== null ){
            let accountDetails = this.state.accountDetails;
            accountDetails["first_name"] = this.props.accountDetails.first_name;
            accountDetails["last_name"] = this.props.accountDetails.last_name;
            accountDetails["email"] = this.props.accountDetails.email;            

            this.setState({
                accountDetails: accountDetails
            })
        }
    }

    render () {
        return this.props.accountDetails===null
        ? null
        : <div>{this.renderAccountDetails()}</div>
    }

    renderAccountDetails () {
        return (
            <div>
                <form>
                    <fieldset>
                        <div className="form-group">
                            <label>First name *</label>
                            <input type="text" name="first_name" onChange={(e)=>this.handleChange(e)} value={this.state.accountDetails.first_name} className="form-control"/>
                        </div>
                        <div className="form-group">
                            <label>Last name *</label>
                            <input type="text" name="last_name" className="form-control" onChange={(e)=>this.handleChange(e)} value={this.state.accountDetails.last_name}/>
                        </div>
                        <div className="form-group">
                            <label>Email *</label>
                            <input type="email" name="email" className="form-control" onChange={(e)=>this.handleChange(e)} value={this.state.accountDetails.email}/>
                        </div>
                    </fieldset>

                    <hr/>

                    <fieldset>
                        <legend>Optionally change your password</legend>
                        <div className="form-group">
                            <label>Current password</label>
                            <input type="password" name="old_password" onChange={(e)=>this.handleChange(e)} className="form-control" value={this.state.accountDetails.old_password} placeholder="Your current password"/>
                        </div>
                        <div className="form-group">
                            <label>New password</label>
                            <input type="password" name="password" onChange={(e)=>this.handleChange(e)} className="form-control" placeholder="The new password" value={this.state.accountDetails.password}/>
                        </div>
                        <div className="form-group">
                            <label>Confirm new password</label>
                            <input type="password" name="password_confirm" onChange={(e)=>this.handleChange(e)} className="form-control" placeholder="Confirm the new password" value={this.state.accountDetails.password_confirm}/>
                        </div>
                    </fieldset>

                </form>
                <div style={{ flex: '0 0 auto' }}>
                    <button className={'btn btn-primary float-right'} onClick={() => this.updateAccount()}><i className={'fa fa-save'} />&nbsp;&nbsp;Update Settings</button>
                </div>
            </div>
        )
    }

    handleChange (e) {
        let accountDetails = this.state.accountDetails;
        accountDetails[e.target.name] = e.target.value;
        this.setState({ accountDetails: accountDetails });
    }

    updateAccount () {
        this.props.updateUserAccount(this.state.accountDetails)
    }
}


const mapStateToProps = (state) => ({
    accountDetails: state.user.loggedInUser
})

const mapDispatchToProps = (dispatch) => ({
    updateUserAccount: user => dispatch(UserActions.updateUserAccount(user)),
    loadSystemActors: () => dispatch(UserActions.loadSystemActors())
})

const MyAccountComponent = wrapComponentWithProvider(reduxStore, MyAccount, mapStateToProps, mapDispatchToProps)
export default MyAccountComponent