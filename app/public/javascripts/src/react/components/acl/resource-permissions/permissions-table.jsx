import React, { Component, Fragment } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
// import { PropTypes } from 'prop-types'
import aclActions from '../acl-actions.js'
// import { DropdownList } from 'react-widgets'
import SearchableSelect from '../../common/searchable-select.jsx'

export class PermissionsTable extends Component {
  constructor (props) {
    super(props)

    this.sortableColumns = { 'NAME': 'name', 'PERMISSIONS': 'permissions' }
    this.sortedRows = []
    this.state = {
      'selectedColumn': this.sortableColumns.PERMISSIONS,
      'isOrderDesc': false
    }
  }

  render () {
    var userLists = {}
    if (this.props.isOwner) {
      Object.values(this.props.systemActors).forEach(systemActor => {
        // filter out users already in the list
        var index = this.props.acl.findIndex(element => element.systemActorId === systemActor.id)
        if (index === -1) {
          var actorClone = { ...systemActor }

          if (!userLists.hasOwnProperty(actorClone.type)) userLists[actorClone.type] = []
          if (!actorClone.hasOwnProperty('name')) {
            actorClone.name = actorClone.id // default
            if (actorClone.hasOwnProperty('firstName') && actorClone.hasOwnProperty('lastName')) actorClone.name = `${actorClone.firstName} ${actorClone.lastName}`
          }
          userLists[actorClone.type].push(actorClone)
        }
      })
    }

    this.sortedRows = this.props.acl.slice(0)
    this.sortedRows.sort((a, b) => {
      var aVal = ''
      var bVal = ''
      if (this.state.selectedColumn === this.sortableColumns.NAME) {
        aVal = this.getActorNameById(a.systemActorId)
        bVal = this.getActorNameById(b.systemActorId)
      } else if (this.state.selectedColumn === this.sortableColumns.PERMISSIONS) {
        aVal = this.props.authRolesByPermission[a.rolePermissions] ? this.props.authRolesByPermission[a.rolePermissions].displayName : ''
        bVal = this.props.authRolesByPermission[b.rolePermissions] ? this.props.authRolesByPermission[b.rolePermissions].displayName : ''
        // aVal = this.props.authRolesByPermission[a.rolePermissions].displayName
        // bVal = this.props.authRolesByPermission[b.rolePermissions].displayName
      }
      if (this.state.isOrderDesc) {
        var holder = aVal
        aVal = bVal
        bVal = holder
      }
      return aVal.toLowerCase() > bVal.toLowerCase() ? 1 : -1
    })

    return (
      <Fragment>
        <table className='table table-sm ei-table-striped' style={{ 'borderBottom': '1px solid #dee2e6' }}>
          <thead>
            <tr>
              <th className='ei-table-col-head-sortable ng-binding ng-scope' onClick={event => { this.onSortClick(this.sortableColumns.NAME) }} style={{'cursor': 'pointer'}}>
                Name
                {this.state.selectedColumn === this.sortableColumns.NAME
                  ? <div className='ei-table-col-sort-icon ng-scope'>
                      <i className={'fa' + (this.state.isOrderDesc ? ' fa-chevron-up' : ' fa-chevron-down')} aria-hidden='true'> </i>
                    </div>
                  : ''
                }
              </th>
              <th className='ei-table-col-head-sortable ng-binding ng-scope' onClick={event => { this.onSortClick(this.sortableColumns.PERMISSIONS) }} style={{'cursor': 'pointer'}}>
                Role Permissions
                {this.state.selectedColumn === this.sortableColumns.PERMISSIONS
                  ? <div className='ei-table-col-sort-icon ng-scope'>
                      <i className={'fa' + (this.state.isOrderDesc ? ' fa-chevron-up' : ' fa-chevron-down')} aria-hidden='true'> </i>
                    </div>
                  : ''
                }
              </th>
              <th />
            </tr>
          </thead>
          <tbody>
            {this.renderDataRows()}
          </tbody>
        </table>
        <div>
          {this.props.isOwner
            ? <SearchableSelect optionLists={{ ...userLists }} resultsMax={10} onButton={item => { this.addAuthItem(item.id) }} btnLabel='Add' />
            : null
          }
        </div>
      </Fragment>
    )
  }

  renderDataRows () {
    var jsx = []
    // this.props.acl.forEach((aclItem) => {
    this.sortedRows.forEach((aclItem) => {
      // systemActorId, rolePermissions
      jsx.push(this.renderDataRow(aclItem))
    })
    return jsx
  }

  renderDataRow (dataItem) {
    const systemActor = this.props.systemActors[dataItem.systemActorId]
    if (!systemActor) return
    if (!systemActor.hasOwnProperty('name')) systemActor.name = `${systemActor.firstName} ${systemActor.lastName}`
    return <tr key={dataItem.systemActorId}>
      <td>
        {systemActor.name}
      </td>
      <td>
        {this.props.isOwner
          ? (
            <select className='form-control' onChange={event => { this.onSelectRoll(event, dataItem.systemActorId) }} value={dataItem.rolePermissions}>
              {Object.values(this.props.filteredAuthRoles).map((role) => (
                <option key={`data-item-${dataItem.systemActorId}-dropdown-option-${role.id}`} value={role.permissions}>{role.displayName}</option>
              ))}
            </select>
          )
          : Object.values(this.props.filteredAuthRoles).filter(role => role.permissions === dataItem.rolePermissions)[0].displayName
        }
      </td>
      <td className='ei-table-cell ei-table-button-cell'>
        <button className='btn btn-sm btn-outline-danger'
          type='button'
          onClick={event => { this.deleteAuthItem(event, dataItem.systemActorId) }}
          data-toggle='tooltip' data-placement='bottom' title='Delete'
          disabled={(this.props.isOwner ? null : 'disabled')}>
          <i className='fa ei-button-icon fa-trash-alt' />
        </button>
      </td>
    </tr>
  }

  getActorNameById (id) {
    const systemActor = this.props.systemActors[id]
    if (!systemActor) return ''
    return systemActor.name || `${systemActor.firstName} ${systemActor.lastName}`
  }
  // --- //

  onSortClick (colName) {
    console.log(colName)
    if (this.state.selectedColumn === colName) {
      this.setState({ ...this.state, 'isOrderDesc': !this.state.isOrderDesc })
    } else {
      this.setState({ ...this.state, 'selectedColumn': colName })
    }
  }

  onSelectRoll (event, systemActorId) {
    var permissionsBit = parseInt(event.target.value)
    this.props.setUserAcl(this.props.resource.identifier, systemActorId, permissionsBit)
  }

  deleteAuthItem (event, systemActorId) {
    this.props.deleteUserAcl(this.props.resource.identifier, systemActorId)
  }

  addAuthItem (systemActorId) {
    var permissionsBit = this.props.authRoles['RESOURCE_VIEWER'].permissions
    this.props.setUserAcl(this.props.resource.identifier, systemActorId, permissionsBit)
  }

  componentWillMount () {
    this.props.getAcl(this.props.resource.identifier)
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

const mapStateToProps = (state, ownProps) => {
  var acl = []
  // acl may not be loaded
  if (state.acl.aclByType.hasOwnProperty(ownProps.resourceType) &&
    state.acl.aclByType[ownProps.resourceType].hasOwnProperty(ownProps.resource.identifier)) {
    acl = state.acl.aclByType[ownProps.resourceType][ownProps.resource.identifier]
  }
  var filteredAuthRoles = []
  var authRolesByPermission = {}
  Object.keys(state.user.authRoles).forEach(key => {
    if (key.slice(0, 9) === 'RESOURCE_') {
      filteredAuthRoles.push(state.user.authRoles[key])
      authRolesByPermission[state.user.authRoles[key].permissions] = state.user.authRoles[key]
    }
  })
  return {
    acl: acl,
    systemActors: state.user.systemActors,
    authRoles: state.user.authRoles,
    filteredAuthRoles: filteredAuthRoles,
    authRolesByPermission: authRolesByPermission
  }
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  getAcl: (resourceId, doForceUpdate = false) => dispatch(aclActions.getAcl(ownProps.resourceType, resourceId, doForceUpdate)),
  setUserAcl: (resourceId, userId, permissionsBit) => dispatch(aclActions.setUserAcl(ownProps.resourceType, resourceId, userId, permissionsBit)),
  deleteUserAcl: (resourceId, userId) => dispatch(aclActions.deleteUserAcl(ownProps.resourceType, resourceId, userId))
})

const PermissionsTableComponent = wrapComponentWithProvider(reduxStore, PermissionsTable, mapStateToProps, mapDispatchToProps)
export default PermissionsTableComponent
