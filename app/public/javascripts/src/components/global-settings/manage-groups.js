class ManageGroupsController {
  constructor ($http, $timeout, state) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
    this.groups = []
    this.loadGroups()
    this.initEmptyUserMessage()
    this.USER_MESSAGE_TIMEOUT = 5000 // Number of milliseconds a user message will be shown on the screen
  }

  initEmptyUserMessage () {
    this.userMessage = {
      show: false,
      type: '',
      text: ''
    }
  }

  loadGroups () {
    var userAdminPermissions = null
    this.$http.get('/service/auth/permissions')
      .then((result) => {
        // Get the permissions for the name USER_ADMIN
        userAdminPermissions = result.data.filter((item) => item.name === 'USER_ADMIN')[0].id
        return Promise.all([
          this.$http.get(`/service/auth/acl/SYSTEM/1`),
          this.$http.get('/service/auth/groups')
        ])
      })
      .then((result) => {
        var acls = result[0].data
        this.groups = result[1].data
        var groupIdToGroup = {}
        this.groups.forEach((group) => groupIdToGroup[group.id] = group)
        // For each group, we want to determine whether the "Administrator" flag should be set.
        // The "userAdminPermissions" is a bit flag. When set, then the system actor (user/group) is an administrator.
        acls.resourcePermissions.forEach((resourcePermission) => {
          const isAdministrator = (resourcePermission.rolePermissions & userAdminPermissions) > 0
          if (groupIdToGroup.hasOwnProperty(resourcePermission.systemActorId)) {
            groupIdToGroup[resourcePermission.systemActorId].isAdministrator = isAdministrator
          }
        })
      })
      .catch((err) => console.error(err))
  }

  addGroup () {
    // Create a group in aro-service and then add it to our groups list. This ensures we will have a valid group id.
    // Don't do anything with ACL as the default is a non-administrator group
    this.groups.forEach((group) => group.isEditing = false)
    this.$timeout()
    this.$http.post('/service/auth/groups', {
      name: `Group ${Math.round(Math.random() * 10000)}`, // Try to not have a duplicate group name
      description: 'Group Description'
    })
      .then((result) => {
        var group = result.data
        group.isEditing = true
        this.groups.push(group)
        this.$timeout()
      })
      .catch((err) => console.error(err))
  }

  saveGroup (group) {
    // First save the group name and description
    group.isEditing = false
    var userAdminPermissions = null
    this.$http.put('/service/auth/groups', {
      id: group.id,
      name: group.name,
      description: group.description
    })
      .then((result) => {
        return this.$http.get('/service/auth/permissions')
      })
      .then((result) => {
        // Get the permissions for the name USER_ADMIN
        userAdminPermissions = result.data.filter((item) => item.name === 'USER_ADMIN')[0].id
        return this.$http.get('/service/auth/acl/SYSTEM/1')
      })
      .then((result) => {
        var acls = result.data
        var groupIsInACLList = false
        acls.resourcePermissions.forEach((item, index) => {
          var resourcePermission = acls.resourcePermissions[index]
          if (resourcePermission.systemActorId === group.id) {
            // This resource permission is for the group being saved
            groupIsInACLList = true
            if (group.isAdministrator) {
              // Set the admin flag. https://stackoverflow.com/a/1436448
              resourcePermission.rolePermissions |= userAdminPermissions
            } else {
              // Remove the admin flag. https://stackoverflow.com/a/1436448
              resourcePermission.rolePermissions &= (~userAdminPermissions)
            }
          }
        })
        // In case the group is not in the ACL list at all, AND if the group is an administrator, add it to the list.
        if (!groupIsInACLList && group.isAdministrator) {
          acls.resourcePermissions.push({
            systemActorId: group.id,
            rolePermissions: userAdminPermissions
          })
        }
        // Our resource permissions may have been modifed. Save the whole lot.
        return this.$http.put(`/service/auth/acl/SYSTEM/1?userId=${this.state.loggedInUser.id}`, acls)
      })
      .then((result) => {
        this.userMessage = {
          show: true,
          type: 'success',
          text: 'Group saved successfully'
        }
        this.$timeout(() => this.initEmptyUserMessage(), this.USER_MESSAGE_TIMEOUT)
        this.loadGroups()
      })
      .catch((err) => {
        group.isEditing = false
        console.error(err)
      })
  }

  deleteGroup (group) {
    this.$http.delete(`/service/auth/groups/${group.id}`)
      .then((result) => {
        this.userMessage = {
          show: true,
          type: 'success',
          text: 'Group deleted successfully'
        }
        this.$timeout(() => this.initEmptyUserMessage(), this.USER_MESSAGE_TIMEOUT)
        this.loadGroups()
      })
      .catch((err) => console.error(err))
  }
}

ManageGroupsController.$inject = ['$http', '$timeout', 'state']

let manageGroups = {
  templateUrl: '/components/global-settings/manage-groups.html',
  bindings: {
    managerView: '='
  },
  controller: ManageGroupsController
}

export default manageGroups
