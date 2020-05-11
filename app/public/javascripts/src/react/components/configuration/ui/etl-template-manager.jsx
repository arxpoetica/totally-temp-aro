import React, { Component } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import ConfigurationActions from './ui-actions'
import EtlTemplates from '../../etl-templates/etl-templates.jsx'
import EtlTemplateActions from '../../etl-templates/etl-templates-actions'
export class EtlTemplateManager extends Component {
  constructor (props) {
    super(props)
    this.fileInput = React.createRef()
    this.state = {
      isValidFileSelected: false,
      dataTypeId: 1,
    }
    this.props.loadEtlTemplatesFromServer(1)
  }

  dataTypeChange(event) {
    this.props.loadEtlTemplatesFromServer(event.target.value)
    this.setState({dataTypeId: event.target.value})
        
  }
  render () {
    
    let dataTypeOptions = []
    this.props.dataTypes.forEach((item) => {
      dataTypeOptions.push(<option value={item.id} key={item.name} >{item.name}</option>)
    })

    return <div>
      <br />
      <div className='form-group row'>
        <label className='col-sm-4 col-form-label'>Choolse Data Type:</label>
        <div className='col-sm-8'>
          <select value={this.state.dataTypeId} onChange={event => this.dataTypeChange(event)}>
            {dataTypeOptions}
          </select>
        </div>
      </div>
      <EtlTemplates />
      <h4>Upload a new file:</h4>
      <input type='file' ref={this.fileInput} onChange={event => this.setState({ isValidFileSelected: Boolean(this.fileInput.current) })} />
      <button id='btnUploadAsset' className={this.state.isValidFileSelected ? 'btn btn-primary' : 'btn btn-light'}
        disabled={!this.state.isValidFileSelected} onClick={event => this.uploadFile()}>
        Upload
      </button>
    </div>
  }

  uploadFile () {
    const file = this.fileInput.current.files[0]
    const assetKey = file.name
    this.props.uploadEtlTemplateToServer(this.state.dataTypeId, file)
  }
}

const mapStateToProps = (state) => ({
  dataTypes: state.plan.uploadDataSources,
})

const mapDispatchToProps = (dispatch, ownProps) => ({
  loadEtlTemplatesFromServer: (dataType) => dispatch(EtlTemplateActions.loadEtlTemplatesFromServer(dataType)),
  uploadEtlTemplateToServer: (dataType, file) => dispatch(EtlTemplateActions.uploadEtlTemplateToServer(dataType, file))
})

const EtlTemplateManagerComponent = connect(mapStateToProps, mapDispatchToProps)(EtlTemplateManager)
export default EtlTemplateManagerComponent
