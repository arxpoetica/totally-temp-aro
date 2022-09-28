import React, { Component } from 'react'
import { connect } from 'react-redux'
import ReportsDownloadModal from '../../../optimization/reports/reports-download-modal.jsx'
import ReportsActions from '../../../optimization/reports/reports-actions'
import CommonRoicReports from '../roic-reports/common-roic-reports.jsx'
import RoicReportsActions from '../roic-reports/roic-reports-actions'
import RoicReportsmodal from '../roic-reports/roic-reports-modal.jsx'

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

    const { reportTypes, reportSize } = this.state
    const { planId, planState } = this.props

    return (
      <div>
        {/* <!-- The ROIC Reports component--> */}
        <div style={{position: 'relative', width: '100%'}}>
          <CommonRoicReports
            planId={planId}
            rOptimizationState={planState}
            reportSize={reportSize}
            key="output"
          />
        </div>

        <button
          type="button"
          className="btn btn-primary pull-left mr-1"
          onClick={() => this.props.showReportModal()}
        >
          Reports
        </button>
        <button
          type="button"
          className="btn btn-primary pull-right"
          onClick={() => this.props.showRoicReportsModal()}
        >
          Expand Results
        </button>

        {/* Render Reports Modal */}
        <ReportsDownloadModal reportTypes={reportTypes} title="Reports" />

        {/* To Render Expand Results Modal */}
        <RoicReportsmodal />
      </div>
    )
  }
}

const mapStateToProps = (state) => ({
  planId: state.plan.activePlan.id,
  planState: state.plan.activePlan.planState,
})

const mapDispatchToProps = (dispatch) => ({
  showReportModal: () => dispatch(ReportsActions.showOrHideReportModal(true)),
  showRoicReportsModal: () => dispatch(RoicReportsActions.setShowRoicReportsModal(true)),
})

const NetWorkBuildOutputComponent = connect(mapStateToProps, mapDispatchToProps)(NetWorkBuildOutput)
export default NetWorkBuildOutputComponent
