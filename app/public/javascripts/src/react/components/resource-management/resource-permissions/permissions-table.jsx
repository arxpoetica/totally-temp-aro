import React, { Component } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import { PropTypes } from 'prop-types'
import resourcePermissionsActions from './resource-permissions-actions.js'

export class PermissionsTable extends Component {
  constructor (props) {
    super(props)
    
  }

  render () {
    return <div>
      <table className="table table-sm ei-table-foldout-striped" style={{'borderBottom': '1px solid #dee2e6'}}>
        <thead className="thead-dark">
          <tr>
            <th className="ei-table-col-head-sortable ng-binding ng-scope" onClick={event => {console.log('reorder')}}>
              Name
              {/*
              <div className="ei-table-col-sort-icon ng-scope">
                <i className="fa fa-chevron-down ng-scope" aria-hidden="true"> </i>
              </div>
              */}
            </th>
            <th className="ei-table-col-head-sortable ng-binding ng-scope" onClick={event => {console.log('reorder')}}>
              Role Permissions
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
    var resourceAccess = this.props.accessById[this.props.resource.identifier]
    if (resourceAccess && this.props.systemActors) {
      Object.keys(resourceAccess).forEach((key) => {
        // systemActorId, rolePermissions
        jsx.push(this.renderDataRow(resourceAccess[key]))
      })
    }
    return jsx
  }

  renderDataRow (dataItem) {
    console.log(this.props.systemActors)
    console.log(dataItem)
    const systemActor = this.props.systemActors[dataItem.systemActorId]
    if (!systemActor) return
    if (!systemActor.hasOwnProperty('name')) systemActor.name = `${systemActor.firstName} ${systemActor.lastName}`
    return <tr key={dataItem.systemActorId}>
      <td>
        {systemActor.name}
      </td>
      <td>
        {dataItem.rolePermissions}
      </td>
      <td className="ei-table-cell ei-table-button-cell">
        <button className="btn btn-sm btn-outline-danger" onClick={event => {console.log('delete')}} data-toggle="tooltip" data-placement="bottom" title="Delete">
          <i className="fa ei-button-icon fa-trash-alt"></i>
        </button>
      </td>
    </tr>
  }

  componentWillMount () {
    this.props.loadResourceAccess('LIBRARY', this.props.resource.identifier)
  }
}

// --- //

PermissionsTable.propTypes = {
  /*
  rings: PropTypes.objectOf(PropTypes.instanceOf(Ring)),
  selectedRingId: PropTypes.number,
  plan: PropTypes.object,
  user: PropTypes.object,
  map: PropTypes.object
  */
}

const mapStateToProps = (state) => ({
  accessById: state.resourcePermissions.accessById,
  systemActors: state.user.systemActors
})

const mapDispatchToProps = dispatch => ({
  loadResourceAccess: (resourceType, resourceId, doForceUpdate = false) => dispatch(resourcePermissionsActions.loadResourceAccess(resourceType, resourceId, doForceUpdate))
})

const PermissionsTableComponent = wrapComponentWithProvider(reduxStore, PermissionsTable, mapStateToProps, mapDispatchToProps)
export default PermissionsTableComponent