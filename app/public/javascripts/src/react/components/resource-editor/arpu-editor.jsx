import React, { Component } from 'react'
import { connect } from 'react-redux'
import ResourceActions from './resource-actions'

export class ArpuEditor extends Component {
  constructor (props) {
    super(props)
    this.state = {
      selectedArpuModal : 0,
      speedCategoryHelp : ''
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
    this.props.loadArpuManagerConfiguration(this.props.selectedResourceForEdit); 
  }

  render () {
    return this.props.arpuManagerConfiguration === null
      ? null
      : this.renderArpuEditor()
  }

  renderArpuEditor()  {
    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
        <h4>{this.props.selectedResourceForEdit.name} </h4>
        <div style={{flex: '1 1 auto'}}>
          <div style={{maxHeight: '500px', overflowY : 'auto'}}>
            <div className="container">
              <div className="row">
                {/* <!-- On the left, show a list of ARPU models that the user can edit --> */}
                <div className="col-md-4">
                  <ul className="nav nav-pills flex-column" style={{maxHeight: '380px', overflowY : 'auto'}}>
                  {
                  this.props.arpuManagerConfiguration.arpuModels.map((item, index) =>
                    <li role="presentation" className="nav-item" key={index} onClick={(e) => this.selectArpuModel(index)}>
                      {/* <!-- Show the entity type and speed category --> */}
                      <div className={`nav-link pill-parent ${this.state.selectedArpuModal === index ? 'active' : 'true'}`} style={{cursor: 'pointer'}}>
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
                        <td><input type="text" className="form-control" name="strategy" onChange={(e)=>this.props.setArpuStrategy(e.target.value)} value={this.props.ArpuStrategy}/></td>
                      </tr>
                      <tr>
                        <td>Revenue</td>
                        <td><input type="text" className="form-control" name="revenue" onChange={(e)=>this.props.setArpuRevenue(e.target.value)} value={this.props.ArpuRevenue}/></td>
                      </tr>
                    </tbody>
                  </table>
                  {
                  this.state.speedCategoryHelp &&
                  <div  className="alert alert-info alert-dismissible fade show" role="alert">
                    {this.state.speedCategoryHelp}
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
            <button className="btn btn-light mr-2" onClick={() => this.handleBack()}>
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
    this.setState({selectedArpuModal : index})
    this.props.setArpuStrategy(this.props.arpuManagerConfiguration.arpuModels[this.state.selectedArpuModal].arpuStrategy)
    this.props.setArpuRevenue(this.props.arpuManagerConfiguration.arpuModels[this.state.selectedArpuModal].revenue)
  }

  handleBack(){
    this.props.getResourceTypes();
  }

  handleChange (e) {  
    console.log(e.target.value)
  }

  saveConfigurationToServer(){
    let arpuManagerConfiguration = this.props.arpuManagerConfiguration
    let pristineArpuManagerConfiguration = this.props.pristineArpuManagerConfiguration

    var changedModels = []
    arpuManagerConfiguration.arpuModels.forEach((arpuModel) => {
      var arpuKey = JSON.stringify(arpuModel.id)
      var pristineModel = pristineArpuManagerConfiguration[arpuKey]
      console.log(pristineModel)

      if (pristineModel) {
        // Check to see if the model has changed
        if (JSON.stringify(pristineModel) !== angular.toJson(arpuModel)) {
          changedModels.push(arpuModel)
        }
      }
    })
  }

  showSpeedCategoryHelp (category) {
    this.setState({speedCategoryHelp : this.speedCategoryHelpObj.speedCategoryHelp[category] || this.speedCategoryHelpObj.speedCategoryHelp.default})
  }

  hideSpeedCategoryHelp (){
    this.setState({speedCategoryHelp : ''})
  }
}

  const mapStateToProps = (state) => ({
    arpuManagerConfiguration: state.resourceEditor.arpuManagerConfiguration,
    pristineArpuManagerConfiguration : state.resourceEditor.pristineArpuManagerConfiguration,
    ArpuStrategy : state.resourceEditor.ArpuStrategy,
    ArpuRevenue : state.resourceEditor.ArpuRevenue

  })   

  const mapDispatchToProps = (dispatch) => ({
    getResourceTypes: () => dispatch(ResourceActions.getResourceTypes()),
    loadArpuManagerConfiguration: (selectedResourceForEdit) => dispatch(ResourceActions.loadArpuManagerConfiguration(selectedResourceForEdit)),
    setArpuStrategy: (ArpuStrategy) => dispatch(ResourceActions.setArpuStrategy(ArpuStrategy)),
    setArpuRevenue: (ArpuRevenue) => dispatch(ResourceActions.setArpuRevenue(ArpuRevenue))
  })

const ArpuEditorComponent = connect(mapStateToProps, mapDispatchToProps)(ArpuEditor)
export default ArpuEditorComponent