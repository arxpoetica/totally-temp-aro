import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../../redux-store'
import RfpActions from './rfp-actions'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import RfpStatusTypes from './constants'

export class RfpButton extends Component {
  render () {
    switch (this.props.status) {
      case RfpStatusTypes.UNINITIALIZED:
        return this.renderUninitializedButton()

      case RfpStatusTypes.RUNNING:
        return this.renderProgressbar()

      case RfpStatusTypes.FINISHED:
        return this.renderFinishedButton()

      default:
        return <div>ERROR: Unknown coverage status - {this.props.status}</div>
    }
  }

  renderUninitializedButton () {
    return (
      <button className={'btn btn-block btn-primary'} style={{ marginBottom: '10px' }}
        onClick={() => this.props.initializeRfpReport(this.props.targets)}>
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
        Running RFP
      </div>
    </div>
  }

  renderFinishedButton () {
    return (
      <button className={'btn btn-block modify-coverage-button'} style={{ marginBottom: '10px' }}
        onClick={() => this.props.modifyRfpReport()}>
        <i className='fa fa-edit' /> Modify
      </button>
    )
  }
}

RfpButton.propTypes = {
  status: PropTypes.string,
  targets: PropTypes.array
}

const mapStateToProps = (state) => {
  return {
    status: state.optimization.rfp.status,
    targets: state.optimization.rfp.targets
  }
}

const mapDispatchToProps = dispatch => ({
  modifyRfpReport: () => dispatch(RfpActions.modifyRfpReport()),
  initializeRfpReport: targets => dispatch(RfpActions.initializeRfpReport(targets))
})

const CoverageButtonComponent = wrapComponentWithProvider(reduxStore, RfpButton, mapStateToProps, mapDispatchToProps)
export default CoverageButtonComponent
