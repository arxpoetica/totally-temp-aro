import React, { Component } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import { PropTypes } from 'prop-types'
import PermissionsTable from './permissions-table.jsx'

export class ResourcePermissions extends Component {
  constructor (props) {
    super(props)
    
    this.isOwner = false

    this.state = {
      'openRowId': null
    }
  }

  render () {
    if (!this.props.loggedInUser || !this.props.authPermissions['RESOURCE_ADMIN']) return null // maybe fix this little hard code?
    this.isOwner = false
    if (this.props.loggedInUser.hasPermissions(this.props.authPermissions['RESOURCE_ADMIN'].permissionBits)) {
      this.isOwner = true
    }
    return <div>
      <table className="table table-sm ei-table-foldout-striped" style={{'borderBottom': '1px solid #dee2e6'}}>
        <thead className="thead-dark">
          <tr>
            <th></th>
            <th className="ei-table-col-head-sortable ng-binding ng-scope" onClick={event => {console.log('reorder')}}>
              Name
              {/*
              <div className="ei-table-col-sort-icon ng-scope">
                <i className="fa fa-chevron-down ng-scope" aria-hidden="true"> </i>
              </div>
              */}
            </th>
            <th className="ei-table-col-head-sortable ng-binding ng-scope" onClick={event => {console.log('reorder')}}>
              Data Type
              {/*
              <div className="ei-table-col-sort-icon ng-scope">
                <i className="fa fa-chevron-down ng-scope" aria-hidden="true"> </i>
              </div>
              */}
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {this.renderDataRows()}
        </tbody>
      </table>
      {/* also need pagination */}
    </div>
  }

  renderDataRows () {
    var jsx = []
    Object.keys(this.props.dataItems).forEach((dataKey) => {
      if (dataKey === 'equipment'){ // check dropdown type val
        this.props.dataItems[dataKey].allLibraryItems.forEach((dataItem) => {
          jsx = jsx.concat(this.renderDataRow(dataItem))
        })       
      }
    })
    return jsx
  }

  renderDataRow (dataItem) {
    // ToDo: check for ownership of dataItem to overide isOwner
    return [
      <tr className={this.state.openRowId === dataItem.identifier ? 'ei-foldout-table-open' : ''} key={dataItem.identifier + '_a'}>
        <td onClick={event => {this.toggleRow(dataItem.identifier)}}>
          <i className="far fa-minus-square ei-foldout-icon ei-foldout-icon-table-open"></i>
          <i className="far fa-plus-square ei-foldout-icon ei-foldout-icon-table-closed"></i>
        </td>
        <td>
          {dataItem.name}
        </td>
        <td>
          {dataItem.dataType}
        </td>
        <td className="ei-table-cell ei-table-button-cell">
          <button className="btn btn-sm btn-outline-danger" 
          onClick={event => {console.log('delete')}} 
          data-toggle="tooltip" data-placement="bottom" title="Delete"
          disabled={(this.isOwner ? null : "disabled")}>
            <i className="fa ei-button-icon fa-trash-alt"></i>
          </button>
        </td>
      </tr>,
      <tr className='ei-foldout-row' key={dataItem.identifier + '_b'}>
        <td colSpan='999'>
          <div style={{'padding': '0px 20px 0px 20px'}}>
            <PermissionsTable resource={dataItem} />
            <br/>add user
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
  selectDataItems: (dataItemKey, selectedLibraryItems) => dispatch(PlanActions.selectDataItems(dataItemKey, selectedLibraryItems)),
  setAllLibraryItems: (dataItemKey, allLibraryItems) => dispatch(PlanActions.setAllLibraryItems(dataItemKey, allLibraryItems))
})

const ResourcePermissionsComponent = wrapComponentWithProvider(reduxStore, ResourcePermissions, mapStateToProps, mapDispatchToProps)
export default ResourcePermissionsComponent