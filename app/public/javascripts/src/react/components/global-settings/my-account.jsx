import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import globalsettingsActions from '../global-settings/globalsettings-action'

export class MyAccount extends Component {constructor (props) {
    super(props)
        this.state = {
        first_name:'',
        last_name:'',
        email:'',
        old_password:'',
        password:'',
        password_confirm:''
    }
}

    componentDidMount () {
        if(this.props.accountDetails !== null ){
            this.setState({
                first_name: this.props.accountDetails.first_name,
                last_name: this.props.accountDetails.last_name,
                email: this.props.accountDetails.email
            })
        }
    }

    render () {
        return !this.props.accountDetails
        ? null
        : <div>{this.renderAccountDetails()}</div>
    }

    renderAccountDetails () {
        const account = this.props.accountDetails
        return (
            <div>
                <form>
                    <fieldset>
                        <div className="form-group">
                            <label>First name *</label>
                            <input type="text" name="first_name" onChange={(e)=>this.handleChange(e)} value={account.first_name} className="form-control"/>
                        </div>
                        <div className="form-group">
                            <label>Last name *</label>
                            <input type="text" name="last_name" className="form-control" onChange={(e)=>this.handleChange(e)} value={account.last_name}/>
                        </div>
                        <div className="form-group">
                            <label>Email *</label>
                            <input type="email" name="email" className="form-control" onChange={(e)=>this.handleChange(e)} value={account.email}/>
                        </div>
                    </fieldset>

                    <hr/>

                    <fieldset>
                        <legend>Optionally change your password</legend>
                        <div className="form-group">
                            <label>Current password</label>
                            <input type="password" name="old_password" onChange={(e)=>this.handleChange(e)} className="form-control" placeholder="Your current password"/>
                        </div>
                        <div className="form-group">
                            <label>New password</label>
                            <input type="password" name="password" onChange={(e)=>this.handleChange(e)} className="form-control" placeholder="The new password"/>
                        </div>
                        <div className="form-group">
                            <label>Confirm new password</label>
                            <input type="password" name="password_confirm" onChange={(e)=>this.handleChange(e)} className="form-control" placeholder="Confirm the new password"/>
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
        this.setState( e.target.name = e.target.value );
    }

    updateAccount () {
        this.props.updateUserAccount(this.state)
    }
}


const mapStateToProps = (state) => ({
    accountDetails: state.user.loggedInUser
})

const mapDispatchToProps = (dispatch) => ({
    updateUserAccount: (user) => dispatch(globalsettingsActions.updateUserAccount(user))
})

const MyAccountComponent = wrapComponentWithProvider(reduxStore, MyAccount, mapStateToProps, mapDispatchToProps)
export default MyAccountComponent