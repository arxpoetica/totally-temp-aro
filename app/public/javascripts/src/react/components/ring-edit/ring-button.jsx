import React, { Component } from 'react'
import ImmutablePropTypes from 'react-immutable-proptypes'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import RingActions from './ring-edit-actions.js'
import PlanActions from '../plan/plan-actions'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import socketManager from '../../../react/common/socket-manager'
import AroHttp from '../../common/aro-http'


export class RingButton extends Component {
  // ToDo: abstract and combine with Coverage Button and RFP Button
  constructor (props) {
    super(props)
    this.StatusTypes = Object.freeze({
      UNINITIALIZED: 'UNINITIALIZED',
      START_STATE: 'START_STATE',
      STARTED: 'STARTED',
      COMPLETED: 'COMPLETED'
    })

    this.unsubscriber = socketManager.subscribe('PROGRESS_MESSAGE_DATA', (progressData) => {
      if (progressData.data.processType === 'ring') {
        //this.props.setAnalysisStatus(progressData.data.optimizationState)
        this.props.setActivePlanState(progressData.data.optimizationState)
        this.props.setAnalysisProgress(progressData.data.progress)
      }
    })
    
  }

  render () {
    console.log(this.props)
    
    switch (this.props.status) {
      case this.StatusTypes.START_STATE: 
      case this.StatusTypes.UNINITIALIZED:
        return this.renderUninitializedButton()

      case this.StatusTypes.STARTED:
        return this.renderProgressbar()

      case this.StatusTypes.COMPLETED:
        return this.renderFinishedButton()

      default:
        return <div>ERROR: Unknown coverage status - {this.props.status}</div>
    }
  }

  renderUninitializedButton () {
    return (
      <button className={'btn btn-block btn-primary'} style={{ marginBottom: '10px' }}
        onClick={() => this.requestSubNet()}>
        <i className='fa fa-bolt' /> Run
      </button>
    )
  }

  renderProgressbar () {
    return <div className={'progress'} style={{ height: '34px', position: 'relative', marginBottom: '10px' }}>
      <div className={'progress-bar progress-bar-optimization'} role='progressbar' aria-valuenow={this.props.progress}
        aria-valuemin='0' aria-valuemax='1' style={{ lineHeight: '34px', width: (this.props.progress * 100) + '%' }} />
      <div style={{ position: 'absolute',
        top: '50%',
        left: '50%',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        color: 'white',
        transform: 'translateX(-50%) translateY(-50%)',
        width: '80px',
        textAlign: 'center',
        borderRadius: '3px',
        fontWeight: 'bold' }}>
        {Math.round(this.props.progress * 100) + '%'}
      </div>
    </div>
  }

  renderFinishedButton () {
    return (
      <button className={'btn btn-block modify-coverage-button'} style={{ marginBottom: '10px' }}
        onClick={() => this.props.onModify()}>
        <i className='fa fa-edit' /> Modify
      </button>
    )
  }
  
  requestSubNet(){
    console.log(this.props)
    //this.props.onModify()
    var ringIds = []
    for (var key in this.props.rings) {
      ringIds.push(''+this.props.rings[key].id)
    }
    const planId = this.props.planId
    const userId = this.props.userId
    var locationTypes = []
    this.props.mapLayers.location.forEach(item => {
      if (item.checked) locationTypes.push(item.plannerKey)
    });
    //this.props.calculateSubNet(ringIds, planId, userId)
    AroHttp.post(`/service/plan/${planId}/ring-cmd`, {ringIds: ringIds, locationTypes: locationTypes})
    .then(result => {
      //ToDo check for error
    }).catch(err => console.error(err))
  }

  componentWillUnmount () {
    this.unsubscriber()
  }

}

// --- //

RingButton.propTypes = {
  status: PropTypes.string,
  progress: PropTypes.number,
  userId: PropTypes.number,
  planId: PropTypes.number,
  projectId: PropTypes.number, 
  testProp: PropTypes.string
}

const mapStateToProps = (state) => {
  return {
    //status: state.ringEdit.analysis.status,
    status: state.plan.activePlan && state.plan.activePlan.planState, 
    progress: state.ringEdit.analysis.progress,
    userId: state.user.loggedInUser.id,
    planId: state.plan.activePlan && state.plan.activePlan.id,
    projectId: state.user.loggedInUser.projectId,
    rings: state.ringEdit.rings, 
    mapLayers: state.mapLayers
  }
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  /*
  modifyCoverageReport: (reportId) => dispatch(CoverageActions.modifyCoverageReport(reportId)),
  initializeCoverageReport: (userId, planId, projectId, activeSelectionMode, locationTypes, boundaryLayers, initializationParams) => {
    dispatch(CoverageActions.initializeCoverageReport(userId, planId, projectId, activeSelectionMode, locationTypes,
      boundaryLayers, initializationParams))
  },
  */
  //setAnalysisStatus: (status) => dispatch(RingActions.setAnalysisStatus(status)), 
  setActivePlanState: (status) => dispatch(PlanActions.setActivePlanState(status)), 
  setAnalysisProgress: (progress) => dispatch(RingActions.setAnalysisProgress(progress))
})

const RingButtonComponent = wrapComponentWithProvider(reduxStore, RingButton, mapStateToProps, mapDispatchToProps)
export default RingButtonComponent
