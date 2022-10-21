import React, { Component } from 'react'
import { connect } from 'react-redux'
import { TextInput, Select, Button } from '@mantine/core'
import RfpStatusActions from '../status/actions'
import RfpFileImporterUtils from '../rfp-file-importer-utils'

export class RfpSubmitter extends Component {
  constructor (props) {
    super(props)
    this.fileInput = React.createRef()
    this.state = {
      newRfpPlanName: 'New RFP Plan'
    }
  }

  render () {
    return <div>
      {/* Render inputs for new RFP (or a spinner if we have already submitted a RFP) */}
      {
        this.props.isSubmittingRfp
          ? this.renderSubmittingSpinner()
          : this.renderNewRfpInputs()
      }
      {/* Render the result of a RFP submission */}
      { this.renderSubmitResult() }
    </div>
  }

  renderSubmittingSpinner () {
    return <div className='row p-5 text-center' style={{ height: '300px', width: '100%' }}>
      <div style={{ width: '100%' }}>
        <div className='fa fa-5x fa-spin fa-spinner mb-4' />
        <h4>Submitting RFP...</h4>
      </div>
    </div>
  }

  renderNewRfpInputs () {
    return <div>
      <div className="row p-2">
        <div className="col-md-4">
          RFP plan name
        </div>
        <div className="col-md-8">
          <TextInput
            value={this.state.newRfpPlanName}
            placeholder="Type a plan name..."
            onChange={event => this.setState({ newRfpPlanName: event.currentTarget.value })}
          />
        </div>
      </div>
      <div className="row p-2">
        <div className="col-md-4">
          RFP Template
        </div>
        <div className="col-md-8">
          <Select
            value={this.props.selectedTemplateId || ''}
            data={this.props.templates.map(template => {
              return { value: template.id, label: template.name }
            })}
            onChange={value => this.props.setSelectedTemplateId(+value)}
          />
        </div>
      </div>

      <div className="row p-2">
        <div className="col-md-4">
          RFP Type
        </div>
        <div className="col-md-8">
            <Select
              label=""
              value={'ad-hoc'}
              data={[
                { value: 'ad-hoc', label: 'Ad Hoc' },
                { value: 'service-area', label: 'Service Area' },
              ]}
              onChange={value => console.log(value)}
            />
        </div>
      </div>

      <div className="row p-2">
        <div className="col-md-4">
          Network Type
        </div>
        <div className="col-md-8">
            <Select
              label=""
              value={'P2P'}
              data={[
                { value: 'P2P', label: 'Point-to-Point' },
                { value: 'full-network', label: 'Full Network' },
              ]}
              onChange={value => console.log(value)}
            />
        </div>
      </div>

      <div className="row p-2">
        <div className="col-md-4">
          CSV with locations
        </div>
        <div className="col-md-8">
          <input
            className='form-control-file'
            type='file'
            ref={this.fileInput}
          />
        </div>
      </div>
      <div className="row p-2">
        <div className="col-md-12">
          <Button onClick={() => this.submitRfp()}>
            Submit RFP
          </Button>
        </div>
      </div>
    </div>
  }

  renderSubmitResult () {
    if (!this.props.submitResult) {
      return null
    }
    const alertClass = 'alert' + ((this.props.submitResult.type === 'success') ? ' alert-success' : ' alert-danger')
    return <div className="row p-2">
      <div className="col-md-12">
        <div className={alertClass}>
          {this.props.submitResult.message}
        </div>
      </div>
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
        requestBody.rfpId = this.state.newRfpPlanName
        requestBody.targets = targets.map(target => {
          const { id, lat, lng, props } = target
          return {
            id: id,
            point: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            props
          }
        })
        this.props.submitRfpReport(this.props.userId, requestBody)
      })
      .catch(err => console.error(err))
  }
}

const mapStateToProps = state => ({
  isSubmittingRfp: state.optimization.rfp.isSubmittingRfp,
  submitResult: state.optimization.rfp.submitResult,
  selectedTemplateId: state.optimization.rfp.selectedTemplateId,
  templates: state.optimization.rfp.templates,
  userId: state.user.loggedInUser.id
})

const mapDispatchToProps = dispatch => ({
  submitRfpReport: (userId, requestBody) => dispatch(RfpStatusActions.submitRfpReport(userId, requestBody)),
  setSelectedTemplateId: selectedTemplateId => dispatch(RfpStatusActions.setSelectedTemplateId(selectedTemplateId)),
  loadRfpTemplates: () => dispatch(RfpStatusActions.loadRfpTemplates())
})

const RfpSubmitterComponent = connect(mapStateToProps, mapDispatchToProps)(RfpSubmitter)
export default RfpSubmitterComponent
