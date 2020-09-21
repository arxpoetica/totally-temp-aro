import React, { Component, Fragment } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import EtlTemplateActions from './etl-templates-actions'

export class EtlTemplates extends Component {
  constructor (props) {
    super(props)
    this.props.setConfigView(true)
  }

  render () {
    
    return (
      <Fragment>
        <div className='ei-table-contain' style={{ 'overflow': 'scroll' }}>
          <table className='table table-sm ei-table-striped' style={{ 'borderBottom': '1px solid #dee2e6' }}>
            <thead>
              <tr>
                <th>
                  Name
                </th>
                <th>
                  Description
                </th>
                <th>
                  Type
                </th>
                <th>
                  Action
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {this.renderTemplateRows()}
            </tbody>
          </table>
        </div>
      </Fragment>
    )
  }

  renderTemplateRows () {
    let jsx = []
    if(this.props.etlTemplates.etlTemplates &&
      this.props.etlTemplates.etlTemplates.length > 0) {
      this.props.etlTemplates.etlTemplates.forEach((item) => {
        jsx.push(this.renderEtlTemplateRow(item))
      })
    }
    return jsx
  }

  renderEtlTemplateRow (etlTemplateItem) {
    return <tr key={etlTemplateItem.name}>
      <td>
        {etlTemplateItem.name}
      </td>
      <td>
        {etlTemplateItem.description}
      </td>
      <td>
        {etlTemplateItem.type}
      </td>
      <td className='ei-table-cell'>
        { !this.props.isConfigView &&
          <a href={'/etltemplate/download?id=' + etlTemplateItem.id}>
            <button className={'btn btn-sm btn-primary'} style={{ minWidth: '120px' }}>
              <span><i className='fa fa-download' /> Download</span>
            </button>
        </a> }
        { this.props.isConfigView &&
        <div>
          <a href={'/etltemplate/download?id=' + etlTemplateItem.id}>
            <button className='btn btn-sm btn-outline-dark'
              type='button'>
            <i className='fa fa-download' />
            </button>
          </a>
        <button className='btn btn-sm btn-outline-danger'
          type='button'
          onClick={event => this.onDeleteRequest(etlTemplateItem)}>
          <i className='fa fa-trash-alt' />
        </button>
        </div> }
      </td>
    </tr>
  }

  onDeleteRequest (etlTemplateItem) {
    this.confirmDelete(etlTemplateItem.name)
      .then((okToDelete) => {
        if (okToDelete) {
          this.props.deleteEtlTemplate(etlTemplateItem.id, etlTemplateItem.data_type)
        }
      })
      .catch((err) => console.error(err))
  }

  confirmDelete (name) {
    return new Promise((resolve, reject) => {
      swal({
        title: 'Delete Template?',
        text: `Are you sure you want to delete "${name}"?`,
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#DD6B55',
        confirmButtonText: 'Yes',
        cancelButtonText: 'No'
      }, (result) => {
        if (result) {
          resolve(true)
        } else {
          resolve(false)
        }
      })
    })
  }
}

const mapStateToProps = (state) => ({
  etlTemplates: state.etlTemplates,
  isConfigView: state.etlTemplates.configView,
})

const mapDispatchToProps = dispatch => ({
  setConfigView: (flag) => dispatch(EtlTemplateActions.setConfigView(flag)),
  deleteEtlTemplate: (templateId, dataType) => dispatch(EtlTemplateActions.deleteEtlTemplate(templateId, dataType))
})

const EtlTemplatesComponent = wrapComponentWithProvider(reduxStore, EtlTemplates, mapStateToProps, mapDispatchToProps)
export default EtlTemplatesComponent
