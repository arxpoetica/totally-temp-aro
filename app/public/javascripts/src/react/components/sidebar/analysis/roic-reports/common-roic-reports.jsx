import React, { Component } from 'react'
import { connect } from 'react-redux'
import RoicReports from './roic-reports.jsx'
import AnalysisActions from '../analysis-actions'

export class CommonRoicReports extends Component {
  constructor (props) {
    super(props)

    this.state = {
    }
  }

  componentDidUpdate (prevProps){
    if(JSON.stringify(this.props) !== JSON.stringify(prevProps)){
      if (prevProps.planId || 
         (prevProps.rOptimizationState && (prevProps.rOptimizationState === 'COMPLETED' || prevProps.rOptimizationState === 'FINISHED'))) {
          setTimeout(() => this.refreshData(), 0)
      } 
    }
  }

  render () {

    return (
      // Render Components based on reportSize
      <RoicReports
        reportSize={this.props.reportSize}
      />
    )
  }

  refreshData () {
    if (!this.props.planId) {
      console.error('Plan ID not available')
      return
    }
    // Insted of props Drilling, roicResults is moved to redux
    this.props.loadROICResultsForPlan(this.props.planId)
  }
}

const mapStateToProps = (state) => ({
})  

const mapDispatchToProps = (dispatch) => ({
  loadROICResultsForPlan: (planId) => dispatch(AnalysisActions.loadROICResultsForPlan(planId))
})

const CommonRoicReportsComponent = connect(mapStateToProps, mapDispatchToProps)(CommonRoicReports)
export default CommonRoicReportsComponent