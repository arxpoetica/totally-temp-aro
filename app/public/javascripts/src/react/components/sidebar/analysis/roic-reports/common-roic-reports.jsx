import React, { Component } from 'react'
import { connect } from 'react-redux'
import RoicReports from './roic-reports.jsx'
import RoicReportsActions from './roic-reports-actions'

export class CommonRoicReports extends Component {

  componentDidUpdate (prevProps) {
    if (JSON.stringify(this.props) !== JSON.stringify(prevProps)) {
      if (prevProps.planId ||
        (prevProps.rOptimizationState &&
          (prevProps.rOptimizationState === 'COMPLETED' || prevProps.rOptimizationState === 'FINISHED')
        )
      ) {
        setTimeout(() => this.refreshData(), 0)
      }
    }
  }

  render () {
    return (
      // Render Components based on reportSize
      <RoicReports reportSize={this.props.reportSize} planId={this.props.planId} />
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

const mapDispatchToProps = (dispatch) => ({
  loadROICResultsForPlan: (planId) => dispatch(RoicReportsActions.loadROICResultsForPlan(planId)),
})

const CommonRoicReportsComponent = connect(null, mapDispatchToProps)(CommonRoicReports)
export default CommonRoicReportsComponent
