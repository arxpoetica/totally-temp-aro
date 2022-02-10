/* globals swal */
import React, { Component, Fragment } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
// import { PropTypes } from 'prop-types'
import PermissionsTable from './permissions-table.jsx'
import PlanActions from '../../plan/plan-actions.js'

export class ResourcePermissions extends Component {
  constructor (props) {
    super(props)

    this.isAdmin = false
    this.sortedRows = []
    this.state = {
      'openRowId': null,
      'selectedSourceName': 'all'
    }
  }

  // TODO: I think hasPermissions() is stored in state, state should be JSON serializable, move the function to a user utility
  render () {
    if (!this.props.loggedInUser || !this.props.authPermissions['RESOURCE_ADMIN']) return null // maybe fix this little hard code?
    this.isAdmin = false
    if (this.props.loggedInUser.hasPermissions(this.props.authPermissions['RESOURCE_ADMIN'].permissionBits)) {
      this.isAdmin = true
    }

    this.sortedRows = []
    if (this.state.selectedSourceName === 'all') {
      Object.keys(this.props.dataItems).forEach((dataKey) => {
        if (!this.props.dataItems[dataKey].proxyFor) {
          this.sortedRows = this.sortedRows.concat(this.props.dataItems[dataKey].allLibraryItems)
        }
      })
    } else {
      this.sortedRows = this.props.dataItems[this.state.selectedSourceName].allLibraryItems
    }
    this.sortedRows.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1)

    return (
      <Fragment>
        <div className='form-group row'>
          <label className='col-sm-4 col-form-label'>Data Type</label>
          <div className='col-sm-8'>
            <select className='form-control' onChange={event => { this.onSelectSource(event) }} value={this.state.selectedSourceName}>
              <option key={`data-source-dropdown-option-all`} value='all'>all</option>
              {this.props.uploadDataSources.map((source) => (
                <option key={`data-source-dropdown-option-${source.id}`} value={source.name}>{source.description}</option>
              ))}
            </select>
          </div>
        </div>
        <div className='ei-table-contain' style={{ 'maxHeight': 'calc(100vh - 17rem)', 'overflow': 'scroll' }}>
          <table className='table table-sm ei-table-foldout-striped' style={{ 'borderBottom': '1px solid #dee2e6' }}>
            <thead className='thead-dark'>
              <tr>
                <th />
                <th>
                  Name
                </th>
                <th>
                  Data Type
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {this.renderDataRows()}
            </tbody>
          </table>
          {/* also need pagination */}
        </div>
      </Fragment>
    )
  }

  renderDataRows () {
    var jsx = []
    this.sortedRows.forEach((libItem) => {
      jsx = jsx.concat(this.renderDataRow(libItem))
    })

    return jsx
  }

  renderDataRow (libItem) {
    var isOwner = this.isAdmin
    if (!isOwner) {
      if (this.props.loggedInUser.hasPermissions(this.props.authPermissions['RESOURCE_ADMIN'].permissionBits, libItem.permissions)) {
        isOwner = true
      }
    }
    return [
      <tr className={this.state.openRowId === libItem.identifier ? 'ei-foldout-table-open' : ''} key={libItem.dataType + libItem.identifier + '_a'}>
        <td onClick={event => { this.toggleRow(libItem.identifier) }}>
          <i className='far fa-minus-square ei-foldout-icon ei-foldout-icon-table-open' />
          <i className='far fa-plus-square ei-foldout-icon ei-foldout-icon-table-closed' />
        </td>
        <td>
          {libItem.name}
        </td>
        <td>
          {libItem.dataType}
        </td>
        <td className='ei-table-cell ei-table-button-cell'>
          <button className='btn btn-sm btn-outline-danger'
            type='button'
            onClick={event => { this.onDeleteRequest(libItem) }}
            data-toggle='tooltip' data-placement='bottom' title='Delete'
            disabled={(isOwner ? null : 'disabled')}>
            <i className='fa ei-button-icon fa-trash-alt' />
          </button>
        </td>
      </tr>,
      <tr className='ei-foldout-row' key={libItem.dataType + libItem.identifier + '_b'}>
        <td colSpan='999'>
          <div style={{ 'padding': '0px 20px 0px 20px' }}>
            {this.state.openRowId === libItem.identifier
              ? <PermissionsTable resource={libItem} resourceType='LIBRARY' isOwner={isOwner} />
              : ''
            }
          </div>
        </td>
      </tr>
    ]
  }

  toggleRow (rowId) {
    if (this.state.openRowId === rowId) {
      rowId = null
    }

    this.setState({ ...this.state, 'openRowId': rowId })
  }

  onSelectSource (event) {
    this.setState({ ...this.state, 'selectedSourceName': event.target.value })
  }

  // --- //

  onDeleteRequest (libItem) {
    this.confirmDelete(libItem.name)
      .then((okToDelete) => {
        if (okToDelete) {
          this.props.deleteLibraryEntry(libItem)
        }
      })
      .catch((err) => console.error(err))
  }

  confirmDelete (name) {
    return new Promise((resolve, reject) => {
      swal({
        title: 'Delete data source?',
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

// --- //

ResourcePermissions.propTypes = {
  /*
  rings: PropTypes.objectOf(PropTypes.instanceOf(Ring)),
  selectedRingId: PropTypes.number,
  plan: PropTypes.object,
  user: PropTypes.object,
  map: PropTypes.object
  */
}

const mapStateToProps = (state) => ({
  dataItems: state.plan.dataItems,
  loggedInUser: state.user.loggedInUser,
  uploadDataSources: state.plan.uploadDataSources,
  systemActors: state.user.systemActors,
  authPermissions: state.user.authPermissions
})

const mapDispatchToProps = dispatch => ({
  deleteLibraryEntry: (dataSource) => dispatch(PlanActions.deleteLibraryEntry(dataSource))
  // selectDataItems: (dataItemKey, selectedLibraryItems) => dispatch(PlanActions.selectDataItems(dataItemKey, selectedLibraryItems)),
  // setAllLibraryItems: (dataItemKey, allLibraryItems) => dispatch(PlanActions.setAllLibraryItems(dataItemKey, allLibraryItems))
})

const ResourcePermissionsComponent = wrapComponentWithProvider(reduxStore, ResourcePermissions, mapStateToProps, mapDispatchToProps)
export default ResourcePermissionsComponent
