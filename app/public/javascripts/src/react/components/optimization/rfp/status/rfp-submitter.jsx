import React, { Component } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import RfpActions from '../rfp-actions'
import RfpFileImporterUtils from '../rfp-file-importer-utils'

export class RfpSubmitter extends Component {
  constructor (props) {
    super(props)
    this.fileInput = React.createRef()
  }

  render () {
    return <div>
      <div className='row'>
        <div className='col-md-4'>
          RFP Template
        </div>
        <div className='col-md-8'>
          <select
            className='form-control'
            value={this.props.selectedTemplateId || ''}
            onChange={event => this.props.setSelectedTemplateId(event.target.value)}
          >
            {this.props.templates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}
          </select>
        </div>
      </div>
      <div className='row'>
        <div className='col-md-4'>
          CSV with locations
        </div>
        <div className='col-md-8'>
          <input
            className='form-control-file'
            type='file'
            ref={this.fileInput}
          />
        </div>
      </div>
      <div className='row'>
        <div className='col-md-12'>
          <button
            className='btn btn-primary'
            onClick={() => this.submitRfp()}
          >
            Submit RFP
          </button>
        </div>
      </div>
      <div className='row'>
        <div className='col-md-12'>
          { this.renderSubmitResult() }
        </div>
      </div>
    </div>
  }

  renderSubmitResult () {
    if (!this.props.submitResult) {
      return null
    }
    const alertClass = 'alert' + ((this.props.submitResult.type === 'success') ? ' alert-success' : ' alert-danger')
    return <div className={alertClass}>
      {this.props.submitResult.message}
    </div>
  }

  componentDidMount () {
    this.props.loadRfpTemplates()
  }

  submitRfp () {
    const selectedTemplate = this.props.templates.filter(template => template.id === this.props.selectedTemplateId)[0]
    RfpFileImporterUtils.loadPointsFromFile(this.fileInput.current.files[0])
      .then(targets => {
        var requestBody = JSON.parse(JSON.stringify(selectedTemplate.value))
        requestBody.rfpId = Math.random().toString()
        requestBody.targets = targets.map(target => ({
          id: target.id,
          point: {
            type: 'Point',
            coordinates: [target.lng, target.lat]
          }
        }))
        this.props.submitRfpReport(this.props.userId, requestBody)
      })
      .catch(err => console.error(err))
  }
}

RfpSubmitter.propTypes = {
  submitResult: PropTypes.shape({
    type: PropTypes.string,
    message: PropTypes.string
  }),
  selectedTemplateId: PropTypes.number,
  templates: PropTypes.array,
  userId: PropTypes.number
}

const mapStateToProps = state => ({
  submitResult: state.optimization.rfp.submitResult,
  selectedTemplateId: state.optimization.rfp.selectedTemplateId,
  templates: state.optimization.rfp.templates,
  userId: state.user.loggedInUser.id
})

const mapDispatchToProps = dispatch => ({
  submitRfpReport: (userId, requestBody) => dispatch(RfpActions.submitRfpReport(userId, requestBody)),
  setSelectedTemplateId: selectedTemplateId => dispatch(RfpActions.setSelectedTemplateId(selectedTemplateId)),
  loadRfpTemplates: () => dispatch(RfpActions.loadRfpTemplates())
})

const RfpSubmitterComponent = connect(mapStateToProps, mapDispatchToProps)(RfpSubmitter)
export default RfpSubmitterComponent
