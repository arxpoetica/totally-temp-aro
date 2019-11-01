import Constants from '../components/common/constants'

class AclManager {
  constructor ($http) {
    this.$http = $http
    this.PERMISSIONS = Object.freeze({
      READ: 'READ',
      WRITE: 'WRITE',
      ADMIN: 'ADMIN',
      IS_SUPERUSER: 'IS_SUPERUSER'
    })
  }

  getPermissionBits () {
    // Get the permission bits from aro-service
    const accessTypes = Object.freeze({
      RESOURCE_READ: { displayName: 'Read', permissionBits: null },
      RESOURCE_WRITE: { displayName: 'Write', permissionBits: null },
      RESOURCE_ADMIN: { displayName: 'Owner', permissionBits: null }
    })

    return this.$http.get('/service/auth/permissions')
      .then(result => {
        result.data.forEach((authPermissionEntity) => {
          if (accessTypes.hasOwnProperty(authPermissionEntity.name)) {
            accessTypes[authPermissionEntity.name].permissionBits = authPermissionEntity.id
          }
        })
        return Promise.resolve(accessTypes)
      })
      .catch(err => console.log(err))
  }

  // Gets the effective permissions for a given resourceType (e.g. PLAN, SYSTEM) and resourceId (e.g. plan id, user id)
  getEffectivePermissions (resourceType, resourceId, loggedInUser) {
    return Promise.all([
      this.getPermissionBits(),
      this.$http.get(`/service/auth/acl/${resourceType}/${resourceId}`),
      this.$http.get(`/service/auth/acl/SYSTEM/${loggedInUser.id}`)
    ])
      .then((results) => {
        const resolvedAccessTypes = results[0]
        const resourcePermissions = results[1].data; const systemPermissions = results[2].data

        var accessResult = {}
        accessResult[this.PERMISSIONS.READ] = false
        accessResult[this.PERMISSIONS.WRITE] = false
        accessResult[this.PERMISSIONS.ADMIN] = false
        accessResult[this.PERMISSIONS.IS_SUPERUSER] = false

        // We are checking if the logged in user or any of the users groups have permission to write.
        resourcePermissions.resourcePermissions.forEach((access) => {
          if ((loggedInUser.id === access.systemActorId) || (loggedInUser.groupIds.indexOf(access.systemActorId) >= 0)) {
            const permission = access.rolePermissions
            // Note the or-equal-to (|=). So we start out with no permissions, and keep adding to them.
            accessResult[this.PERMISSIONS.READ] = accessResult[this.PERMISSIONS.READ] || ((permission & resolvedAccessTypes.RESOURCE_READ.permissionBits) != 0)
            accessResult[this.PERMISSIONS.WRITE] = accessResult[this.PERMISSIONS.WRITE] || ((permission & resolvedAccessTypes.RESOURCE_WRITE.permissionBits) != 0)
            accessResult[this.PERMISSIONS.ADMIN] = accessResult[this.PERMISSIONS.ADMIN] || ((permission & resolvedAccessTypes.RESOURCE_ADMIN.permissionBits) != 0)
          }
        })

        // Next, check the global namespace to see if this user or groups have "SuperUser" permissions
        systemPermissions.resourcePermissions.forEach((access) => {
          // We are checking if the logged in user or any of the users groups have permission to write.
          // ToDo: depricate Constants.PERMISSIONS (also there is no such thing as Constants.SUPER_USER_PERMISSIONS)
          if ((loggedInUser.id === access.systemActorId) || (loggedInUser.groupIds.indexOf(access.systemActorId) >= 0)) {
            accessResult[this.PERMISSIONS.IS_SUPERUSER] = (access.rolePermissions === Constants.SUPER_USER_PERMISSIONS)
          }
        })
        return Promise.resolve(accessResult)
      })
      .catch(err => console.error(err))
  }
}

AclManager.$inject = ['$http']

export default AclManager
