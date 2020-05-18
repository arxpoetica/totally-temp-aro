import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import GlobalsettingsActions from '../global-settings/globalsettings-action'

export class MyAccount extends Component {constructor (props) {
            super(props)
            this.state = {
            accountDetails: {
                id:'',
                first_name:'',
                last_name:'',
                email:'',
                old_password:'',
                password:'',
                password_confirm:''
            }
        }
    }

    handleChange (e) {
        let accountDetails = this.state.accountDetails;
        accountDetails[e.target.name] = e.target.value;
        this.setState({ accountDetails });
    }
    
    componentDidMount () {
        console.log(this.props.accountDetails)
        if(this.props.accountDetails !== null ){
            this.state.accountDetails.id = this.props.accountDetails.id
            this.state.accountDetails.first_name = this.props.accountDetails.first_name
            this.state.accountDetails.last_name = this.props.accountDetails.last_name
            this.state.accountDetails.email = this.props.accountDetails.email

            this.setState({
                accountDetails: this.state.accountDetails
            })
        }
    }

    render () {
        return !this.props.accountDetails
        ? null
        : <div>{this.renderAccountDetails()}</div>
    }

    renderAccountDetails () {
        const account= this.state.accountDetails
        
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
            </div>
        )
    }
}


const mapStateToProps = (state) => ({
    accountDetails: state.user.loggedInUser
})

const mapDispatchToProps = (dispatch) => ({
   
})

const MyAccountComponent = wrapComponentWithProvider(reduxStore, MyAccount, mapStateToProps, mapDispatchToProps)
export default MyAccountComponent