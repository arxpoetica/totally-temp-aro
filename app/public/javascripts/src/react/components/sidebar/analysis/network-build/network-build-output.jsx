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

  componentDidMount(){
    this.setState({ reportTypes: this.state.reportTypes || ['GENERAL', 'PARAM_QUERY'] })
    this.setState({reportSize: 'small'})
  }

  render () {
    return this.renderNetWorkBuildOutput()
  }

  renderNetWorkBuildOutput() {
    return(
      <div>
        {/* <!-- The ROIC Reports component--> */}
        <div style={{position: 'relative', width: '100%'}}>
          <CommonRoicReports 
            planId={this.props.planId}
            rOptimizationState={this.props.rOptimizationState}
            reportSize={this.state.reportSize}
          />
        </div>
        <button className="btn btn-primary pull-left mr-1" onClick={(e)=>this.props.showReportModal()}>Reports</button>
        <button className="btn btn-primary pull-right" onClick={(e)=>this.props.showDetailedOutput()}>Expand Results</button>
        <ReportsDownloadModal reportTypes={this.state.reportTypes} title='Reports'/>
      </div>
    )
  }

  showDetailedOutput () {
  }
}

const mapStateToProps = (state) => ({
  planId: state.plan.activePlan.id,
  rOptimizationState: state.plan.activePlan.planState
})  

const mapDispatchToProps = (dispatch) => ({
  showReportModal: () => dispatch(ReportsActions.showOrHideReportModal(true))
})

const NetWorkBuildOutputComponent = wrapComponentWithProvider(reduxStore, NetWorkBuildOutput, mapStateToProps, mapDispatchToProps)
export default NetWorkBuildOutputComponent