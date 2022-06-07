import React, { Component } from 'react'
import { connect } from 'react-redux'
import ResourceActions from './resource-actions'

export class ImpedanceEditor extends Component {
  constructor (props) {
    super(props)
    this.state = {
      impedanceManagerConfigurations: ''
    }

    // "mappingLabels" should map from a impedance mapping key (e.g. 0) to a text description of the mapping
    this.mappingLabels = {
      '-1': 'Unknown tile',
      0: 'Missing tile',
      1: 'Line of sight tile',
      2: 'Mapping 2',
      3: 'Light foliage/building clutter tile',
      4: 'Dense foliage tile',
      5: 'Building blocker tile'
    }    
  }

  componentDidMount () {
    this.props.reloadImpedanceManagerConfiguration(this.props.resourceManagerId); 
    this.props.setModalTitle(this.props.resourceManagerName); 
  }

  componentWillReceiveProps(nextProps){
    if(this.props != nextProps) {
      if(nextProps.impedanceManagerConfigurations !== undefined) {
        this.setState({impedanceManagerConfigurations: nextProps.impedanceManagerConfigurations})
      }
    }
  }

  render () {
    return this.props.impedanceManager === null
      ? null
      : this.renderImpedanceEditor()
  }

  renderImpedanceEditor()  {
    
    const {impedanceManagerConfigurations} = this.state

    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
          <div style={{flex: '1 1 auto'}}>
          <div style={{maxHeight: '500px', overflowY : 'auto', overflowX : 'hidden'}}>
            <form>
              {/* <!-- The scale factor in meters --> */}
              <div className="form-group row">
                <label className="col-sm-3 col-form-label">Scale Factor (meters)</label>
                <div className="col-sm-9">
                  {impedanceManagerConfigurations.impedanceManagerConfiguration !== undefined &&
                    <input type="text" name="scaleFactorMeters" onChange={e => {this.handleScaleFactorChange(e)}} className="form-control" id="inputScaleFactor" value={impedanceManagerConfigurations.impedanceManagerConfiguration.scaleFactorMeters}/>
                  }
                </div>
              </div>

              {/* <!-- The impedance mapping --> */}
              <table id="tblImpedanceMapping" className="table table-sm table-striped">
                <thead className="thead-dark">
                  <tr>
                    <th>ID</th>
                    <th>Tile Type</th>
                    <th>Value</th>
                  </tr>
                </thead>
                {impedanceManagerConfigurations.orderedImpedanceMapKeys !== undefined &&
                  <tbody>
                    {impedanceManagerConfigurations.orderedImpedanceMapKeys.map((impedanceMappingKey, index) => {
                      return (
                        <tr key={index}>
                          <td>{impedanceMappingKey}</td>
                          <td>{this.mappingLabels[impedanceMappingKey]}</td>
                          <td>
                            <input type="text" className="form-control" onChange={e => {this.handleImpedanceValueChange(e, impedanceMappingKey)}} value={impedanceManagerConfigurations.impedanceManagerConfiguration.map[impedanceMappingKey]}/>
                          </td>
                        </tr>
                      )
                    })
                    }
                  </tbody>
              }
              </table>
            </form>
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

  handleScaleFactorChange (e) {  
    var pristineImpedanceManager = this.state.impedanceManagerConfigurations
    pristineImpedanceManager.impedanceManagerConfiguration.scaleFactorMeters = e.target.value

    this.setState({impedanceManagerConfigurations : pristineImpedanceManager})
  }

  handleImpedanceValueChange (e, impedanceMappingKey) {  
    var pristineImpedanceManager = this.state.impedanceManagerConfigurations
    pristineImpedanceManager.impedanceManagerConfiguration.map[impedanceMappingKey] =  e.target.value

    this.setState({impedanceManagerConfigurations : pristineImpedanceManager})
  }

  exitEditingMode(){
    this.props.onDiscard()
  }

  saveConfigurationToServer(){
    this.props.saveImpedanceConfigurationToServer(this.props.impedanceManager.id,  this.state.impedanceManagerConfigurations.impedanceManagerConfiguration)
  }
}

  const mapStateToProps = (state) => ({
    impedanceManager: state.resourceEditor.impedanceManager,
    impedanceManagerConfigurations: state.resourceEditor.impedanceManagerConfigurations,
    resourceManagerName: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].resourceManagerName,  
    resourceManagerId: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].resourceManagerId,
  })   

  const mapDispatchToProps = (dispatch) => ({
    setIsResourceEditor: (status) => dispatch(ResourceActions.setIsResourceEditor(status)),
    reloadImpedanceManagerConfiguration: (impedanceManagerId) => dispatch(ResourceActions.reloadImpedanceManagerConfiguration(impedanceManagerId)),
    saveImpedanceConfigurationToServer: (impedanceManagerId, impedanceManagerConfiguration) => dispatch(ResourceActions.saveImpedanceConfigurationToServer(impedanceManagerId, impedanceManagerConfiguration)),
    setModalTitle: (title) => dispatch(ResourceActions.setModalTitle(title))
  })

const ImpedanceEditorComponent = connect(mapStateToProps, mapDispatchToProps)(ImpedanceEditor)
export default ImpedanceEditorComponent