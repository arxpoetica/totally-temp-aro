import React, { Component } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import { Collapse, Card, CardHeader, CardBody } from 'reactstrap';
import './analysis-mode.css'
import ReportsActions from '../../optimization/reports/reports-actions'
import NetworkOptimizationActions from '../../optimization/network-optimization/network-optimization-actions'
import NetworkAnalysisTypes from '../..//optimization/network-optimization/network-analysis-types'
import ReactConstants from '../../../common/constants' // ToDo: merge constants, put in Redux?
import CoverageButton from '../../coverage/coverage-button.jsx'
import NetworkOptimizationInput from '../../optimization/network-optimization/network-optimization-input.jsx'
import CoverageInitializer from '../../coverage/coverage-initializer.jsx'
import RfpAnalyzer from '../../optimization/rfp/rfp-analyzer.jsx'
import RfpButton from '../../optimization/rfp/rfp-button.jsx'
import NetworkAnalysisOutput from '../../optimization/network-analysis/network-analysis-output.jsx'
import ReportsDownloadModal from '../../optimization/reports/reports-download-modal.jsx'
import NetWorkBuildOutput from './network-build/network-build-output.jsx'
import AnalysisActions from './analysis-actions'
import AnalysisExpertMode from './analysis-expert-mode.jsx'
import ExpertButton from './expert-button.jsx'
import CoverageReportDownloader from  './coverage/coverage-report-downloader.jsx'

export class AnalysisMode extends Component {
  constructor (props) {
    super(props)

    this.analysisModePanels = Object.freeze({
      INPUT: 'INPUT',
      OUTPUT: 'OUTPUT'
    })

    this.state = {
      collapseCards: this.analysisModePanels.INPUT,
      NetworkAnalysisTypes: NetworkAnalysisTypes,
      localAnalysisType: ''
    }

    this.reportTypes = ['RFP']
    this.handleModifyClicked = this.handleModifyClicked.bind(this)
  }

  componentDidMount () {
    var initAnalysisType = this.state.NetworkAnalysisTypes[0]
    this.state.NetworkAnalysisTypes.forEach(analysisType => {
      if (analysisType.id === this.props.networkAnalysisType) initAnalysisType = analysisType
    })
    this.setState({localAnalysisType: initAnalysisType});
  }

  render () {

    const {collapseCards, NetworkAnalysisTypes, localAnalysisType} = this.state;
    const {networkAnalysisType, coverageReport} = this.props;

    return (
      <div className="analysis-mode-container">
        <h4 style={{textAlign: 'center', marginTop: '20px'}}>Analysis Type: {networkAnalysisType}</h4>

        {/* INPUT Accordion */}
        <Card className={`card-collapse ${collapseCards === this.analysisModePanels.INPUT ? 'collapse-show' :''}`}>
          <CardHeader data-event={this.analysisModePanels.INPUT} onClick={(e)=>this.toggleCards(e)} 
            className={`card-header-dark ${collapseCards === this.analysisModePanels.INPUT ? 'card-fixed' :''}`}>
            Input
          </CardHeader>
          <Collapse isOpen={collapseCards === this.analysisModePanels.INPUT}>
            <CardBody style={{padding:'0px'}}>

              <div className="col-xs-7" style={{left: '20', border: '10px solid white'}}>
                {/* pull this out */}
                {this.areControlsEnabled() &&
                  <select className="form-control" onChange={(e)=>this.onAnalysisTypeChange(e)} value={localAnalysisType.id}>
                    {NetworkAnalysisTypes.map((item, index) =>
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
                {(networkAnalysisType  === 'NETWORK_PLAN' || networkAnalysisType === 'NETWORK_ANALYSIS') &&
                  <div>
                    <NetworkOptimizationInput onModify={this.handleModifyClicked} networkAnalysisTypeId={networkAnalysisType} />
                  </div>
                }               
                {networkAnalysisType  === 'EXPERT_MODE' &&
                  <div style={{height: '100%'}}>
                    <AnalysisExpertMode/>
                  </div>
                }
                {networkAnalysisType  === 'COVERAGE_ANALYSIS' &&
                  <div style={{height: '100%'}}>
                    <CoverageInitializer/>
                  </div>
                }
                {networkAnalysisType  === 'RFP' &&
                  <div style={{height: '100%'}}>
                    <RfpAnalyzer/>
                  </div>
                }
              </div>
            </CardBody>
          </Collapse>
        </Card>

        {/* OUTPUT Accordion */}
        <Card className={`card-collapse ${collapseCards === this.analysisModePanels.OUTPUT ? 'collapse-show' :''}`}>
          <CardHeader data-event={this.analysisModePanels.OUTPUT} onClick={(e)=>this.toggleCards(e)} 
            className={`card-header-dark ${collapseCards === this.analysisModePanels.OUTPUT ? 'card-fixed' :''}`}>
            Output
          </CardHeader>
          <Collapse isOpen={collapseCards === this.analysisModePanels.OUTPUT}>
            {collapseCards === this.analysisModePanels.OUTPUT &&
              <CardBody style={{padding:'0px'}}>
                {networkAnalysisType  === 'NETWORK_PLAN' &&
                  <div style={{height: '100%'}}>
                    <NetWorkBuildOutput/>
                  </div>
                }
                {networkAnalysisType  === 'NETWORK_ANALYSIS' &&
                  <div style={{height: '100%'}}>
                    <NetworkAnalysisOutput/>
                  </div>
                }
                {networkAnalysisType  === 'COVERAGE_ANALYSIS' && coverageReport &&
                  <div style={{height: '100%'}}>
                    <CoverageReportDownloader/>
                  </div>
                } 

                {networkAnalysisType  === 'RFP' &&
                  <div style={{height: '100%'}}>
                    <button className="btn btn-primary pull-left" onClick={(e)=>this.props.showReportModal(e)}>Reports</button>
                    <ReportsDownloadModal reportTypes={this.reportTypes} title='RFP Reports'/>
                  </div>
                }
              </CardBody>
            }
          </Collapse>
        </Card>          
      </div>
    )
  }

  renderNetworkAnalysisTypes (NetworkAnalysisTypes) {
    switch (NetworkAnalysisTypes) {
      case 'COVERAGE_ANALYSIS':
        return <CoverageButton/>
      case 'RFP':
        return <RfpButton/>
      case 'NETWORK_PLAN':
        return ''
      case 'NETWORK_ANALYSIS':
        return '' 
      case 'EXPERT_MODE':
        return <ExpertButton/>               
      default:
        return ''
    }
  }

  handleModifyClicked () {
    this.props.handleModifyClicked(this.props.activePlan);
  }

  onAnalysisTypeChange (e) {
    var localAnalysisTypeId = e.target.value
    this.state.NetworkAnalysisTypes.forEach(analysisType => {
      if (analysisType.id === localAnalysisTypeId) this.setState({localAnalysisType: analysisType});
    })
    this.props.setNetworkAnalysisType(localAnalysisTypeId)
  }

  toggleCards (e) {
    let event = e.target.dataset.event;
    this.setState({ collapseCards: this.state.collapseCards === event ? this.analysisModePanels.INPUT : event });
  }

  // ToDo: this is also in network-optimization-input.jsx
  areControlsEnabled () {
    return (this.props.planState === ReactConstants.PLAN_STATE.START_STATE) || (this.props.planState === ReactConstants.PLAN_STATE.INITIALIZED)
  }
}

const mapStateToProps = (state) => ({
  coverageReport: state.coverage.report,
  networkAnalysisType: state.optimization.networkOptimization.optimizationInputs.analysis_type,
  planState: state.plan.activePlan.planState,
  activePlan: state.plan.activePlan,
}) 

const mapDispatchToProps = (dispatch) => ({
  showReportModal: () => dispatch(ReportsActions.showOrHideReportModal(true)),
  setNetworkAnalysisType: (networkAnalysisType) => dispatch(NetworkOptimizationActions.setNetworkAnalysisType(networkAnalysisType)),
  handleModifyClicked: (activePlan) => dispatch(AnalysisActions.handleModifyClicked(activePlan)),
})

const AnalysisModeComponent = wrapComponentWithProvider(reduxStore, AnalysisMode, mapStateToProps, mapDispatchToProps)
export default AnalysisModeComponent