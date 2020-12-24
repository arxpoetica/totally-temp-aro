import React, { Component } from 'react'
import { connect } from 'react-redux'
import AnalysisActions from './analysis-actions'
import { createSelector } from 'reselect'
import ToolBarActions from '../../header/tool-bar-actions'

export class AnalysisExpertMode extends Component {
  constructor (props) {
    super(props)

    this.props.getExpertModeScopeContext(this.props.plan)

    this.state = {
      expertMode: this.props.expertMode,
    }
  }

  componentDidMount () {
    const { optimizationInputs, activeSelectionModeId, locationLayers, plan } = this.props

    const expertMode = this.state.expertMode
    expertMode.OPTIMIZATION_SETTINGS = JSON.stringify(this.props.getOptimizationBody(optimizationInputs, activeSelectionModeId, locationLayers, plan), undefined, 4)
    this.setState({ expertMode })
  }

  render () {

    const { expertModeTypes, scopeContextKeys, selectedExpertMode } = this.props
    const { expertMode } = this.state

    return (
      <div className="row" style={{height:'100%'}}>
        <div className="col-md-12" style={{height:'80%'}}>
          <select className="form-control" onChange={(e) => this.handleExpertModeTypesChange(e)} value={selectedExpertMode}>
            {Object.entries(expertModeTypes).map(([key, item], index) => {
              return <option key={index} value={item.id} label={item.label}/>
            })
            }
          </select>

          {selectedExpertMode !== expertModeTypes['OPTIMIZATION_SETTINGS'].id &&
            <textarea 
              rows="17"
              maxLength="75000"
              style={{fontFamily: 'Courier', width: '100%', height: '100%'}}
              value={expertMode[selectedExpertMode]}
              placeholder={`Available Keys: ${JSON.stringify(scopeContextKeys)}`}
              onChange={(e) => this.validateExpertModeQuery(e)}
              spellCheck="false"
            />
          }

          {selectedExpertMode === expertModeTypes['OPTIMIZATION_SETTINGS'].id &&
            <textarea 
              rows="20"
              style={{fontFamily: 'Courier', width: '100%', height: '100%'}}
              value={expertMode.OPTIMIZATION_SETTINGS}
              onChange={(e) => this.handleOptimizationSettings(e)}
              spellCheck="false"
            />
          }
        </div>
      </div>
    )
  }

  handleOptimizationSettings (e) {
    const expertMode = this.state.expertMode;
    expertMode['OPTIMIZATION_SETTINGS'] = e.target.value
    this.setState({ expertMode })
    this.props.setExpertMode(JSON.parse(JSON.stringify(expertMode))) // To set the changed 'OPTIMIZATION_SETTINGS' in redux
  }

  validateExpertModeQuery (e) {
    const expertMode = this.state.expertMode;
    const selectedExpertMode = this.props.selectedExpertMode

    expertMode[selectedExpertMode] = e.target.value
    this.setState({ expertMode })
    this.props.setExpertMode(JSON.parse(JSON.stringify(expertMode)))

    let hasExcludeTerm = false
    const excludeTerms = ['delete', 'drop', 'update', 'alter', 'insert', 'call', 'commit', 'create']
    excludeTerms.forEach((term) => {
      if (this.state.expertMode[selectedExpertMode].toLowerCase().indexOf(term) > -1) hasExcludeTerm = true
    })

    const expertModeTypes = this.props.expertModeTypes
    expertModeTypes[selectedExpertMode].isQueryValid = this.state.expertMode[selectedExpertMode].toLowerCase().indexOf('select') > -1 && !hasExcludeTerm
    this.props.setExpertModeTypes(JSON.parse(JSON.stringify(expertModeTypes)))
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
  scopeContextKeys: state.analysisMode.scopeContextKeys,
  expertMode: state.analysisMode.expertMode
})

const mapDispatchToProps = (dispatch) => ({
  setSelectedExpertMode: (selectedExpertMode) => dispatch(AnalysisActions.setSelectedExpertMode(selectedExpertMode)),
  getOptimizationBody: (optimizationInputs, activeSelectionModeId, locationLayers, plan) => dispatch(ToolBarActions.getOptimizationBody(optimizationInputs, activeSelectionModeId, locationLayers, plan)),
  getExpertModeScopeContext: (plan) => dispatch(AnalysisActions.getExpertModeScopeContext(plan)),
  setExpertMode: (expertMode) => dispatch(AnalysisActions.setExpertMode(expertMode)),
  setExpertModeTypes: (expertModeTypes) => dispatch(AnalysisActions.setExpertModeTypes(expertModeTypes))
})

const AnalysisExpertModeComponent = connect(mapStateToProps, mapDispatchToProps)(AnalysisExpertMode)
export default AnalysisExpertModeComponent