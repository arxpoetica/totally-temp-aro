import React, { Component } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import { PropTypes } from 'prop-types'

export class ResourcePermissions extends Component {
  constructor (props) {
    super(props)
    
    this.state = {
      'openRowId': null
    }
  }

  render () {
    console.log(this.props.dataItems)
    return <div>
      <div>
        <table className="table table-sm ei-table-foldout-striped" style={{'borderBottom': '1px solid #dee2e6'}}>
          <thead className="thead-dark">
	          <tr>
              <th></th>
              <th className="ei-table-col-head-sortable ng-binding ng-scope" onClick={event => {console.log('reorder')}}>
                Name
                <div className="ei-table-col-sort-icon ng-scope">
                  <i className="fa fa-chevron-down ng-scope" aria-hidden="true"> </i>
                </div>
              </th>
              <th className="ei-table-col-head-sortable ng-binding ng-scope" onClick={event => {console.log('reorder')}}>
                Data Type
                <div className="ei-table-col-sort-icon ng-scope">
                  <i className="fa fa-chevron-down ng-scope" aria-hidden="true"> </i>
                </div>
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {this.renderDataRows()}
          </tbody>
        </table>
      </div>
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
          <button className="btn btn-sm btn-outline-danger" onClick={event => {console.log('delete')}} data-toggle="tooltip" data-placement="bottom" title="Delete">
            <i className="fa ei-button-icon fa-trash-alt"></i>
          </button>
        </td>
      </tr>,
      <tr className='ei-foldout-row' key={dataItem.identifier + '_b'}>
        <td colSpan='999'>
          user table
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
  uploadDataSources: state.plan.uploadDataSources
  /*
  rings: state.ringEdit.rings,
  selectedRingId: state.ringEdit.selectedRingId,
  plan: state.plan,
  user: state.user,
  map: state.map,
  status: state.plan.activePlan && state.plan.activePlan.planState
  */
})

const mapDispatchToProps = dispatch => ({
  selectDataItems: (dataItemKey, selectedLibraryItems) => dispatch(PlanActions.selectDataItems(dataItemKey, selectedLibraryItems)),
  setAllLibraryItems: (dataItemKey, allLibraryItems) => dispatch(PlanActions.setAllLibraryItems(dataItemKey, allLibraryItems))
  /*
  setSelectedRingId: ringId => dispatch(ringActions.setSelectedRingId(ringId)),
  newRing: (planId, userId) => dispatch(ringActions.newRing(planId, userId)),
  removeRing: (ringId, planId, userId) => dispatch(ringActions.removeRing(ringId, planId, userId)),
  removeNode: (ring, featureId, planId, userId) => dispatch(ringActions.removeNode(ring, featureId, planId, userId)),
  saveRingChangesToServer: (ring, planId, userId) => dispatch(ringActions.saveRingChangesToServer(ring, planId, userId)),
  renameRing: (ring, name, planId, userId) => dispatch(ringActions.renameRing(ring, name, planId, userId))
  */
})

const ResourcePermissionsComponent = wrapComponentWithProvider(reduxStore, ResourcePermissions, mapStateToProps, mapDispatchToProps)
export default ResourcePermissionsComponent