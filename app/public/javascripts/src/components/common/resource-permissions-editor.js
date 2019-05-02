class ResourcePermissionsEditorController {
  constructor ($http, $timeout, state) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
    this.accessTypes = Object.freeze({
      RESOURCE_READ: { displayName: 'Read', permissionBits: null, actors: [] },
      RESOURCE_WRITE: { displayName: 'Write', permissionBits: null, actors: [] },
      RESOURCE_ADMIN: { displayName: 'Owner', permissionBits: null, actors: [] }
    })
    
    
    
    
    
    
    
    
    // test data
  
    this.rows = [
      {
        'systemActorId': 13371, 
        'name': 'name 1', 
        'rolePermissions': 4
      }, 
      {
        'systemActorId': 13372, 
        'name': 'this is a name', 
        'rolePermissions': 7
      } 
    ]
    
    this.idProp = 'systemActorId' // unique id of each row
    
    this.displayProps = [
      {
        'propertyName': 'name',
        'levelOfDetail': 0,
        'format': '',
        'displayName': 'Name',
        'enumTypeURL': '',
        'displayDataType': 'string',
        'defaultValue': '',
        'editable': false,
        'visible': true
      }, 
      {
        'propertyName': 'rolePermissions', //'managerType',
        'levelOfDetail': 0,
        'format': '',
        'displayName': 'Role Permissions',
        'enumTypeURL': '',
        'enumSet': [
          {'id': 7, 'description':'Owner'}, 
          {'id': 6, 'description':'Modifier'}, 
          {'id': 4, 'description':'Viewer'}
        ], 
        'displayDataType': 'enum',
        'defaultValue': '',
        'editable': true,
        'visible': true
      }
      
    ]
    
    
    
    
    
    
    // ---
    
    
    
    
    
    
    
    
  }
  
  
  
  
  
  
  
  $onInit () {
    if (typeof this.enabled === 'undefined') {
      this.enabled = true // If not defined, then make it true
    }
    this.loadResourceAccess()
    this.subSystemActors = this.systemActors && this.systemActors.slice(0, 10)
    console.log("actors")
    console.log(this.subSystemActors)
    this.registerSaveAccessCallback && this.registerSaveAccessCallback({ saveResourceAccess: this.saveResourceAccess.bind(this) })
  }

  loadResourceAccess () {
    return this.$http.get('/service/auth/permissions')
      .then((result) => {
        console.log("load A")
        console.log(result)
        result.data.forEach((authPermissionEntity) => {
          if (this.accessTypes.hasOwnProperty(authPermissionEntity.name)) {
            this.accessTypes[authPermissionEntity.name].permissionBits = authPermissionEntity.id
          }
        })
        // Get the actors that have access for this resource
        return this.$http.get(`/service/auth/acl/${this.resourceType}/${this.resourceId}`)
      })
      .then((result) => {
        console.log("load B")
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
        console.log("save A")
        console.log(result)
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
        console.log(`/service/auth/acl/${this.resourceType}/${this.resourceId}?userId=${this.state.loggedInUser.id}`)
        console.log(putBody)
        return this.$http.put(`/service/auth/acl/${this.resourceType}/${this.resourceId}?userId=${this.state.loggedInUser.id}`, putBody)
      })
      .catch((err) => console.error(err)) // reload pristine model? 
  }
  
  // depricate
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

ResourcePermissionsEditorController.$inject = ['$http', '$timeout', 'state']

let resourcePermissionsEditor = {
  templateUrl: '/components/common/resource-permissions-editor.html',
  bindings: {
    resourceType: '@',
    resourceId: '@',
    systemActors: '<',
    enabled: '<',
    registerSaveAccessCallback: '&', // To be called to register a callback, which will save the access list
    onSelectionChanged: '&'
  },
  controller: ResourcePermissionsEditorController
}

export default resourcePermissionsEditor
