import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import UserActions from './user-actions'
import uuidStore from '../../../shared-utils/uuid-store'

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

initSearchBox () {
  let location = ''
  if(this.props.userConfiguration !== null){
    location = this.props.userConfiguration.defaultLocation
  }
  var ids = 0
  var searchSessionToken = ''
  var search = $('#set-default-location .select2')
  //var self = this
  search.select2({
    placeholder: 'Set an address, city, state or CLLI code',
    initSelection: function (select, callback) {
      callback({ 'id': 0, 'text': location })
    },
    ajax: {
      url: '/search/addresses',
      dataType: 'json',
      quietMillis: 250, // *** In newer versions of select2, this is called 'delay'. Remember this when upgrading select2
      data: (term) => ({
        text: term,
        sessionToken: uuidStore.getInsecureV4UUID(),
        biasLatitude: this.props.defaultPlanCoordinates.latitude,
        biasLongitude: this.props.defaultPlanCoordinates.longitude
      }),
      results: (data, params) => {
        var items = data.map((location) => {
          return {
            id: 'id-' + (++ids),
            text: location.displayText,
            type: location.type,
            value: location.value
          }
        })
        if (items.length === 0) {
          items.push({
            id: 'id-' + (++ids),
            text: 'Search an address, city, or state',
            type: 'placeholder'
          })
        }
        return {
          results: items,
          pagination: {
            more: false
          }
        }
      },
      cache: true
    }
  }).on('change', (e) => {
    var selected = e.added
    if (selected) {
      searchSessionToken = uuidStore.getInsecureV4UUID()
      this.props.userConfiguration.defaultLocation = selected.text
    }
  })
  search.select2('val', location, true)
}

  componentDidMount () {
    if(this.props.userIdForSettingsEdit !== null ){
      this.props.loadUserSettings(this.props.userIdForSettingsEdit)
    }
  }

  componentDidUpdate(){
    this.initSearchBox()
  }

  render () {

    return this.props.userConfiguration===null || this.props.projectTemplates===null
    ? null
    : <>{this.renderUserSettings()}</>
  }

  renderUserSettings () {
    
    this.initSearchBox()
    
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

    // WHY IS THIS HARD CODED OH MY GOSH
    let perspectiveList = []
    perspectiveList.push(<option key={'admin'} value={'admin'}>{'Admin'}</option>)
    perspectiveList.push(<option key={'standard'} value={'standard'}>{'Standard'}</option>)
    perspectiveList.push(<option key={'biz-dev'} value={'biz-dev'}>{'Biz-dev'}</option>)
    perspectiveList.push(<option key={'sales_engineer'}  value={'sales_engineer'}>{'Sales Engineers'}</option>)
    perspectiveList.push(<option key={'account_exec'}  value={'account_exec'}>{'Account Executive'}</option>)
    perspectiveList.push(<option key={'sales_exec'}  value={'sales_exec'}>{'Sales Executive'}</option>)

    return (
      <div className="no-collapse" id="set-default-location" style={{display: 'flex',flexDirection: 'column', height: '100%'}}>
          <div style={{flex: "1 1 auto"}}>
            <table id="tblUserSettings" className="table table-sm table-striped">
            <tbody>
              <tr>
                <td>Map Start Location</td>
                <td> 
                  <input className="form-control select2" type="text" name="defaultLocation" value={this.props.userConfiguration.defaultLocation} placeholder="Set cities, states or wirecenters" onChange={(e)=>this.handleChange(e)}/>
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
          <div style={{flex: "0 0 auto"}}>
                <button className="btn btn-primary float-right" onClick={() => this.saveSettings()}><i className="fa fa-save"></i>&nbsp;&nbsp;Save Settings</button>
          </div>
      </div>
    )
  }

  handleChange(e) {
    let userConfig = this.state.userConfig; 
    userConfig[e.target.name] = e.target.value;
    this.setState({ userConfig: userConfig });
  }

  handleDropdownChange(e) {
    let userConfig = this.state.userConfig; 
    userConfig[e.target.name] = e.target.value;
    this.setState({ userConfig: userConfig });
  }

  saveSettings() {
    this.props.saveUserSettings(this.props.userIdForSettingsEdit,this.props.userConfiguration)
  }
}


const mapStateToProps = (state) => ({
  userId: state.user.loggedInUser.id,
  userConfiguration: state.user.userConfiguration,
  projectTemplates: state.user.projectTemplates,
  defaultPlanCoordinates: state.plan.defaultPlanCoordinates
})

const mapDispatchToProps = (dispatch) => ({
  loadUserSettings: (userId) => dispatch(UserActions.loadUserSettings(userId)),
  saveUserSettings: (userId,userConfig) => dispatch(UserActions.saveUserSettings(userId,userConfig))
})

const UserSettingsComponent = wrapComponentWithProvider(reduxStore, UserSettings, mapStateToProps, mapDispatchToProps)
export default UserSettingsComponent