
import { createSelector } from 'reselect'

const getAllSystemActors = reduxState => reduxState.user.systemActors
const getAllSystemActorsArray = createSelector([getAllSystemActors], systemActors => {
  var systemActorsArray = []
  Object.keys(systemActors).forEach(actorKey => {
    var copyOfActor = angular.copy(systemActors[actorKey])
    if (copyOfActor.type === 'user') {
      copyOfActor.name = `${copyOfActor.firstName} ${copyOfActor.lastName}`
    }
    systemActorsArray.push(copyOfActor)
  })
  return systemActorsArray
})

class ResourcePermissionsEditorController {
  constructor ($http, $timeout, $ngRedux, state) {
    this.tempUsers = [{ name: 'Dan', description: 'Dan is a winner', id: 1234 }]
    this.$http = $http
    this.$timeout = $timeout
    this.state = state

    this.authRollsEnum = []
    this.actorsById = {}

    var requestedRolls = {
      'RESOURCE_OWNER': 'Owner',
      'RESOURCE_MODIFIER': 'Modifier',
      'RESOURCE_VIEWER': 'Viewer'
    }

    this.isOwner = true
    
    // these vals will be replaced by vals from state
    this.defaultPermissions = 4
    this.ownerPermissions = 7
    this.superuserPermissions = 31
    
    this.state.authRolls.forEach((authRoll) => {
      if (requestedRolls.hasOwnProperty(authRoll.name)) {
        this.authRollsEnum.push({
          'id': authRoll.permissions, 
          'description': requestedRolls[authRoll.name], 
          'name': authRoll.name
        })
      }
      // can replace these with state.authRollsByName
      if ('RESOURCE_VIEWER' == authRoll.name) this.defaultPermissions = authRoll.permissions
      if ('RESOURCE_OWNER' == authRoll.name) this.ownerPermissions = authRoll.permissions
      if ('SUPER_USER' == authRoll.name) this.superuserPermissions = authRoll.permissions
    })
    
    this.newActorId = null
    this.rows = []
    this.idProp = 'systemActorId' // unique id of each row
    
    this.displayProps = [
      {
        'propertyName': 'name',
        'levelOfDetail': 0,
        'format': '',
        'displayName': 'Name',
        'enumTypeURL': '',
        'displayDataType': 'html',// string
        'defaultValue': '',
        'editable': true,
        'visible': true
      }, 
      {
        'propertyName': 'rolePermissions', //'managerType',
        'levelOfDetail': 0,
        'format': '',
        'displayName': 'Role Permissions',
        'enumTypeURL': '',
        'enumSet': this.authRollsEnum, 
        'displayDataType': 'enum',
        'defaultValue': '',
        'editable': true,
        'visible': true
      }
    ]
    
    this.actionsParam = null
    
    this.actions = [
      {
        buttonText: 'Delete', // Delete
        buttonClass: 'btn-outline-danger',
        iconClass: 'fa-trash-alt',
        toolTip: 'Delete',
        callBack: (row, index) => {
          this.removeActor(row)
        }
      }
    ]
    
    this.filterNewActorList = (value, index, array) => {
      return !this.rows.find((obj)=>{return obj.systemActorId === value.id})
    }
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)
  }

  $onInit () {
    if (typeof this.enabled === 'undefined') {
      this.enabled = true // If not defined, then make it true
    }
    this.loadResourceAccess()
    this.registerSaveAccessCallback && this.registerSaveAccessCallback({ saveResourceAccess: this.saveResourceAccess.bind(this) })
  }

  addActor () {
    var newActor = this.systemActors[this.newActorId]
    var isExistingActorId = this.rows.some(user => user.systemActorId === newActor.id)
    if (!isExistingActorId) {
      if (newActor.type === 'group') {
        this.rows.push({
          'systemActorId': newActor.id,
          'name': newActor.name,
          'rolePermissions': this.defaultPermissions
        })
      } else {
        this.rows.push({
          'systemActorId': newActor.id,
          'name': newActor.firstName + ' ' + newActor.lastName,
          'rolePermissions': this.defaultPermissions
        })
      }
    }
    this.onSelectionChanged()
  }

  removeActor (row) {
    this.rows = this.rows.filter(function(value, index, arr) {
      return value != row;
    })
    this.onSelectionChanged()
  }

  loadResourceAccess () {
    return this.$http.get(`/service/auth/acl/${this.resourceType}/${this.resourceId}`)
      .then((result) => {
        this.rows = []
        this.isOwner = false
        this.actionsParam = null

        if (this.state.loggedInUser.hasPermissions(this.state.authPermissionsByName['RESOURCE_ADMIN'].permissions)) {  
          this.isOwner = true
          this.actionsParam = this.actions
        }
        result.data.resourcePermissions.forEach((access) => {
          const actor = this.systemActors[access.systemActorId]
          const name = (actor.type === 'group') ? actor.name : `${actor.firstName} ${actor.lastName}`
          this.rows.push({
            systemActorId: access.systemActorId,
            name: name,
            rolePermissions: access.rolePermissions
          })
          // check for user and group permissions 
          if (!this.isOwner 
              && (
                  this.state.loggedInUser.hasPermissions(this.state.authPermissionsByName['RESOURCE_ADMIN'].permissions, access.rolePermissions)
                  && (
                      access.systemActorId == this.state.loggedInUser.id || 
                      this.state.loggedInUser.groupIds.includes(access.systemActorId)
                     )
                  )
              ){
            this.isOwner = true
            this.actionsParam = this.actions
          }
          
        })
      })
      .catch((err) => console.error(err))
  }
  
  saveResourceAccess () {
    // server will check that there is still an owner
    var putBody = {
      'resourcePermissions': this.rows.map(row => {
        return {
          'systemActorId': row.systemActorId, 
          'rolePermissions': row.rolePermissions
        }
      })
    }
    return this.$http.put(`/service/auth/acl/${this.resourceType}/${this.resourceId}`, putBody)
  }

  $onDestroy () {
    this.unsubscribeRedux()
  }

  mapStateToThis (reduxState) {
    // console.log(JSON.stringify(getAllSystemActorsArray(reduxState)))
    return {
      systemActors: getAllSystemActors(reduxState),
      systemActorsArray: getAllSystemActorsArray(reduxState)
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
    }
  }
}

ResourcePermissionsEditorController.$inject = ['$http', '$timeout', '$ngRedux', 'state']

let resourcePermissionsEditor = {
  templateUrl: '/components/common/resource-permissions-editor.html',
  bindings: {
    resourceType: '@',
    resourceId: '@',
    enabled: '<',
    registerSaveAccessCallback: '&', // To be called to register a callback, which will save the access list
    onSelectionChanged: '&'
  },
  controller: ResourcePermissionsEditorController
}

export default resourcePermissionsEditor
