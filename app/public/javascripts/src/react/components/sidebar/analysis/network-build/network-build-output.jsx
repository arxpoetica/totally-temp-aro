import React, { Component } from 'react'
import reduxStore from '../../../../../redux-store'
import wrapComponentWithProvider from '../../../../common/provider-wrapped-component'
import ReportsDownloadModal from '../../../optimization/reports/reports-download-modal.jsx'
import ReportsActions from '../../../optimization/reports/reports-actions'
import CommonRoicReports from '../roic-reports/common-roic-reports.jsx'

export class NetWorkBuildOutput extends Component {
  constructor (props) {
    super(props)

    this.state = {
      reportTypes: [],
      reportSize: ''
    }
  }

  componentDidMount () {
    this.setState({ reportTypes: this.props.reportTypes || ['GENERAL', 'PARAM_QUERY'], reportSize: 'small' })
  }

  render () {

    const {reportTypes, reportSize} = this.state;
    const {planId, planState} = this.props;

    return (
      <div>
        {/* <!-- The ROIC Reports component--> */}
        <div style={{position: 'relative', width: '100%'}}>
          <CommonRoicReports 
            planId={planId}
            rOptimizationState={planState}
            reportSize={reportSize}
          />
        </div>
        
        <button className="btn btn-primary pull-left mr-1" onClick={(e)=>this.props.showReportModal()}>Reports</button>
        <button className="btn btn-primary pull-right" onClick={(e)=>this.props.showDetailedOutput()}>Expand Results</button>

        {/* Render Reports Modal */}
        <ReportsDownloadModal reportTypes={reportTypes} title='Reports'/>
      </div>
    )
  }

  // To open Expand Results Modal
  showDetailedOutput () {
  }
}

const mapStateToProps = (state) => ({
  planId: state.plan.activePlan.id,
  planState: state.plan.activePlan.planState
})  

const mapDispatchToProps = (dispatch) => ({
  showReportModal: () => dispatch(ReportsActions.showOrHideReportModal(true))
})

const NetWorkBuildOutputComponent = wrapComponentWithProvider(reduxStore, NetWorkBuildOutput, mapStateToProps, mapDispatchToProps)
export default NetWorkBuildOutputComponent