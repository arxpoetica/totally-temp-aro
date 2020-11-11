import React, { Component } from 'react'
import reduxStore from '../../../../../redux-store'
import wrapComponentWithProvider from '../../../../common/provider-wrapped-component'
import AnalysisActions from '../analysis-actions'
import RoicReports from './roic-reports.jsx'

export class CommonRoicReports extends Component {
  constructor (props) {
    super(props)

    this.state = {
    }
  }

  componentWillReceiveProps(prevProps){

    if(JSON.stringify(this.props) !== JSON.stringify(prevProps)){
      if (prevProps.planId ||
        (prevProps.rOptimizationState &&
          (prevProps.rOptimizationState === 'COMPLETED' ||
            prevProps.rOptimizationState === 'FINISHED'))) {
              this.refreshData(this.props.planId)
      } 
    }
  }

  render() {
    return(
      <RoicReports
        reportSize={this.props.reportSize}
        roicResultsData={this.props.roicResultsData}
      />
    )
  }

  refreshData (planId) {
    if (!planId) {
      console.error('Plan ID not available')
      return
    }
    this.props.loadROICResultsForPlan(planId)
  }

}

const mapStateToProps = (state) => ({
  roicResultsData: state.analysisMode.roicResultsData
})  

const mapDispatchToProps = (dispatch) => ({
  loadROICResultsForPlan: (planId) => dispatch(AnalysisActions.loadROICResultsForPlan(planId))
})

const CommonRoicReportsComponent = wrapComponentWithProvider(reduxStore, CommonRoicReports, mapStateToProps, mapDispatchToProps)
export default CommonRoicReportsComponent