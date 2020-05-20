import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import globalsettingsActions from '../global-settings/globalsettings-action'

const status = {
    UNDEFINED: 'UNDEFINED',
    MULTIFACTOR_ALREADY_SETUP: 'MULTIFACTOR_ALREADY_SETUP',
    UNINITIALIZED: 'UNINITIALIZED',
    SECRET_GENERATED: 'SECRET_GENERATED',
    SETUP_COMPLETE: 'SETUP_COMPLETE'
}

export class MultiFactor extends Component {
    constructor (props) {
        super(props)
        this.state = {
            is_totp_verified: false, 
            is_totp_enabled: false,
            currentState: status.UNINITIALIZED,
            is_loaded: false
        }
    }

    componentWillMount () {
        console.log(this.state.currentState)
        this.props.loadMultiFactor()
        if(this.props.multiFactor !== null){
            console.log(this.props.otpStatus)
            if (!this.props.otpStatus.is_totp_enabled) {
                this.state.currentState = status.UNINITIALIZED
            } else {
                // TOTP is enabled. If it is not verified, then something went wrong with the verification. Set it to uninitialized.
                this.state.currentState = this.props.otpStatus.is_totp_verified ? status.MULTIFACTOR_ALREADY_SETUP : status.UNINITIALIZED
            }
            this.state.is_loaded = true
            this.setState({currentState: this.state.currentState})
            this.setState({is_loaded: this.state.is_loaded})
            console.log(this.state.currentState)
        }else{
            console.log(this.props.multiFactor)
        }
    }
    
    render () {
        console.log(this.props.multiFactor)
        return this.props.multiFactor !== null
            ? null
            : <div>
                {this.renderMutiFactor()}
            </div>
    }
    renderMutiFactor () {
        console.log(this.state.is_loaded)

        return (
            <div>
                {this.state.currentState === status.MULTIFACTOR_ALREADY_SETUP && 
                <div>
                    <p>
                        Multi-factor authentication is already set up for your account. You can either disable it
                        (not recommended) or reset it. If you click on Reset, you will have to reconfigure any
                        OTP apps that you have installed on your phone.
                    </p>
                    <p>
                        In order to overwrite existing multi-factor settings, you have to enter a valid OTP below:
                    </p>
                    <input className="form-control" placeholder="6-digit OTP"/>
                    <a href="#">I don't have an app, email the OTP to me</a>
                    <div className="text-center mt-3">
                        <button className="btn btn-danger" >Disable</button>
                        <button className="btn btn-danger" >Reset</button>
                    </div>
                    <div className="alert alert-danger mt-3"></div>
                    <div className="alert alert-success mt-3">An email with the current OTP has been sent to your registered email.
                    Please check your email.</div>
                </div>
                }

                {this.state.currentState === status.UNINITIALIZED && 
                <div>
                    <p>
                        Multi-factor authentication secures your account by requiring a one-time password (OTP)
                        to log in (along with your regular account password). You can get the OTP via email, SMS
                        or using an authenticator app like Google Authenticator or Authy.
                    </p>
                    <div className="text-center">
                        <button class="btn btn-primary">Get Started</button>
                    </div>
                </div>
                }
            </div>
        )
    }

}

const mapStateToProps = (state) => ({
    multiFactor: state.globalSettings.multiFactor
})

const mapDispatchToProps = (dispatch) => ({
    loadMultiFactor: () => dispatch(globalsettingsActions.loadMultiFactor())
})

const MultiFactorComponent = wrapComponentWithProvider(reduxStore, MultiFactor, mapStateToProps, mapDispatchToProps)
export default MultiFactorComponent