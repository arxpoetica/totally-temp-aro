import React, { Component } from 'react'
import { connect } from 'react-redux'
import ResourceActions from './resource-actions'

export class ArpuEditor extends Component {
  constructor (props) {
    super(props)
    this.state = {
      selectedArpuModelIndex : 0,
      speedCategoryHelp : '',
      arpuManagerConfiguration: []
    }

    this.speedCategoryHelpObj = {
      "speedCategoryHelp": {
        "default": "The speed category describes the maximum rated speed (e.g. 100 Mbps) for a fiber/cable type",
        "cat3": "Category 3 cable, commonly known as Cat 3 or station wire, and less commonly known as VG or voice-grade (as, for example, in 100BaseVG), is an unshielded twisted pair (UTP) cable used in telephone wiring. It is part of a family of copper cabling standards defined jointly by the Electronic Industries Alliance (EIA) and the Telecommunications Industry Association (TIA) and published in TIA/EIA-568-B.",
        "cat5": "Category 5 cable, commonly referred to as Cat 5, is a twisted pair cable for computer networks. The cable standard provides performance of up to 100 Mbps and is suitable for most varieties of Ethernet over twisted pair. Cat 5 is also used to carry other signals such as telephony and video.",
        "cat7": "The Category 7 cable standard was ratified in 2002 to allow 10 Gigabit Ethernet over 100 m of copper cabling. The cable contains four twisted copper wire pairs, just like the earlier standards. Category 7 cable can be terminated either with 8P8C compatible GG45 electrical connectors which incorporate the 8P8C standard or with TERA connectors. When combined with GG-45 or TERA connectors, Category 7 cable is rated for transmission frequencies of up to 600 MHz."
      }
    }
  }

  componentDidMount () {
    this.props.loadArpuManagerConfiguration(this.props.resourceManagerId); 
  }

  componentWillReceiveProps(nextProps){
    if(this.props != nextProps) {
      if(nextProps.arpuManagerConfiguration !== undefined) {
        this.setState({arpuManagerConfiguration: nextProps.arpuManagerConfiguration})
      }
    }
  }

  render () {
    return this.props.roicManager === null ||  this.props.arpuManagerConfiguration === null || this.state.arpuManagerConfiguration.arpuModels === undefined
      ? null
      : this.renderArpuEditor()
  }

  renderArpuEditor()  {

    const {arpuManagerConfiguration, selectedArpuModelIndex, speedCategoryHelp} = this.state

    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
        <h4>{this.props.resourceManagerName} </h4>
        <div style={{flex: '1 1 auto'}}>
          <div style={{maxHeight: '500px', overflowY : 'auto'}}>
            <div className="container">
              <div className="row">
                {/* <!-- On the left, show a list of ARPU models that the user can edit --> */}
                <div className="col-md-4">
                  <ul className="nav nav-pills flex-column" style={{maxHeight: '380px', overflowY : 'auto'}}>
                  {
                  arpuManagerConfiguration.arpuModels.map((item, index) =>
                    <li role="presentation" className="nav-item" key={index} onClick={(e) => this.selectArpuModel(index)}>
                      {/* <!-- Show the entity type and speed category --> */}
                      <div className={`nav-link pill-parent ${selectedArpuModelIndex === index ? 'active' : ''}`} style={{cursor: 'pointer'}}>
                        {item.id.locationEntityType} / {item.id.speedCategory}
                        <span className="badge badge-light float-right" onClick={(e) => this.showSpeedCategoryHelp(item.id.speedCategory)} style={{marginTop: '2px', cursor: 'pointer'}}>
                          <i className="fa fa-question"></i>
                        </span>
                    </div>
                    </li>
                  )}
                  </ul>
                </div>
        
                {/* <!-- On the right, show the details of the currently selected ARPU model --> */}
                <div className="col-md-8">
                  <table id="tblArpuModel" className="table table-sm table-striped">
                    <tbody>
                      <tr>
                        <td>ARPU Strategy</td>
                        <td><input type="text" className="form-control" name="strategy" onChange={e => {this.handleArpuChange(e, selectedArpuModelIndex)}}  value={arpuManagerConfiguration.arpuModels[selectedArpuModelIndex].arpuStrategy}/></td>
                      </tr>
                      <tr>
                        <td>Revenue</td>
                        <td><input type="text" className="form-control" name="revenue" onChange={e => {this.handleArpuChange(e, selectedArpuModelIndex)}} value={arpuManagerConfiguration.arpuModels[selectedArpuModelIndex].revenue}/></td>
                      </tr>
                    </tbody>
                  </table>
                  {
                  speedCategoryHelp &&
                  <div  className="alert alert-info alert-dismissible fade show" role="alert">
                    {speedCategoryHelp}
                    <button type="button" className="close" aria-label="Close" onClick={()=>this.hideSpeedCategoryHelp()}>
                      <span aria-hidden="true">&times;</span>
                    </button>
                  </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{flex: '0 0 auto'}}>
          <div style={{textAlign: 'right'}}>
            <button className="btn btn-light mr-2" onClick={() => this.exitEditingMode()}>
              <i className="fa fa-undo action-button-icon"></i>Discard changes
            </button>
            <button className="btn btn-primary" onClick={() => this.saveConfigurationToServer()}>
              <i className="fa fa-save action-button-icon"></i>Save
            </button>
          </div>
        </div>
    </div>
    )
  }

  selectArpuModel(index){
    this.setState({selectedArpuModelIndex : index})
  }

  handleArpuChange (e, selectedArpuModelIndex) {  

    let name = e.target.name;
    let value = e.target.value;

    var pristineArpuManager = this.state.arpuManagerConfiguration
    pristineArpuManager.arpuModels[selectedArpuModelIndex][name] = value

    this.setState({arpuManagerConfiguration : pristineArpuManager})
  }

  exitEditingMode(){
    this.props.setIsResourceEditor(true);
  }

  saveConfigurationToServer(){
    this.props.saveArpuConfigurationToServer(this.props.arpuManager.id, this.props.pristineArpuManagerConfiguration, this.state.arpuManagerConfiguration)
  }

  showSpeedCategoryHelp (category) {
    this.setState({speedCategoryHelp : this.speedCategoryHelpObj.speedCategoryHelp[category] || this.speedCategoryHelpObj.speedCategoryHelp.default})
  }

  hideSpeedCategoryHelp (){
    this.setState({speedCategoryHelp : ''})
  }
}

  const mapStateToProps = (state) => ({
    arpuManager: state.resourceEditor.arpuManager,
    arpuManagerConfiguration: state.resourceEditor.arpuManagerConfiguration,
    pristineArpuManagerConfiguration : state.resourceEditor.pristineArpuManagerConfiguration,
    resourceManagerName: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].resourceManagerName,  
    resourceManagerId: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].resourceManagerId,
  })   

  const mapDispatchToProps = (dispatch) => ({
    getResourceTypes: () => dispatch(ResourceActions.getResourceTypes()),
    loadArpuManagerConfiguration: (arpuManagerId) => dispatch(ResourceActions.loadArpuManagerConfiguration(arpuManagerId)),
    setIsResourceEditor: (status) => dispatch(ResourceActions.setIsResourceEditor(status)),
    saveArpuConfigurationToServer: (arpuManagerId, pristineArpuManager, arpuManager) => dispatch(ResourceActions.saveArpuConfigurationToServer(arpuManagerId, pristineArpuManager, arpuManager)),
  })

const ArpuEditorComponent = connect(mapStateToProps, mapDispatchToProps)(ArpuEditor)
export default ArpuEditorComponent