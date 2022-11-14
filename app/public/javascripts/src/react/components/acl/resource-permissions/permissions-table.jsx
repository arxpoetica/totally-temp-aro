import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import aclActions from '../acl-actions.js'
import { Select, Group, Button } from '@mantine/core'

const sortableColumns = { NAME: 'name', PERMISSIONS: 'permissions' }

export const PermissionsTable = (props) => {
  const {
    isOwner,
    acl,
    resource,
    authRolesByPermission,
    systemActors,
    authRoles,
    filteredAuthRoles,
    getAcl,
    setUserAcl,
    deleteUserAcl,
  } = props
  
  const [selectedColumn, setSelectedColumn] = useState(
    sortableColumns.PERMISSIONS,
  )
  const [sortedRows, setSortedRows] = useState([])
  const [isOrderDesc, setIsOrderDesc] = useState(false)
  const [selectedActorId, setSelecedActorId] = useState('')
  const [actorList, setActorList] = useState([])

  // runs on first render to make sure we have acl
  useEffect(() => {
    getAcl(resource.identifier)
  }, [])

  // runs on changes to order, column and props
  // creates rows and columns to display
  useEffect(() => {
    const createRows = () => {
      const rows = acl.slice(0)

      rows.sort((a, b) => {
        var aVal = ''
        var bVal = ''
        if (selectedColumn === sortableColumns.NAME) {
          aVal = getActorNameById(a.systemActorId)
          bVal = getActorNameById(b.systemActorId)
        } else if (selectedColumn === sortableColumns.PERMISSIONS) {
          aVal = authRolesByPermission[a.rolePermissions]
            ? authRolesByPermission[a.rolePermissions].displayName
            : ''
          bVal = authRolesByPermission[b.rolePermissions]
            ? authRolesByPermission[b.rolePermissions].displayName
            : ''
        }
        if (isOrderDesc) {
          var holder = aVal
          aVal = bVal
          bVal = holder
        }
        return aVal.toLowerCase() > bVal.toLowerCase() ? 1 : -1
      })
      setSortedRows(rows)
    }

    createRows()
  }, [acl, systemActors, isOrderDesc, selectedColumn])

  // runs on changes to acl and system actors
  // creates format to be used in select for adding
  useEffect(() => {
    const formatSystemActors = () => {
      const newList = Object.values(systemActors)
        .filter((actor) => {
          const index = acl.findIndex(
            (permission) => permission.systemActorId === actor.id,
          )
          return index === -1 ? true : false
        })
        .map((actor) => {
          const newActor = {}
          newActor.value = String(actor.id) //convert to string for mantine
          newActor.group = actor.type
          if (actor.type === 'group') {
            newActor.label = actor.name

            return newActor
          }
          newActor.label = actor.firstName + ' ' + actor.lastName

          return newActor
        })

      setActorList(newList)
    }

    formatSystemActors()
  }, [systemActors, acl])

  const renderDataRows = () => {
    var jsx = []
    sortedRows.forEach((aclItem) => {
      jsx.push(renderDataRow(aclItem))
    })
    return jsx
  }

  const renderDataRow = (dataItem) => {
    const systemActor = systemActors[dataItem.systemActorId]
    if (!systemActor) return
    if (!systemActor.hasOwnProperty('name'))
      systemActor.name = `${systemActor.firstName} ${systemActor.lastName}`
    return (
      <tr key={dataItem.systemActorId}>
        <td>{systemActor.name}</td>
        <td>
          {isOwner ? (
            <select
              className="form-control"
              onChange={(event) => {
                onSelectRoll(event, dataItem.systemActorId)
              }}
              value={dataItem.rolePermissions}
            >
              {Object.values(filteredAuthRoles).map((role) => (
                <option
                  key={`data-item-${dataItem.systemActorId}-dropdown-option-${role.id}`}
                  value={role.permissions}
                >
                  {role.displayName}
                </option>
              ))}
            </select>
          ) : (
            Object.values(filteredAuthRoles).filter(
              (role) => role.permissions === dataItem.rolePermissions,
            )[0].displayName
          )}
        </td>
        <td className="ei-table-cell ei-table-button-cell">
          <button
            className="btn btn-sm btn-outline-danger"
            type="button"
            onClick={(event) => {
              deleteAuthItem(event, dataItem.systemActorId)
            }}
            data-toggle="tooltip"
            data-placement="bottom"
            title="Delete"
            disabled={isOwner ? null : 'disabled'}
          >
            <i className="fa ei-button-icon fa-trash-alt" />
          </button>
        </td>
      </tr>
    )
  }

  const getActorNameById = (id) => {
    const systemActor = systemActors[id]
    if (!systemActor) return ''
    return (
      systemActor.name || `${systemActor.firstName} ${systemActor.lastName}`
    )
  }
  // --- //

  const onSortClick = (colName) => {
    if (selectedColumn === colName) {
      setIsOrderDesc(!isOrderDesc)
    } else {
      setSelectedColumn(colName)
    }
  }

  const onSelectRoll = (event, systemActorId) => {
    var permissionsBit = parseInt(event.target.value)
    setUserAcl(resource.identifier, systemActorId, permissionsBit)
  }

  const deleteAuthItem = (event, systemActorId) => {
    deleteUserAcl(resource.identifier, systemActorId)
  }

  const addAuthItem = (systemActorId) => {
    var permissionsBit = authRoles['RESOURCE_VIEWER'].permissions
    setUserAcl(resource.identifier, Number(systemActorId), permissionsBit)
  }

  return (
    <>
      <table
        className="table table-sm ei-table-striped"
        style={{ borderBottom: '1px solid #dee2e6' }}
      >
        <thead>
          <tr>
            <th
              className="ei-table-col-head-sortable ng-binding ng-scope"
              onClick={(event) => {
                onSortClick(sortableColumns.NAME)
              }}
              style={{ cursor: 'pointer' }}
            >
              Name
              {selectedColumn === sortableColumns.NAME ? (
                <div className="ei-table-col-sort-icon ng-scope">
                  <i
                    className={
                      'fa' +
                      (isOrderDesc ? ' fa-chevron-up' : ' fa-chevron-down')
                    }
                    aria-hidden="true"
                  >
                    {' '}
                  </i>
                </div>
              ) : (
                ''
              )}
            </th>
            <th
              className="ei-table-col-head-sortable ng-binding ng-scope"
              onClick={(event) => {
                onSortClick(sortableColumns.PERMISSIONS)
              }}
              style={{ cursor: 'pointer' }}
            >
              Role Permissions
              {selectedColumn === sortableColumns.PERMISSIONS ? (
                <div className="ei-table-col-sort-icon ng-scope">
                  <i
                    className={
                      'fa' +
                      (isOrderDesc ? ' fa-chevron-up' : ' fa-chevron-down')
                    }
                    aria-hidden="true"
                  >
                    {' '}
                  </i>
                </div>
              ) : (
                ''
              )}
            </th>
            <th />
          </tr>
        </thead>
        <tbody>{renderDataRows()}</tbody>
      </table>
      <div>
        {isOwner ? (
          <Group>
            <Select
              data={actorList}
              value={selectedActorId}
              onChange={(value) => setSelecedActorId(value)}
              placeholder="Select"
              searchable
              nothingFound="No Matches"
              clearable
            />
            <Button
              type="button"
              onClick={() => {
                addAuthItem(selectedActorId)
                setSelecedActorId('')
              }}
            >
              Add
            </Button>
          </Group>
        ) : null}
      </div>
    </>
  )
}

// --- //

const mapStateToProps = (state, ownProps) => {
  var acl = []
  // acl may not be loaded
  if (
    state.acl.aclByType.hasOwnProperty(ownProps.resourceType) &&
    state.acl.aclByType[ownProps.resourceType].hasOwnProperty(
      ownProps.resource.identifier,
    )
  ) {
    acl =
      state.acl.aclByType[ownProps.resourceType][ownProps.resource.identifier]
  }
  var filteredAuthRoles = []
  var authRolesByPermission = {}
  Object.keys(state.user.authRoles).forEach((key) => {
    if (key.slice(0, 9) === 'RESOURCE_') {
      filteredAuthRoles.push(state.user.authRoles[key])
      authRolesByPermission[state.user.authRoles[key].permissions] =
        state.user.authRoles[key]
    }
  })
  return {
    acl: acl,
    systemActors: state.user.systemActors,
    authRoles: state.user.authRoles,
    filteredAuthRoles: filteredAuthRoles,
    authRolesByPermission: authRolesByPermission,
  }
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  getAcl: (resourceId, doForceUpdate = false) =>
    dispatch(
      aclActions.getAcl(ownProps.resourceType, resourceId, doForceUpdate),
    ),
  setUserAcl: (resourceId, userId, permissionsBit) =>
    dispatch(
      aclActions.setUserAcl(
        ownProps.resourceType,
        resourceId,
        userId,
        permissionsBit,
      ),
    ),
  deleteUserAcl: (resourceId, userId) =>
    dispatch(
      aclActions.deleteUserAcl(ownProps.resourceType, resourceId, userId),
    ),
})

export default connect(mapStateToProps, mapDispatchToProps)(PermissionsTable)
