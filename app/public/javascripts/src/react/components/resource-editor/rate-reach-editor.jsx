import React, { Component } from 'react'
import { connect } from 'react-redux'
import ResourceActions from './resource-actions'
import RateReachDistanceEditor from './rate-reach-distance-editor.jsx'

// import reduxStore from '../../../redux-store'
// import wrapComponentWithProvider from '../../common/provider-wrapped-component'

export class RateReachEditor extends Component {
  constructor (props) {
    super(props)

    this.editingModes = Object.freeze({
      SPEEDS: 'SPEEDS',
      RATE_REACH_RATIOS: 'RATE_REACH_RATIOS'
    })

    this.state = {
      rateReachManagerConfigs: undefined, // ToDo: this is an object and should not default to a string
      selectedTechnologyType : 'FiberProximity', // ToDo: this should not be hardcoded
      selectedEditingMode: this.editingModes.SPEEDS
    }

    this.categoryDescription = {
      SPEED: 'Speeds',
      BAND: 'Bands'
    }

    this.rateReachRatioDescription = {
      RETAIL: 'Retail',
      WHOLESALE: 'Wholesale',
      TOWER: 'Tower'
    }
    this.handleRateReachEditorChange = this.handleRateReachEditorChange.bind(this)
    this.handleRateReachMatrixChange = this.handleRateReachMatrixChange.bind(this)
  }  

  componentDidMount () {
    this.props.reloadRateReachManagerConfiguration(this.props.resourceManagerId, this.props.loggedInUser); 
    this.updateModalTitle()
    if (this.props !== undefined) this.setState({ rateReachManagerConfigs: this.props.rateReachManagerConfigs })
  }

  componentDidUpdate (prevProps) {
    if (!_.isEqual(this.props.rateReachManagerConfigs, prevProps.rateReachManagerConfigs)) {
      this.updateModalTitle()
      this.setState({ rateReachManagerConfigs: this.props.rateReachManagerConfigs })
    } else if (this.props.resourceManagerName && this.props.resourceManagerName !== prevProps.resourceManagerName) {
      this.updateModalTitle()
    }
  }

  // ToDo: this doesn't belong here
  updateModalTitle () {
    let name = this.props.resourceManagerName || ''
    var cat = ''
    if (this.props.rateReachManagerConfigs &&
        this.props.rateReachManagerConfigs.rateReachConfig &&
        this.props.rateReachManagerConfigs.rateReachConfig.categoryType) {
      cat = this.categoryDescription[this.props.rateReachManagerConfigs.rateReachConfig.categoryType]
      cat = ` [${cat}]`
    }
    this.props.setModalTitle(`${name}${cat}`)
  }

  render () {
    return (this.props.rateReachManager === null || this.props.rateReachManagerConfigs === undefined || this.state.rateReachManagerConfigs === undefined)
    ? <div>NOPE</div>
    : this.renderRateReachEditor()
  }

  renderRateReachEditor()  {
    const {rateReachManagerConfigs, selectedTechnologyType, selectedEditingMode} = this.state
    return (
      <div className="container" style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
        <div className="row">
          <div className="col-md-12">
            <form>
              <div className="form-group row">
                <label className="col-md-4 col-form-label text-right" style={{fontWeight: '700'}}>Technology Type</label>
                <select id="cboTechnologyTypes" className="form-control col-md-4" onChange={e => {this.handleTechChange(e)}} value={selectedTechnologyType}>
                  {Object.entries(rateReachManagerConfigs.rateReachConfig.rateReachGroupMap).map(([techKey], techIndex) => (
                    <option key={techIndex} value={techKey}>{techKey}</option>
                  ))}
                </select>
              </div>
            </form>
          </div>  
        </div>

        <div style={{flex: '1 1 auto'}}> 
          <div className="row">
            {/* <!-- On the left, show dropdowns with the options that the user can edit --> */}
            <div className="col-lg-3" style={{overflowY: 'auto'}}>
              <form id="rateReachSettings">
                <span className="ctype-checkbox" style={{marginRight: '5px'}}>
                  <input type="checkbox" className="checkboxfill"
                    onChange={e => {this.handleEnableChange(e)}}
                    checked={rateReachManagerConfigs.rateReachConfig.rateReachGroupMap[selectedTechnologyType].active}/>
                </span>
                <label className="ctype-name">Enabled</label>

                <div style={{position: 'relative', marginTop: '10px'}}>
                  <div className="form-group">
                    <label>Network Connectivity</label>
                    <select id="cboNetworkStructures" className="form-control" onChange={e => {this.handleNetWorkChange(e)}} value={rateReachManagerConfigs.rateReachConfig.rateReachGroupMap[selectedTechnologyType].networkStructure}>
                      {rateReachManagerConfigs.technologyTypeDetails[selectedTechnologyType].networkStructures.map((techKey, techIndex) => (
                        <option key={techIndex} value={techKey}>{techKey}</option>
                      ))}
                    </select>
                  </div>
                  {!rateReachManagerConfigs.rateReachConfig.rateReachGroupMap[selectedTechnologyType].active &&
                    <div className="disable-sibling-controls"></div>
                  }
                </div>
              </form>
            </div>
            {/* <!-- On the right, show the details of the currently selected combination of category type, technology type, etc. --> */}
            <div className="col-lg-9"  style={{overflowY: 'auto'}}>
              <ul className="nav nav-tabs">
                <li className="nav-item">
                  <a href="#" className={`nav-link ${selectedEditingMode === this.editingModes.SPEEDS ? 'active' : ''}`} onClick={e => {this.handleEditMode(this.editingModes.SPEEDS)}}>
                    {this.categoryDescription[rateReachManagerConfigs.rateReachConfig.categoryType]}
                  </a>
                </li>
                <li className="nav-item">
                  <a href="#" className={`nav-link ${selectedEditingMode === this.editingModes.RATE_REACH_RATIOS ? 'active' : ''}`} onClick={e => {this.handleEditMode(this.editingModes.RATE_REACH_RATIOS)}}>
                    Rate Reach Ratios
                  </a>
                </li>
              </ul>
              {selectedEditingMode === this.editingModes.SPEEDS &&
                <RateReachDistanceEditor
                  categoryDescription={this.categoryDescription[rateReachManagerConfigs.rateReachConfig.categoryType]}
                  technologies={rateReachManagerConfigs.technologyTypeDetails[selectedTechnologyType].technologies}
                  rateReachGroupMap={rateReachManagerConfigs.rateReachConfig.rateReachGroupMap}
                  selectedTechnologyType={selectedTechnologyType}
                  categories={rateReachManagerConfigs.rateReachConfig.categories}
                  categoryType={rateReachManagerConfigs.rateReachConfig.categoryType}
                  allowEditableCategories={rateReachManagerConfigs.rateReachConfig.categoryType === 'SPEED'}
                  onRateReachEditChange={this.handleRateReachEditorChange}
                  onRateReachMatrixChange={this.handleRateReachMatrixChange}
                >
                </RateReachDistanceEditor>
              }  
              {selectedEditingMode === this.editingModes.RATE_REACH_RATIOS &&
                <div className="container-fluid">
                  <table id="tblRateReachRatios" className="table table-sm table-borderless">
                    <tbody>  
                      {Object.entries(rateReachManagerConfigs.rateReachConfig.marketAdjustmentFactorMap).map(([techKey], techIndex) => (
                        <tr key={techIndex} className="d-flex">
                          <td className="col-3">{this.rateReachRatioDescription[techKey]}</td>
                          <td className="col-4">
                            <input className="form-control" onChange={e => {this.handleRateReachRatioChange(e, techKey)}} value={rateReachManagerConfigs.rateReachConfig.marketAdjustmentFactorMap[techKey]}/>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              } 
              {!rateReachManagerConfigs.rateReachConfig.rateReachGroupMap[selectedTechnologyType].active &&
                <div className="disable-sibling-controls"></div>
              }
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

  // make utility?
  clone (obj) {
    return JSON.parse(JSON.stringify(obj))
  }

  handleRateReachRatioChange(e, techKey){
    let pristineRateReachManagerConfigs = this.clone(this.state.rateReachManagerConfigs)
    pristineRateReachManagerConfigs.rateReachConfig.marketAdjustmentFactorMap[techKey] = e.target.value
    this.setState({rateReachManagerConfigs: pristineRateReachManagerConfigs })
  }

  handleRateReachMatrixChange(rateReachGroupMap){
    let pristineRateReachManagerConfigs = this.clone(this.state.rateReachManagerConfigs)
    pristineRateReachManagerConfigs.rateReachConfig.rateReachGroupMap = rateReachGroupMap
  }

  handleRateReachEditorChange(editableCategories){
    let pristineRateReachManagerConfigs = this.clone(this.state.rateReachManagerConfigs)
    pristineRateReachManagerConfigs.rateReachConfig.categories = editableCategories
  }

  handleEditMode(selectedEditingMode){
    this.setState({selectedEditingMode: selectedEditingMode })
  }

  handleEnableChange(e){
    let toggleEnabled = this.state.rateReachManagerConfigs.rateReachConfig.rateReachGroupMap[this.state.selectedTechnologyType].active
    let pristineRateReachManagerConfigs = this.clone(this.state.rateReachManagerConfigs)
    pristineRateReachManagerConfigs.rateReachConfig.rateReachGroupMap[this.state.selectedTechnologyType].active = !toggleEnabled
    this.setState({rateReachManagerConfigs: pristineRateReachManagerConfigs})
  }

  handleNetWorkChange(e){
    let pristineRateReachManagerConfigs = this.clone(this.state.rateReachManagerConfigs)
    pristineRateReachManagerConfigs.rateReachConfig.rateReachGroupMap[this.state.selectedTechnologyType].networkStructure = e.target.value
    this.setState({rateReachManagerConfigs: pristineRateReachManagerConfigs})
  }

  handleTechChange(e){
    this.setState({selectedTechnologyType: e.target.value })
  }

  exitEditingMode(){
    this.props.setIsRrmManager(false)
    this.props.onDiscard()
  }

  saveConfigurationToServer(){
    this.props.saveRateReachConfig(this.props.resourceManagerId, this.state.rateReachManagerConfigs.rateReachConfig)
    this.props.setIsRrmManager(false)
  }
}

  const mapStateToProps = (state) => ({
    resourceManagerName: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].resourceManagerName,  
    resourceManagerId: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].resourceManagerId,
    loggedInUser: state.user.loggedInUser,
    rateReachManager: state.resourceEditor.rateReachManager,
    rateReachManagerConfigs: state.resourceEditor.rateReachManagerConfigs,
  })   

  const mapDispatchToProps = (dispatch) => ({
    setIsResourceEditor: (status) => dispatch(ResourceActions.setIsResourceEditor(status)),
    reloadRateReachManagerConfiguration: (rateReachManagerId, loggedInUser) => dispatch(ResourceActions.reloadRateReachManagerConfiguration(rateReachManagerId, loggedInUser)),
    saveRateReachConfig:(rateReachManagerId, rateReachConfig) => dispatch(ResourceActions.saveRateReachConfig(rateReachManagerId, rateReachConfig)),
    setModalTitle: (title) => dispatch(ResourceActions.setModalTitle(title)),
    setIsRrmManager: (status) => dispatch(ResourceActions.setIsRrmManager(status)),
  })

const RateReachEditorComponent = connect(mapStateToProps, mapDispatchToProps)(RateReachEditor)
// const RateReachEditorComponent = wrapComponentWithProvider(reduxStore, RateReachEditor, mapStateToProps, mapDispatchToProps)
export default RateReachEditorComponent