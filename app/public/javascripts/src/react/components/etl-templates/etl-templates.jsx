import React, { Component, Fragment } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'

export class EtlTemplates extends Component {
  constructor (props) {
    super(props)
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
                  Download Link
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
    // TODO: Use maps as suggested by Parag
    //(this.props.etlTemplates).map(etlTemplateItem => this.renderEtlTemplateRow(etlTemplateItem))
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
        <a href={'/etltemplate/download?id=' + etlTemplateItem.id}>
          <button className={'btn btn-sm btn-primary'} style={{ minWidth: '120px' }}>
             <span><i className='fa fa-download' /> Download</span>
          </button>
        </a>
      </td>
    </tr>
  }
}

const mapStateToProps = (state) => ({
  etlTemplates: state.etlTemplates,
})

const mapDispatchToProps = dispatch => ({
})

const EtlTemplatesComponent = wrapComponentWithProvider(reduxStore, EtlTemplates, mapStateToProps, mapDispatchToProps)
export default EtlTemplatesComponent
