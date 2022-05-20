import React from 'react'
import { connect } from 'react-redux'
import { ProgressBar } from '../common/progress-bar.jsx'

const TopProgressBar = (props) => {
  let progress = 0
  switch (props.activePlan.planType) {
    case 'UNDEFINED':
      progress = props.analysisType === 'COVERAGE_ANALYSIS'
          ? props.coverageProgress
          : props.networkProgress
      break
    case 'RFP':
      progress = props.rfpProgress
      break
    case  'RING':
      progress = props.ringProgress
      break
    default:
      progress = props.networkProgress
      break
  }

  return <ProgressBar progress={progress}/>
}

const mapStateToProps = (state) => ({
    ringProgress: state.ringEdit.analysis.progress,
    rfpProgress: state.optimization.rfp.progress,
    networkProgress: state.ringEdit.analysis.progress,
    coverageProgress: state.coverage.progress,
    activePlan: state.plan.activePlan,
    analysisType: state.optimization.networkOptimization.optimizationInputs.analysis_type
})

export default connect(mapStateToProps, null)(TopProgressBar)
