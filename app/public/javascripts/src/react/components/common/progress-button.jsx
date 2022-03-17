import React, { Component } from 'react'
import { PropTypes } from 'prop-types'

export default class ProgressButton extends Component {
  // ToDo: abstract and combine with Coverage Button and RFP Button
  constructor (props) {
    super(props)

    // can be overridden
    this.statusTypes = {
      UNINITIALIZED: 'UNINITIALIZED',
      RUNNING: 'RUNNING',
      FINISHED: 'FINISHED',
    }
  }

  onRun () {} // to be overridden
  onModify () {} // to be overridden
  onCancel () {} // to be overridden

  render () {
    switch (this.props.status) {
      case this.statusTypes.UNINITIALIZED:
        return this.renderUninitializedButton()
      case this.statusTypes.RUNNING:
        return this.renderCancelButton()
      case this.statusTypes.CANCELED:
      case this.statusTypes.FINISHED:
      case this.statusTypes.FAILED:
        return this.renderFinishedButton()

      default:
        return this.renderUninitializedButton()
    }
  }

  renderCancelButton () {
    return (
      <button className='btn btn-danger'
        style={{ width: "100%", marginBottom: "10px" }}
        onClick={() => this.onCancel()}
        disabled={this.props.isCanceling}
      >
      {this.props.isCanceling ? 'Canceling' : 'Cancel'}
    </button>
    )
  }

  renderUninitializedButton () {
    return (
      <button
        className="btn btn-block btn-primary"
        style={{ marginBottom: '10px' }}
        onClick={() => this.onRun()}
      >
        <i className='fa fa-bolt'/> Run
      </button>
    )
  }

  renderProgressbar () {
    return (

      <div style={{ height: '34px', width: '100%', display: 'flex', position: 'relative', marginBottom: '10px' }}>
        <div style={{ flex: '1 1 auto' }}>
          <div className={'progress'} style={{ height: '100%' }}>
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
        </div>
        <button className='btn btn-danger'
          style={{ flex: '0 0 auto' }}
          onClick={() => this.onCancel()}
          disabled={this.props.isCanceling}
        >
          {this.props.isCanceling ? 'Canceling' : 'Cancel'}
        </button>
      </div>
    )
  }

  renderFinishedButton () {
    return (
      <>
        {
          this.props.status === this.statusTypes.FAILED
          && <div>ERROR: Unknown coverage status - {this.props.status}</div>
        }
        {this.props.isEphemeral
          ? <button className={'btn btn-block modify-coverage-button'} style={{ marginBottom: '10px' }}
              onClick={() => this.props.setPlanInputsModal(true)}>
              <i className="far fa-save"/> Save plan as...
            </button>
          : <button className={'btn btn-block modify-coverage-button'} style={{ marginBottom: '10px' }}
              onClick={() => this.onModify()}>
              <i className="fa fa-edit"/> Modify
            </button>
        }
      </>
    )
  }
}

// --- //

ProgressButton.propTypes = {
  status: PropTypes.string,
  progress: PropTypes.number
}
