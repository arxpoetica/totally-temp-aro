class ResourcePermissionsEditorController {
  constructor ($http, $timeout) {
    this.$http = $http
    this.$timeout = $timeout
    this.accessTypes = Object.freeze({
      RESOURCE_READ: { displayName: 'Read', permissionBits: null, actors: [] },
      RESOURCE_WRITE: { displayName: 'Write', permissionBits: null, actors: [] },
      RESOURCE_ADMIN: { displayName: 'Owner', permissionBits: null, actors: [] }
    })
  }

  $onInit () {
    if (typeof this.enabled === 'undefined') {
      this.enabled = true // If not defined, then make it true
    }
    this.loadResourceAccess()
    this.subSystemActors = this.systemActors && this.systemActors.slice(0, 10)
    this.registerSaveAccessCallback && this.registerSaveAccessCallback({ saveResourceAccess: this.saveResourceAccess.bind(this) })
  }

  loadResourceAccess () {
    return this.$http.get('/service/auth/permissions')
      .then((result) => {
        result.data.forEach((authPermissionEntity) => {
          if (this.accessTypes.hasOwnProperty(authPermissionEntity.name)) {
            this.accessTypes[authPermissionEntity.name].permissionBits = authPermissionEntity.id
          }
        })
        // Get the actors that have access for this resource
        console.log(this.resourceType)
        console.log(this.resourceId)
        return this.$http.get(`/service/auth/acl/${this.resourceType}/${this.resourceId}`)
      })
      .then((result) => {
        console.log(result)
        var idToSystemActor = {}
        this.systemActors.forEach((systemActor) => idToSystemActor[systemActor.id] = systemActor)
        result.data.resourcePermissions.forEach((access) => {
          const systemActor = idToSystemActor[access.systemActorId]
          const permission = access.rolePermissions
          Object.keys(this.accessTypes).forEach((accessTypeKey) => {
            if ((permission & this.accessTypes[accessTypeKey].permissionBits) != 0) {
              this.accessTypes[accessTypeKey].actors.push(systemActor)
            }
          })
        })
      })
      .catch((err) => console.error(err))
  }

  saveResourceAccess () {
    return this.$http.get(`/service/auth/acl/${this.resourceType}/${this.resourceId}`)
      .then((result) => {
        // Loop through all our access types
        var systemActorIdToPermissions = {}
        Object.keys(this.accessTypes).forEach((accessTypeKey) => {
          // Get the actors selected for this access type
          const selectedActors = this.accessTypes[accessTypeKey].actors
          selectedActors.forEach((selectedActor) => {
            if (!systemActorIdToPermissions.hasOwnProperty(selectedActor.id)) {
              systemActorIdToPermissions[selectedActor.id] = 0
            }
            // Set the permission bit
            systemActorIdToPermissions[selectedActor.id] |= this.accessTypes[accessTypeKey].permissionBits
          })
        })
        // Construct a put body with all the permissions we will send over to aro-service
        var putBody = { resourcePermissions: [] }
        Object.keys(systemActorIdToPermissions).forEach((actorId) => {
          putBody.resourcePermissions.push({
            systemActorId: actorId,
            rolePermissions: systemActorIdToPermissions[actorId]
          })
        })
        return this.$http.put(`/service/auth/acl/${this.resourceType}/${this.resourceId}`, putBody)
      })
      .catch((err) => console.error(err))
  }

  searchActors (filterObj) {
    if (filterObj !== '') {
      var reg = new RegExp(filterObj, 'i')
      this.subSystemActors = this.systemActors.filter((actor) => {
        // Filter users
        if (actor.hasOwnProperty('firstName')) {
          return actor.firstName.match(reg) || actor.lastName.match(reg)
        }
        // Filter Groups
        else if (actor.hasOwnProperty('originalName')) {
          return actor.originalName.match(reg)
        }
      })
      this.$timeout()
    }
  }
}

ResourcePermissionsEditorController.$inject = ['$http', '$timeout']

let resourcePermissionsEditor = {
  templateUrl: '/components/common/resource-permissions-editor.html',
  bindings: {
    resourceType: '@',
    resourceId: '@',
    systemActors: '<',
    enabled: '<',
    registerSaveAccessCallback: '&' // To be called to register a callback, which will save the access list
  },
  controller: ResourcePermissionsEditorController
}

export default resourcePermissionsEditor
