import React, { Component, Fragment } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'

export class DatatypeTemplates extends Component {
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
                <th className='ei-table-col-head-sortable ng-binding ng-scope' onClick={event => { this.onSortClick(this.sortableColumns.NAME) }} style={{'cursor': 'pointer'}}>
                  Name
                </th>
                <th className='ei-table-col-head-sortable ng-binding ng-scope' onClick={event => { this.onSortClick(this.sortableColumns.PERMISSIONS) }} style={{'cursor': 'pointer'}}>
                  Download Link
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {/* {this.renderDataRows()} */}
              Location
            </tbody>
          </table>
        </div>
      </Fragment>
    )
  }
}

const mapStateToProps = (state) => ({
  currentProjectTemplateId: state.projectTemplate.currentProjectTemplateId,
  loggedInUser: state.user.loggedInUser,
  authPermissions: state.user.authPermissions
})

const mapDispatchToProps = dispatch => ({
})

const DatatypeTemplatesComponent = wrapComponentWithProvider(reduxStore, DatatypeTemplates, mapStateToProps, mapDispatchToProps)
export default DatatypeTemplatesComponent
