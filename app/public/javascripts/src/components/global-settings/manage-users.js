import MockService from './mockService'
class ManageUsersController {

  constructor($http, $timeout, state, globalSettingsService) {
    this.state = state
    this.globalSettingsService = globalSettingsService
    this.$http = $http
    this.userService = new MockService($http)
    this.users = []
    this.allGroups = []
    this.userService.get('/getAllGroups')
      .then((result) => {
        this.allGroups = result
        $timeout()
        return this.userService.get('/getAllUsers')
      })
      .then((result) => {
        var mapIdToGroup = {}
        this.allGroups.forEach((group) => mapIdToGroup[group.id] = group)
        this.users = result
        // For a user we will get the IDs of the groups that the user belongs to. Our control uses objects to bind to the model.
        // Just replace the groups array with actual group objects
        this.users.forEach((user, index) => {
          var selectedGroupObjects = []
          user.userGroups.forEach((userGroupId) => selectedGroupObjects.push(mapIdToGroup[userGroupId]))
          this.users[index].userGroups = selectedGroupObjects   // Make sure you modify the object and not a copy
        })
        $timeout()
      })
      .catch((err) => console.error(err))
    this.user_id = user_id
    this.userTypes = [
      {
        name: 'Admin',
        rol: 'admin'
      },
      {
        name: 'Biz-dev',
        rol: 'biz-dev'
      },
      {
        name: 'Sales',
        rol: 'sales'
      }
    ]
  }

  // $onInit() {
  //   this.loadUsers()
  // }

  // loadUsers() {
  //   this.$http.get('/admin/users')
  //     .then((response) => {
  //       this.users = response.data
  //       this.sortBy('first_name', false)
  //     })
  // }

  sortBy(key, descending) {
    this.users = _.sortBy(this.users, (user) => {
      return user[key] || ''
    })
    if (descending) {
      this.users = this.users.reverse()
    }
  }

  changeRol(user) {
    swal({
      title: 'Are you sure?',
      type: 'warning',
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Yes',
      showCancelButton: true,
      closeOnConfirm: true
    }, (confirmation) => {
      if (!confirmation) return this.loadUsers()
      this.$http.post('/admin/users/change_rol', { user: user.id, rol: user.rol }).then((response) => {
        this.loadUsers()
      })
    })
  }

  copyLink(user) {
    var input = $(`#resend-link-input-${user.id}`)
    input.select()
    var success = document.execCommand('copy')
    if (success) {
      var el = $(`#resend-link-button-${user.id}`)
      el.tooltip('show')
      el.one('hidden.bs.tooltip', () => {
        el.tooltip('destroy')
      })
    }
  }

  resendLink(user) {
    swal({
      title: 'Are you sure?',
      text: 'A new mail will be sent to this user',
      type: 'warning',
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Yes, send it!',
      showCancelButton: true,
      closeOnConfirm: true
    }, () => {
      this.$http.post('/admin/users/resend', { user: user.id }).then((response) => {
        this.loadUsers()
      })
    })
  }

  deleteUser(user) {
    swal({
      title: 'Are you sure?',
      text: 'You will not be able to recover the deleted user!',
      type: 'warning',
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Yes, delete it!',
      showCancelButton: true,
      closeOnConfirm: true
    }, () => {
      this.$http.post('/admin/users/delete', { user: user.id }).then((response) => {
        this.loadUsers()
      })
    })
  }

}

ManageUsersController.$inject = ['$http', '$timeout', 'state', 'globalSettingsService']

let manageUsers = {
  templateUrl: '/components/global-settings/manage-users.html',
  bindings: {
    managerView: '='
  },
  controller: ManageUsersController
}

export default manageUsers