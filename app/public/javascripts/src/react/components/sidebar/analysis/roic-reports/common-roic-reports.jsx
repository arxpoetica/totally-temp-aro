import React, { Component } from 'react'
import { connect } from 'react-redux'
import RoicReports from './roic-reports.jsx'
import AroHttp from '../../../../common/aro-http'

export class CommonRoicReports extends Component {
  constructor (props) {
    super(props)

    this.state = {
      roicResultsData: null
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

    const {roicResultsData} = this.state;
    const {reportSize} = this.props;

    return (
      // Render Component based on reportSize
      <RoicReports
        reportSize={reportSize}
        roicResultsData={roicResultsData}
      />
    )
  }

  refreshData () {
    if (!this.props.planId) {
      console.error('Plan ID not available')
      return
    }
    this.loadROICResultsForPlan(this.props.planId)
  }

  loadROICResultsForPlan (planId) {
    AroHttp.get(`/service/report/plan/${planId}`)
      .then(result => {
        this.setState({roicResultsData: result.data})
      })
      .catch(err => console.error(err))
  }

}

const mapStateToProps = (state) => ({
})  

const mapDispatchToProps = (dispatch) => ({
})

const CommonRoicReportsComponent = connect(mapStateToProps, mapDispatchToProps)(CommonRoicReports)
export default CommonRoicReportsComponent