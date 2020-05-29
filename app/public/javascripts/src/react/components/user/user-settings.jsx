import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import UserActions from './user-actions'

export class UserSettings extends Component {constructor (props) {
    super(props);
    this.handleDropdownChange = this.handleDropdownChange.bind(this);
    this.state = {
        userConfig:{
            defaultLocation:'',
            projectTemplateId:'',
            perspective:''
        }
    }
}

    componentDidMount () {
        if(this.props.userId !== null ){
            this.props.loadUserSettings(this.props.userId)
        }
    }

    render () {
        
        return this.props.userConfiguration===null || this.props.projectTemplates===null
        ? null
        : <div>{this.renderUserSettings()}</div>
    }

    renderUserSettings () {

        this.state.userConfig = this.props.userConfiguration;

        let projectTemplateList = []
        if(this.props.projectTemplates!==null){
            let projectTemplates = this.props.projectTemplates
            
            projectTemplateList = projectTemplates.length > 0
                && projectTemplates.map((item, i) => {
                return (
                    <option key={i} value={item.id}>{item.name}</option>
                )
            }, this);
        }   

        let perspectiveList = []
        perspectiveList.push(<option key={'admin'} value={'admin'}>{'Admin'}</option>)
        perspectiveList.push(<option key={'standard'} value={'standard'}>{'Standard'}</option>)
        perspectiveList.push(<option key={'biz-dev'} value={'biz-dev'}>{'Biz-dev'}</option>)
        perspectiveList.push(<option key={'sales_engineer'}  value={'sales_engineer'}>{'Sales Engineers'}</option>)
        perspectiveList.push(<option key={'account_exec'}  value={'account_exec'}>{'Account Executive'}</option>)

        return (
            <div className="no-collapse" id="set-default-location">
                <div>
                    <table id="tblUserSettings" className="table table-sm table-striped">
                    <tbody>
                        <tr>
                            <td>Map Start Location</td>
                            <td> 
                                <input name="defaultLocation" value={this.props.userConfiguration.defaultLocation} className="form-control select2" type="text" placeholder="Set cities, states or wirecenters" onChange={(e)=>this.handleChange(e)}/>
                            </td>
                        </tr>
                        <tr>
                        <td>Default template</td>
                        <td>
                            <select name="projectTemplateId" className="form-control" value={this.props.userConfiguration.projectTemplateId} onChange={(e)=>this.handleDropdownChange(e)}>
                                {projectTemplateList}
                            </select>
                        </td>
                        </tr>
                        <tr>
                        <td>Perspective</td>
                        <td>
                            <select name="perspective" className="form-control" value={this.props.userConfiguration.perspective} onChange={(e)=>this.handleDropdownChange(e)}>
                                {perspectiveList}
                            </select>
                        </td>
                        </tr>
                    </tbody>
                    </table>
                </div>
                <div>
                    <button className="btn btn-primary float-right" onClick={() => this.saveSettings()}><i className="fa fa-save"></i>&nbsp;&nbsp;Save Settings</button>
                </div>
            </div>
        )
    }

    handleChange(e) {
        let userConfig = this.state.userConfig; 
        userConfig[e.target.name] = e.target.value;
        this.setState({ userConfig: userConfig });
        console.log(this.state.userConfig)
    }

    handleDropdownChange(e) {
        let userConfig = this.state.userConfig; 
        userConfig[e.target.name] = e.target.value;
        this.setState({ userConfig: userConfig });
    }

    saveSettings() {
        this.props.saveUserSettings(this.props.userId,this.props.userConfiguration)
    }
}


const mapStateToProps = (state) => ({
    userId: state.user.loggedInUser.id,
    userConfiguration: state.user.userConfiguration,
    projectTemplates: state.user.projectTemplates
})

const mapDispatchToProps = (dispatch) => ({
    loadUserSettings: (userId) => dispatch(UserActions.loadUserSettings(userId)),
    saveUserSettings: (userId,userConfig) => dispatch(UserActions.saveUserSettings(userId,userConfig))
})

const UserSettingsComponent = wrapComponentWithProvider(reduxStore, UserSettings, mapStateToProps, mapDispatchToProps)
export default UserSettingsComponent