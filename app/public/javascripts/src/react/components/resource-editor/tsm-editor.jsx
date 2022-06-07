import React, { Component } from 'react'
import { connect } from 'react-redux'
import ResourceActions from './resource-actions'

export class TsmEditor extends Component {
  constructor (props) {
    super(props)
    this.state = {
      tsmManagerConfiguration: '',
      isEmployee_count: false,
      isIndustry: false,
      isProduct: false
    }
  }  

  componentDidMount () {
    this.props.reloadTsmManagerConfiguration(this.props.resourceManagerId);
    this.props.setModalTitle(this.props.resourceManagerName); 
  }

  componentWillReceiveProps(nextProps){
    if(this.props != nextProps) {
      if(nextProps.tsmManagerConfigurations !== undefined) {
        this.setState({tsmManagerConfiguration: nextProps.tsmManagerConfigurations.tsmManagerConfiguration})
      }
    }
  }

  render () {
    return this.props.tsmManager === null || this.props.tsmManagerConfigurations === undefined
      ? null
      : this.renderTsmEditor()
  }

  renderTsmEditor()  {

    const {tsmManagerConfiguration} = this.state
    
    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
        <div style={{flex: '1 1 auto'}}> 
          <table id="tblTsmModel" className="table table-sm table-striped" style={{marginBottom: '0px'}}>
            <thead className="thead-dark">
              <tr>
                <th>Name</th>
                <th style={{width: '200px'}}>ARPU Weight</th>
              </tr>
            </thead>
            <tbody>
              {/* <!-- Only show the items with dimensionType === 'employee_count' --> */}
              <tr onClick={(e)=>this.handleEmployeeToggle()}>
                <td colSpan='2' className="sub-table-header">
                  Employee Count
                  <span className="float-right"><i className={this.state.isEmployee_count ? 'fa fa-minus-circle' : 'fa fa-plus-circle'}></i></span>
                </td>
              </tr>
              {this.state.isEmployee_count &&
                <>
                {tsmManagerConfiguration.filter((tsmValue) => tsmValue.dimensionType == 'employee_count')
                 .map((tsmModel, tsmIndex) =>
                  <tr key={tsmIndex}>
                    <td>{tsmModel.dimensionName}</td>
                    <td><input type="text" name="employee_count" onChange={e => {this.handleTSMChange(e, tsmIndex)}} className="form-control" value={tsmModel.arpuWeight}/></td>
                  </tr>
                 )}
                </>
              }

              {/* <!-- Only show the items with dimensionType === 'industry' --> */}
              <tr onClick={(e)=>this.handleIndustryToggle()}>
                <td colSpan='2' className="sub-table-header">
                  industry
                  <span className="float-right"><i className={this.state.isIndustry ? 'fa fa-minus-circle' : 'fa fa-plus-circle'}></i></span>
                </td>
              </tr>
              {this.state.isIndustry &&
                <>
                {tsmManagerConfiguration.filter((tsmValue) => tsmValue.dimensionType == 'industry')
                 .map((tsmModel, tsmIndex) =>
                  <tr key={tsmIndex}>
                    <td>{tsmModel.dimensionName}</td>
                    <td><input type="text" name="industry" onChange={e => {this.handleTSMChange(e, tsmIndex)}} className="form-control" value={tsmModel.arpuWeight}/></td>
                  </tr>
                 )}
                </>
              }

              {/* <!-- Only show the items with dimensionType === 'product' --> */}
              <tr onClick={(e)=>this.handleProductToggle()}>
                <td colSpan='2' className="sub-table-header">
                  Product
                  <span className="float-right"><i className={this.state.isProduct ? 'fa fa-minus-circle' : 'fa fa-plus-circle'}></i></span>
                </td>
              </tr>
              {this.state.isProduct &&
                <>
                {tsmManagerConfiguration.filter((tsmValue) => tsmValue.dimensionType == 'product')
                 .map((tsmModel, tsmIndex) =>
                  <tr key={tsmIndex}>
                    <td>{tsmModel.dimensionName}</td>
                    <td><input type="text" name="product" onChange={e => {this.handleTSMChange(e, tsmIndex)}} className="form-control" value={tsmModel.arpuWeight}/></td>
                  </tr>
                 )}
                </>
              }
            </tbody>
          </table>
          {/* <!-- Help text --> */}
          <div style={{fflex: '0 0 auto', fontStyle: 'italic', padding: '10px 0px'}}>Note: The final strength is [Employee Count] x [Industry] x [Product]</div>
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


  handleTSMChange (e, keyIndex) {  
    let name = e.target.name;
    let value = e.target.value;
    var pristineTsmManagerFormat = this.state.tsmManagerConfiguration

    {pristineTsmManagerFormat.filter((tsmValue) => tsmValue.dimensionType === name)
    .map((tsmModel, tsmIndex) => {
      if(keyIndex ===  tsmIndex){
        return tsmModel.arpuWeight = value
      }
    }
    )}

    this.setState({tsmManagerConfiguration: pristineTsmManagerFormat})
  }

  handleEmployeeToggle(){
    this.setState({isEmployee_count: !this.state.isEmployee_count})
  }

  handleIndustryToggle(){
    this.setState({isIndustry: !this.state.isIndustry})
  }

  handleProductToggle(){
    this.setState({isProduct: !this.state.isProduct})
  }

  exitEditingMode(){
    this.props.onDiscard()
  }

  saveConfigurationToServer(){
    this.props.saveTsmConfigurationToServer(this.props.loggedInUser, this.props.resourceManagerId, this.state.tsmManagerConfiguration, this.props.tsmManagerConfigurations.pristineTsmManagerConfiguration)
  }
}

  const mapStateToProps = (state) => ({
    resourceManagerName: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].resourceManagerName,  
    resourceManagerId: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].resourceManagerId,
    tsmManager: state.resourceEditor.tsmManager,
    tsmManagerConfigurations: state.resourceEditor.tsmManagerConfigurations,
    loggedInUser: state.user.loggedInUser
  })   

  const mapDispatchToProps = (dispatch) => ({
    setIsResourceEditor: (status) => dispatch(ResourceActions.setIsResourceEditor(status)),
    reloadTsmManagerConfiguration: (tsmManagerId) => dispatch(ResourceActions.reloadTsmManagerConfiguration(tsmManagerId)),
    saveTsmConfigurationToServer: (loggedInUser, tsmManagerId, tsmManagerConfiguration, pristineTsmManagerConfiguration) => dispatch(ResourceActions.saveTsmConfigurationToServer(loggedInUser, tsmManagerId, tsmManagerConfiguration, pristineTsmManagerConfiguration)),
    setModalTitle: (title) => dispatch(ResourceActions.setModalTitle(title))
  })

const TsmEditorComponent = connect(mapStateToProps, mapDispatchToProps)(TsmEditor)
export default TsmEditorComponent