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
            verificationCode:'',
            disableCode:'',
            showSecretText: false
        }
    }

    componentWillMount () {
        this.props.loadOtpStatus()
    }
    
    render () {
        return this.props.multiFactor !== null || this.props.secretDetails !== null || this.props.verifyDetails !== null
            ? <div>
              {this.renderMutiFactor()}
              </div>
            : null
    }
    renderMutiFactor () {

        let currentState = status.UNDEFINED;

        if(this.props.multiFactor !== null){
            if(!this.props.multiFactor.is_totp_enabled){
                currentState = status.UNINITIALIZED
            }else{
                if(this.props.multiFactor.is_totp_verified){
                    currentState = status.MULTIFACTOR_ALREADY_SETUP
                }else{
                    currentState = status.UNINITIALIZED
                }
            }
        }

        if(this.props.secretDetails !== null){
            currentState = status.SECRET_GENERATED
        }

        if(this.props.verifyDetails !== null){
            if(this.props.verifyFlag){
                currentState = status.SETUP_COMPLETE
            }
        }

        return (
            <div>
                {currentState === status.MULTIFACTOR_ALREADY_SETUP && 
                <div>
                    <p>
                        Multi-factor authentication is already set up for your account. You can either disable it
                        (not recommended) or reset it. If you click on Reset, you will have to reconfigure any
                        OTP apps that you have installed on your phone.
                    </p>
                    <p>
                        In order to overwrite existing multi-factor settings, you have to enter a valid OTP below:
                    </p>
                    <input className="form-control" name="disableCode" onChange={(e)=>this.handleDisable(e)} placeholder="6-digit OTP"/>
                    <a href="#" onClick={() => this.sendOtpEmail()}>I don't have an app, email the OTP to me</a>
                    <div className="text-center mt-3">
                        <button className="btn btn-danger" onClick={() => this.disableMultiAuth(this.state.disableCode)} >Disable</button>&nbsp;&nbsp;
                        <button className="btn btn-danger" onClick={() => this.resetMultiAuth(this.state.disableCode)} >Reset</button>
                    </div>
                    {this.props.errorFlag &&
                        <div className="alert alert-danger mt-3">{this.props.verifyDetails}</div>
                    }
                    {this.props.totpEmailSent &&
                        <div className="alert alert-success mt-3">An email with the current OTP has been sent to your registered email.
                        Please check your email.</div>
                    }
                </div>
                }

                {currentState === status.UNINITIALIZED && 
                <div>
                    <p>
                        Multi-factor authentication secures your account by requiring a one-time password (OTP)
                        to log in (along with your regular account password). You can get the OTP via email, SMS
                        or using an authenticator app like Google Authenticator or Authy.
                    </p>
                    <div className="text-center">
                        <button className="btn btn-primary" onClick={() => this.getSecret()}>Get Started</button>
                    </div>
                </div>
                }

                {currentState === status.SECRET_GENERATED &&
                <div>
                    <h3 className="mb-3">Step 1: Set up authenticator app</h3>
                    <p className="mb-0">
                    A secret key has been generated for your account. You can now use an app like Google Authenticator or Authy
                    to sync the secret key with your account. Simply scan the QR code with the app and then enter the validation
                    code that shows up on the app.
                    </p>
                    <div className="text-center">
                        <img src={this.props.secretDetails.qrCode} />
                    </div>
                    
                    {!this.state.showSecretText &&
                    <div className="text-center mb-3">
                        <button className="btn btn-sm btn-light" onClick={()=> this.setState({ showSecretText: true })}>Camera not working?</button>
                    </div>
                    }
                    {this.state.showSecretText &&
                    <div className="text-center mb-3">
                        <div>Secret: {this.props.secretDetails.secret}</div>
                    </div>
                    }
                    <h3 className="mb-3">Step 2: Enter current 6-digit OTP</h3>
                    <div className="text-center">
                    <div className="input-group">
                        <input type="text" className="form-control" name="verificationCode" placeholder="6-digit OTP" onChange={(e)=>this.handleVerify(e)} value={this.state.verificationCode}/>
                        <div className="input-group-append">
                            <button className="btn btn-primary" type="button" onClick={() => this.verifyOtp(this.state.verificationCode)}>Next</button>
                        </div>
                    </div>
                    </div>
                    
                    {!this.props.totpEmailSent &&
                    <div>
                        <a href="#" onClick={() => this.sendOtpEmail()}>I don't have an app, email the OTP to me</a>
                    </div>
                    }
                    {this.props.errorFlag &&
                        <div className="alert alert-danger mt-3">{this.props.verifyDetails}</div>
                    }
                    {this.props.totpEmailSent &&
                        <div id="#totpEmailSentMessage" className="alert alert-success mt-3">An email with the current OTP has been sent to your registered email.
                        Please check your email.</div>
                    }
                </div>
                }

                {currentState === status.SETUP_COMPLETE &&
                <div>
                    <h3 className="mb-3">Multi-factor authentication complete</h3>
                    <p>Congratulations! Multi-factor authentication has been successfully set up for your account. In the future, you will
                    require a One-Time Password (OTP) to log in to your account (in addition to your account password).
                    </p>
                </div>
                }
                
            </div>
        )
    }

    getSecret () {
        this.props.overwriteSecretForUser()
    }

    sendOtpEmail () {
        this.props.sendOTPByEmail()
    }

    verifyOtp () {
        this.props.verifySecretForUser(this.state.verificationCode)
    }

    disableMultiAuth () {
        this.props.disableMultiAuth(this.state.disableCode)
    }

    resetMultiAuth () {
        this.props.resetMultiFactorForUser(this.state.disableCode)
    }

    handleVerify (e) {
        this.setState({ verificationCode: e.target.value });
    }

    handleDisable (e) {
        this.setState({ disableCode: e.target.value });
    }
}

const mapStateToProps = (state) => ({
    multiFactor: state.globalSettings.multiFactor,
    secretDetails: state.globalSettings.secretDetails,
    showSecretText: state.globalSettings.showSecretText,
    totpEmailSent:  state.globalSettings.totpEmailSent,
    verifyDetails: state.globalSettings.verifyDetails,
    errorFlag: state.globalSettings.errorFlag,
    verifyFlag: state.globalSettings.verifyFlag
})

const mapDispatchToProps = (dispatch) => ({
    loadOtpStatus: () => dispatch(globalsettingsActions.loadOtpStatus()),
    overwriteSecretForUser: () => dispatch(globalsettingsActions.overwriteSecretForUser()),
    sendOTPByEmail: () => dispatch(globalsettingsActions.sendOTPByEmail()),
    verifySecretForUser: (verificationCode) => dispatch(globalsettingsActions.verifySecretForUser(verificationCode)),
    disableMultiAuth: (disableCode) => dispatch(globalsettingsActions.disableMultiAuth(disableCode)),
    resetMultiFactorForUser: (disableCode) => dispatch(globalsettingsActions.resetMultiFactorForUser(disableCode))
})

const MultiFactorComponent = wrapComponentWithProvider(reduxStore, MultiFactor, mapStateToProps, mapDispatchToProps)
export default MultiFactorComponent