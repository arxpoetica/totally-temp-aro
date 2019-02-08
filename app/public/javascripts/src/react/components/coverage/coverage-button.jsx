import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import CoverageActions from '../coverage/coverage-actions'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import CoverageStatusTypes from './constants'

class CoverageButton extends Component {
  render() {
    return <div style={{ height: '35px' }}>
      {(this.props.status === CoverageStatusTypes.RUNNING) ? this.renderProgressbarState() : this.renderButtonState()}
    </div>
  }

  // The component when it is to be shown as a button (e.g. Modify, Run, etc)
  renderButtonState() {
    var buttonClasses = 'btn btn-block', buttonText = 'Undefined', buttonDisabled = false
    if (this.props.isCoverageFinished) {
      buttonText = 'Modify'
    } else if (true) {
      buttonText = 'Run'
      buttonClasses += ' btn-primary'
    } else {
      buttonText = 'Run'
      buttonClasses += ' btn-light'
      buttonDisabled = true
    }
    return <button className={buttonClasses} disabled={buttonDisabled} onClick={() => this.props.initializeCoverageReport()}>
      <i className="fa fa-bolt"></i> {buttonText}
    </button>
  }

  // The component when it is to be shown as a progress bar
  renderProgressbarState() {
    return <div className={'progress'} style={{ height: '100%' }}>
      <div className={'progress-bar progress-bar-optimization'} role="progressbar" aria-valuenow={this.props.progress}
        aria-valuemin='0' aria-valuemax='1' style={{lineHeight: '34px', width: (this.props.progress * 100) + '%' }}>
      </div>
      {/* A div overlaid on top of the progress bar, so we can always see the text. Lot of custom css!
      <div style={{ position: 'relative', top: '-28px', backgroundColor: 'rgba(0, 0, 0, 0.4)', color: 'white', 
                    width: '120px', textAlign: 'center', borderRadius: '3px',  margin: 'auto', fontWeight: 'bold' }}>
        {this.props.progress * 100 + '%'}
      </div> */}
    </div>
  }
}

CoverageButton.propTypes = {
  status: PropTypes.string,
  progress: PropTypes.number
}

const mapStateToProps = (state) => {
  return {
    status: state.coverage.status,
    progress: state.coverage.progress
  }
}

const mapDispatchToProps = (dispatch) => ({
  initializeCoverageReport: () => { dispatch(CoverageActions.updateCoverageStatus()) }
})

const CoverageInitializerComponent = wrapComponentWithProvider(reduxStore, CoverageButton, mapStateToProps, mapDispatchToProps)
export default CoverageInitializerComponent
