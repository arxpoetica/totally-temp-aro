import React, { Component } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import { Collapse, Card, CardHeader, CardBody } from 'reactstrap'
import '../sidebar.css'
import ReportsActions from '../../optimization/reports/reports-actions'
import NetworkOptimizationActions from '../../optimization/network-optimization/network-optimization-actions'
import NetworkAnalysisTypes from '../..//optimization/network-optimization/network-analysis-types'
import CoverageButton from '../../coverage/coverage-button.jsx'
import NetworkOptimizationInput from '../../optimization/network-optimization/network-optimization-input.jsx'
import CoverageInitializer from '../../coverage/coverage-initializer.jsx'
import RfpAnalyzer from '../../optimization/rfp/rfp-analyzer.jsx'
import RfpButton from '../../optimization/rfp/rfp-button.jsx'
import NetworkAnalysisOutput from '../../optimization/network-analysis/network-analysis-output.jsx'
import ReportsDownloadModal from '../../optimization/reports/reports-download-modal.jsx'
import NetWorkBuildOutput from './network-build/network-build-output.jsx'
import ExpertMode from './expert-mode/expert-mode.jsx'
import ExpertModeButton from './expert-mode/expert-mode-button.jsx'
import CoverageReportDownloader from './coverage/coverage-report-downloader.jsx'
import AnalysisErrors from './analysis-errors.jsx'
export class AnalysisMode extends Component {
  constructor (props) {
    super(props)

    this.analysisModePanels = Object.freeze({
      INPUT: 'INPUT',
      OUTPUT: 'OUTPUT'
    })

    this.state = {
      collapseCards: this.analysisModePanels.INPUT,
      networkAnalysisTypes: NetworkAnalysisTypes,
      localAnalysisType: ''
    }

    this.reportTypes = ['RFP']
  }

  componentDidMount () {
    let initAnalysisType = this.state.networkAnalysisTypes[0]
    this.state.networkAnalysisTypes.forEach(analysisType => {
      if (analysisType.id === this.props.networkAnalysisType) initAnalysisType = analysisType
    })
    this.setState({ localAnalysisType: initAnalysisType })
  }

  render () {

    const { collapseCards, networkAnalysisTypes, localAnalysisType } = this.state
    const { networkAnalysisType, coverageReport } = this.props

    return (
      <div className="analysis-mode-container">
        <h4 style={{textAlign: 'center', marginTop: '20px'}}>Analysis Type: {localAnalysisType.label}</h4>

        {/* INPUT Accordion */}
        <Card className={`card-collapse ${collapseCards === this.analysisModePanels.INPUT ? 'collapse-show' : ''}`}>
          <CardHeader data-event={this.analysisModePanels.INPUT} onClick={(event) => this.toggleCards(event)}
            className={`card-header-dark ${collapseCards === this.analysisModePanels.INPUT ? 'card-fixed' : ''}`}
          >
            Input
          </CardHeader>
          <Collapse isOpen={collapseCards === this.analysisModePanels.INPUT}>
            <CardBody style={{padding:'0px'}}>

              <div className="col-xs-7" style={{left: '20', border: '10px solid white'}}>
                {/* pull this out */}
                {this.areControlsEnabled() &&
                  <select className="form-control" onChange={(event) => this.onAnalysisTypeChange(event)} value={localAnalysisType.id}>
                    {networkAnalysisTypes.map((item, index) =>
                      <option key={index} value={item.id} label={item.label}></option>
                    )}
                  </select>
                }
                {!this.areControlsEnabled() &&
                  <h4 style={{textAlign: 'center'}}>{localAnalysisType.label}</h4>
                }
              </div>

              {/* Will Render based on Switch case */}
              <div>
                {this.renderNetworkAnalysisTypes(networkAnalysisType)}
              </div>

              <div>
                {(networkAnalysisType === 'NETWORK_PLAN' || networkAnalysisType === 'NETWORK_ANALYSIS') &&
                  <div>
                    <NetworkOptimizationInput
                      networkAnalysisTypeId={networkAnalysisType}
                    />
                  </div>
                }
                {networkAnalysisType === 'COVERAGE_ANALYSIS' &&
                  <div style={{height: '100%'}}>
                    <CoverageInitializer />
                  </div>
                }
                {networkAnalysisType === 'RFP' &&
                  <div style={{height: '100%'}}>
                    <RfpAnalyzer />
                  </div>
                }
                {networkAnalysisType === 'EXPERT_MODE' &&
                  <div style={{height: '100%'}}>
                    <ExpertMode />
                  </div>
                }
              </div>
            </CardBody>
          </Collapse>
        </Card>

        {/* OUTPUT Accordion */}
        <Card className={`card-collapse ${collapseCards === this.analysisModePanels.OUTPUT ? 'collapse-show' : ''}`}>
          <CardHeader data-event={this.analysisModePanels.OUTPUT} onClick={(event) => this.toggleCards(event)}
            className={`card-header-dark ${collapseCards === this.analysisModePanels.OUTPUT ? 'card-fixed' : ''}`}
          >
            Output
          </CardHeader>
          <Collapse isOpen={collapseCards === this.analysisModePanels.OUTPUT}>
            {collapseCards === this.analysisModePanels.OUTPUT &&
              <CardBody style={{padding:'0px'}}>
                <AnalysisErrors />
                {networkAnalysisType === 'NETWORK_PLAN' &&
                  <div style={{height: '100%'}}>
                    <NetWorkBuildOutput />
                  </div>
                }
                {networkAnalysisType === 'NETWORK_ANALYSIS' &&
                  <div style={{height: '100%'}}>
                    <NetworkAnalysisOutput />
                  </div>
                }
                {networkAnalysisType === 'COVERAGE_ANALYSIS' && coverageReport &&
                  <div style={{height: '100%'}}>
                    <CoverageReportDownloader />
                  </div>
                }
                {networkAnalysisType === 'RFP' &&
                  <div style={{height: '100%'}}>
                    <button className="btn btn-primary pull-left" onClick={() => this.props.showReportModal()}>Reports</button>
                    <ReportsDownloadModal reportTypes={this.reportTypes} title='RFP Reports' />
                  </div>
                }
              </CardBody>
            }
          </Collapse>
        </Card>
      </div>
    )
  }

  renderNetworkAnalysisTypes (networkAnalysisType) {
    switch (networkAnalysisType) {
      case 'COVERAGE_ANALYSIS':
        return <CoverageButton />
      case 'RFP':
        return <RfpButton />
      case 'EXPERT_MODE':
        return <ExpertModeButton />
      default:
        return ''
    }
  }

  onAnalysisTypeChange (event) {
    const localAnalysisTypeId = event.target.value
    this.state.networkAnalysisTypes.forEach(analysisType => {
      if (analysisType.id === localAnalysisTypeId) this.setState({ localAnalysisType: analysisType })
    })
    this.props.setNetworkAnalysisType(localAnalysisTypeId)
  }

  toggleCards (eventArg) {
    const event = eventArg.target.dataset.event
    this.setState({ collapseCards: this.state.collapseCards === event ? this.analysisModePanels.INPUT : event })
  }

  // ToDo: this is also in network-optimization-input.jsx
  areControlsEnabled () {
    return (this.props.currentPlanState === this.props.planStateCons.START_STATE) ||
           (this.props.currentPlanState === this.props.planStateCons.INITIALIZED)
  }
}

const mapStateToProps = (state) => ({
  coverageReport: state.coverage.report,
  networkAnalysisType: state.optimization.networkOptimization.optimizationInputs.analysis_type,
  currentPlanState: state.plan.activePlan.planState,
  planStateCons: state.roicReports.planStateCons,
})

const mapDispatchToProps = (dispatch) => ({
  showReportModal: () => dispatch(ReportsActions.showOrHideReportModal(true)),
  setNetworkAnalysisType: (networkAnalysisType) => dispatch(
    NetworkOptimizationActions.setNetworkAnalysisType(networkAnalysisType)
  ),
})

const AnalysisModeComponent = wrapComponentWithProvider(reduxStore, AnalysisMode, mapStateToProps, mapDispatchToProps)
export default AnalysisModeComponent
