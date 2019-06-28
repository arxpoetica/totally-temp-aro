/* globals FileReader */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import RfpStatusActions from './actions'

export class RfpTemplateManager extends Component {
  constructor (props) {
    super(props)
    this.fileInput = React.createRef()
    this.state = {
      newTemplateName: 'New Template'
    }
  }

  render () {
    return <div>
      {this.renderExistingTemplates()}
      <hr />
      <h4>Upload new template</h4>
      <div className='row'>
        <div className='col-md-4'>
          Template name
        </div>
        <div className='col-md-8'>
          <input
            className='form-control'
            value={this.state.newTemplateName}
            onChange={event => this.setState({ newTemplateName: event.target.value })} />
        </div>
      </div>
      <div className='row'>
        <div className='col-md-4'>
          Select JSON file to upload
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
            onClick={event => this.uploadTemplate()}>
            <i className='fa fa-upload' /> Upload
          </button>
        </div>
      </div>
    </div>
  }

  renderExistingTemplates () {
    return <div>
      <h4>Existing templates</h4>
      <table className='table table-striped'>
        <thead>
          <tr>
            <th>Name</th>
            <th>Value</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {this.props.templates.map(template => (
            <tr key={template.id}>
              <td>{template.name}</td>
              <td>
                <pre>
                  {JSON.stringify(template.value, null, 2)}
                </pre>
              </td>
              <td>
                <button className='btn btn-danger' onClick={event => this.props.deleteRfpTemplate(template.id)}>
                  <i className='fa fa-trash-alt' /> Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  }

  uploadTemplate () {
    const templateFile = this.fileInput.current.files[0]
    const self = this
    var reader = new FileReader()
    reader.onload = function (e) {
      const template = e.target.result
      self.props.addRfpTemplate(self.state.newTemplateName, template)
    }
    reader.readAsText(templateFile)
  }

  componentDidMount () {
    this.props.loadRfpTemplates()
  }
}

RfpTemplateManager.propTypes = {
  templates: PropTypes.array
}

const mapStateToProps = state => ({
  templates: state.optimization.rfp.templates
})

const mapDispatchToProps = dispatch => ({
  addRfpTemplate: (name, template) => dispatch(RfpStatusActions.addRfpTemplate(name, template)),
  deleteRfpTemplate: templateId => dispatch(RfpStatusActions.deleteRfpTemplate(templateId)),
  loadRfpTemplates: () => dispatch(RfpStatusActions.loadRfpTemplates())
})

const RfpTemplateManagerComponent = connect(mapStateToProps, mapDispatchToProps)(RfpTemplateManager)
export default RfpTemplateManagerComponent
