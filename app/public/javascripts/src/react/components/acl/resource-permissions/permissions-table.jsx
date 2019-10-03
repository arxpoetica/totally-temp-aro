import React, { Component, Fragment } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
// import { PropTypes } from 'prop-types'
import aclActions from '../acl-actions.js'
// import { DropdownList } from 'react-widgets'

export class PermissionsTable extends Component {
  constructor (props) {
    super(props)

    this.newActorId = null
    console.log('construct')
  }

  render () {
    return (
      <Fragment>
        <table className='table table-sm ei-table-striped' style={{ 'borderBottom': '1px solid #dee2e6' }}>
          <thead>
            <tr>
              <th className='ei-table-col-head-sortable ng-binding ng-scope' onClick={event => { console.log('reorder') }}>
                Name
                {/*
                <div className="ei-table-col-sort-icon ng-scope">
                  <i className="fa fa-chevron-down ng-scope" aria-hidden="true"> </i>
                </div>
                */}
              </th>
              <th className='ei-table-col-head-sortable ng-binding ng-scope' onClick={event => { console.log('reorder') }}>
                Role Permissions
                {/*
                <div className="ei-table-col-sort-icon ng-scope">
                  <i className="fa fa-chevron-down ng-scope" aria-hidden="true"> </i>
                </div>
                */}
              </th>
              <th />
            </tr>
          </thead>
          <tbody>
            {this.renderDataRows()}
          </tbody>
        </table>
        <div>
          add user
        </div>
      </Fragment>
    )
  }

  renderDataRows () {
    var jsx = []
    this.props.acl.forEach((aclItem) => {
      // systemActorId, rolePermissions
      jsx.push(this.renderDataRow(aclItem))
    })
    return jsx
  }

  renderDataRow (dataItem) {
    console.log(dataItem)
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
            {/* <DropdownList
              data={this.props.filteredAuthRoles}
              valueField='permissions'
              textField='displayName'
              value={dataItem.rolePermissions}
            /> */}
          )
          : dataItem.rolePermissions
        }
      </td>
      <td className='ei-table-cell ei-table-button-cell'>
        <button className='btn btn-sm btn-outline-danger'
          onClick={event => { console.log('delete') }}
          data-toggle='tooltip' data-placement='bottom' title='Delete'
          disabled={(this.props.isOwner ? null : 'disabled')}>
          <i className='fa ei-button-icon fa-trash-alt' />
        </button>
      </td>
    </tr>
  }
  /*
  renderUserDropdown () {
    var jsx = null
    if (this.props.isOwner) {
      jsx = (
        <div className="input-group">
          <div className="ei-input-label">
            Add User:
          </div>
        <ui-select limit="1" ng-model="$ctrl.newActorId"
              theme="bootstrap" close-on-select="true"
              on-select="$ctrl.onSelectionChanged()"
              on-remove="$ctrl.onSelectionChanged()">
              <ui-select-match placeholder="User Search" allow-clear="true">
                <span>{{$select.selected.name}}</span>
              </ui-select-match>
              <ui-select-choices repeat="person.id as person in $ctrl.systemActorsArray | filter: { name: $select.search } | filter: $ctrl.filterNewActorList| orderBy:'name' "
                group-by="'type'">
                <i ng-if="person.type === 'user'" className="fa fas fa-user"></i>
                <i ng-if="person.type === 'group'" className="fa fas fa-users"></i>
                &nbsp;<span ng-bind-html="person.name | highlight: $select.search"></span>
              </ui-select-choices>
            </ui-select>
          <div className="input-group-append">
            <button type="button" className="btn btn-sm btn-primary"
                    ng-click="$ctrl.addActor($event)"
                    ng-disabled="!$ctrl.newActorId">
              <i className="fa fa-plus"></i> Add
            </button>
          </div>
        </div>
      )
    }
    return jsx
  }
*/
  // --- //

  deleteAuthItem () {

  }

  componentWillMount () {
    this.props.getAcl('LIBRARY', this.props.resource.identifier)
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
  if (state.acl.aclByType.hasOwnProperty('LIBRARY') &&
    state.acl.aclByType['LIBRARY'].hasOwnProperty(ownProps.resource.identifier)) {
    acl = state.acl.aclByType['LIBRARY'][ownProps.resource.identifier]
  }
  var filteredAuthRoles = []
  Object.keys(state.user.authRoles).forEach(key => {
    if (key.slice(0, 9) === 'RESOURCE_') filteredAuthRoles.push(state.user.authRoles[key])
  })
  return {
    acl: acl,
    systemActors: state.user.systemActors,
    filteredAuthRoles: filteredAuthRoles
  }
}

const mapDispatchToProps = dispatch => ({
  getAcl: (resourceType, resourceId, doForceUpdate = false) => dispatch(aclActions.getAcl(resourceType, resourceId, doForceUpdate))
})

const PermissionsTableComponent = wrapComponentWithProvider(reduxStore, PermissionsTable, mapStateToProps, mapDispatchToProps)
export default PermissionsTableComponent
