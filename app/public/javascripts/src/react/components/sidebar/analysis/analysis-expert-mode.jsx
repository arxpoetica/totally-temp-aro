import React, { Component } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import AnalysisActions from './analysis-actions'
import rxState from '../../../common/rxState'
import { createSelector } from 'reselect'
import ToolBarActions from '../../header/tool-bar-actions'

export class AnalysisExpertMode extends Component {
  constructor (props) {
    super(props)

    this.rxState = new rxState();
    
    this.props.setSelectedExpertMode(this.props.expertModeTypes['MANUAL_PLAN_TARGET_ENTRY'].id)
    this.props.getExpertModeScopeContext(this.props.plan)

    this.state = {
      expertMode: this.rxState.expertMode,
    }
  }

  componentDidMount () {
    const {optimizationInputs, activeSelectionModeId, locationLayers, plan} = this.props

    let expertMode =  this.state.expertMode
    expertMode.OPTIMIZATION_SETTINGS = JSON.stringify(this.props.getOptimizationBody(optimizationInputs, activeSelectionModeId, locationLayers, plan), undefined, 4)
    this.setState({expertMode : expertMode})
  }

  render () {

    const {expertModeTypes, scopeContextKeys, selectedExpertMode} = this.props
    const {expertMode} = this.state

    return (
      <div className="row" style={{height:'100%'}}>
        <div className="col-md-12" style={{height:'80%'}}>
          <select className="form-control" onChange={(e)=>this.handleExpertModeTypesChange(e)} value={selectedExpertMode}>
            {Object.entries(expertModeTypes).map(([ key, item ], index) => { 
              return (
                <option key={index} value={item.id} label={item.label}></option>
              )
            })
            }
          </select>

          {selectedExpertMode !== expertModeTypes['OPTIMIZATION_SETTINGS'].id && 
            <textarea rows="17" maxLength="75000"  style={{fontFamily: 'Courier', width:'100%', height:'100%'}} 
              value={expertMode[selectedExpertMode]}
              placeholder={`Available Keys: ${JSON.stringify(scopeContextKeys)}`}
              onChange={(e)=>this.validateExpertModeQuery(e)}
              spellCheck="false"> 
            </textarea>
          }

          {selectedExpertMode === expertModeTypes['OPTIMIZATION_SETTINGS'].id && 
            <textarea rows="20" style={{fontFamily: 'Courier', width:'100%', height:'100%'}} 
              value={expertMode.OPTIMIZATION_SETTINGS}
              onChange={(e)=>this.handleOptimizationSettings(e)}
              spellCheck="false"> 
            </textarea>
          }
        </div>
      </div>
    )
  }

  handleOptimizationSettings (e) {
    var expertMode =  this.state.expertMode;
    expertMode['OPTIMIZATION_SETTINGS'] = e.target.value
    this.setState({expertMode: expertMode})
  }

  validateExpertModeQuery (e) {
    var expertMode =  this.state.expertMode;
    var selectedExpertMode = this.props.selectedExpertMode
    expertMode[selectedExpertMode]= e.target.value
    this.setState({expertMode: expertMode})

    var hasExcludeTerm = false
    var excludeTerms = ['delete', 'drop', 'update', 'alter', 'insert', 'call', 'commit', 'create']
    excludeTerms.forEach((term) => {
      if (this.state.expertMode[this.props.selectedExpertMode].toLowerCase().indexOf(term) > -1) hasExcludeTerm = true
    })
    this.props.expertModeTypes[this.props.selectedExpertMode].isQueryValid = this.state.expertMode[this.state.selectedExpertMode].toLowerCase().indexOf('select') > -1 &&
        !hasExcludeTerm
  }

  handleExpertModeTypesChange (e) {
    this.props.setSelectedExpertMode(e.target.value)
  }
}

// We need a selector, else the .toJS() call will create an infinite digest loop
const getAllLocationLayers = state => state.mapLayers.location
const getLocationLayersList = createSelector([getAllLocationLayers], (locationLayers) => locationLayers.toJS())

const mapStateToProps = (state) => ({
  expertModeTypes: state.analysisMode.expertModeTypes,
  selectedExpertMode: state.analysisMode.selectedExpertMode,
  optimizationInputs: state.optimization.networkOptimization.optimizationInputs,
  activeSelectionModeId: state.selection.activeSelectionMode.id,
  locationLayers: getLocationLayersList(state),
  plan: state.plan.activePlan,
  scopeContextKeys: state.analysisMode.scopeContextKeys
})  

const mapDispatchToProps = (dispatch) => ({
  setSelectedExpertMode : (selectedExpertMode) => dispatch(AnalysisActions.setSelectedExpertMode(selectedExpertMode)),
  getOptimizationBody : (optimizationInputs, activeSelectionModeId, locationLayers, plan) => dispatch(ToolBarActions.getOptimizationBody(optimizationInputs, activeSelectionModeId, locationLayers, plan)),
  getExpertModeScopeContext : (plan) => dispatch(AnalysisActions.getExpertModeScopeContext(plan)),
})

const AnalysisExpertModeComponent = wrapComponentWithProvider(reduxStore, AnalysisExpertMode, mapStateToProps, mapDispatchToProps)
export default AnalysisExpertModeComponent