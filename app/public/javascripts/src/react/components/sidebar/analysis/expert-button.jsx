import React, { Component } from 'react'
import { connect } from 'react-redux'
import NetworkOptimizationActions from '../../optimization/network-optimization/network-optimization-actions'

export class expertButton extends Component {
  constructor (props) {
    super(props)

    this.state = {
    }
  }

  render () {

    const {networkAnalysisType, selectedExpertMode, expertModeTypes} = this.props

    console.log(expertModeTypes[selectedExpertMode])

    return (
      <div>
        {networkAnalysisType === 'EXPERT_MODE' && selectedExpertMode === expertModeTypes['OPTIMIZATION_SETTINGS'].id &&
          <button className="btn btn-block btn-primary" onClick={(e)=>this.saveExpertMode(e)} >
            <i className="fa fa-save"></i> Save
          </button>
        }

        {networkAnalysisType === 'EXPERT_MODE' && selectedExpertMode !== expertModeTypes['OPTIMIZATION_SETTINGS'].id &&
          <button
            className={`btn btn-block ${!expertModeTypes[selectedExpertMode].isQueryValid ? 'btn-default' : 'btn-primary'}`}
            disabled={!expertModeTypes[selectedExpertMode].isQueryValid}
          >
            <i className="fa fa-save"></i> Execute
          </button>
        }

        <div style={{width: '100%', paddingBottom: '20px'}}></div>
      </div>
    )
  }

  saveExpertMode () {
    this.props.setOptimizationInputs(JSON.parse(this.props.expertMode.OPTIMIZATION_SETTINGS))
  }
}

const mapStateToProps = (state) => ({
  networkAnalysisType: state.optimization.networkOptimization.optimizationInputs.analysis_type,
  expertMode: state.analysisMode.expertMode,
  selectedExpertMode: state.analysisMode.selectedExpertMode,
  expertModeTypes: state.analysisMode.expertModeTypes
})  

const mapDispatchToProps = (dispatch) => ({
  setOptimizationInputs: inputs => dispatch(NetworkOptimizationActions.setOptimizationInputs(inputs))
})

const expertButtonComponent = connect(mapStateToProps, mapDispatchToProps)(expertButton)
export default expertButtonComponent