
import { createSelector } from 'reselect'

const getAllSystemActors = reduxState => reduxState.user.systemActors
const getAllSystemActorsArray = createSelector([getAllSystemActors], systemActors => {
  var systemActorsArray = []
  Object.keys(systemActors).forEach(actorKey => systemActorsArray.push(systemActors[actorKey]))
  return systemActorsArray
})

class ResourcePermissionsEditorController {
  constructor ($http, $timeout, $ngRedux, state) {
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
    // this.systemActorsnew = [{id: 1, name: "Administrators", description: "Administrators can create, update and delete users in the system", deleted: false, type: "group"},
    // {id: 2, name: "SuperUsers", description: "Super users have full access to the system and all plans", deleted: false, type: "group"},
    // {id: 3, name: "Public", description: "Public users have read access to library items created during ETL", deleted: false, type: "group"},
    // {id: 4, firstName: "Admin", lastName: "User", type: "user"},
    // {id: 5, firstName: "Kumar", lastName: "nonadmin", type: "user"}]
    
    // this.actorsById = this.systemActors.reduce((map, item) => {
    //   map[item.id] = item
    //   return map
    // }, {})

    // this.systemActors.forEach(user => {
    //   alert(user.id);
    //   systemActors[user.id] = {
    //     id: user.id,
    //     firstName: user.firstName,
    //     lastName: user.lastName,
    //     type: 'user'
    //   }
    // })
    
    this.loadResourceAccess()
    this.registerSaveAccessCallback && this.registerSaveAccessCallback({ saveResourceAccess: this.saveResourceAccess.bind(this) })
  }
  
  addActor () {
    if (this.actorsById.hasOwnProperty(this.newActorId)){
      var newActor = this.actorsById[this.newActorId]
      this.rows.push({
        'systemActorId': newActor.id, 
        'name': newActor.name, 
        'rolePermissions': this.defaultPermissions
      })
      this.onSelectionChanged()
    }
  }
  
  removeActor (row) {
    this.rows = this.rows.filter(function(value, index, arr){
      return value != row;
    });
    this.onSelectionChanged()
  }

  
  loadResourceAccess () {
    return this.$http.get(`/service/auth/acl/${this.resourceType}/${this.resourceId}`)
      .then((result) => {
        this.rows = []
        this.isOwner = false
        this.actionsParam = null
        //if (!!(this.state.loggedInUser.systemPermissions & this.state.authPermissionsByName['RESOURCE_ADMIN'].permissions)){
          
        if ( this.state.loggedInUser.hasPermissions(this.state.authPermissionsByName['RESOURCE_ADMIN'].permissions) ){  
          this.isOwner = true
          this.actionsParam = this.actions
        }
        
        result.data.resourcePermissions.forEach((access) => {
          this.rows.push({
            'systemActorId': access.systemActorId, 
            'name': this.systemActors[access.systemActorId].name, 
            'rolePermissions': access.rolePermissions
          })
          // check for user and group permissions 
          if ( !this.isOwner 
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
    return {
      systemActors: getAllSystemActorsArray(reduxState)
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
