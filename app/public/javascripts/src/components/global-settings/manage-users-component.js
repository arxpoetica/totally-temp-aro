class ManageUsersController {

  constructor($http, state) {
    this.state = state
    this.$http = $http
    this.users = []
    this.user_id = user_id
    this.new_user = {}
    this.mailSubject = ''
    this.mailBody = ''
    this.userTypes = [
      {
        name: 'Admin',
        rol: 'admin'
      },
      {
        name: 'Biz-dev',
        rol: 'biz-dev'
      }
    ]
    this.ManageUserViews = Object.freeze({
      Users: 0,
      Send_Email: 1,
      Register_User: 2
    })
    this.currentManageUserView = this.ManageUserViews.Users
  }

  $onInit() {
    this.loadUsers()
  }

  loadUsers() {
    this.$http.get('/admin/users')
      .then((response) => {
        this.users = response.data
        this.sortBy('first_name', false)
      })
  }

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

  openUserView() {
    this.currentManageUserView = this.ManageUserViews.Users
  }

  openNewUserView() {
    this.currentManageUserView = this.ManageUserViews.Register_User
  }

  openSendMailView() {
    this.currentManageUserView = this.ManageUserViews.Send_Email
  }

  sendMail() {
    this.$http.post('/admin/users/mail', { subject: this.mailSubject, text: this.mailBody })
      .then((response) => {
        swal({ title: 'Emails sent', type: 'success' })
        this.openUserView()
      })
  }

  register_user() {
    if (this.new_user.email !== this.new_user.email_confirm) {
      return swal({
        title: 'Error',
        text: 'Emails do not match',
        type: 'error'
      })
    }
    this.$http.post('/admin/users/register', this.new_user)
      .then((response) => {
        this.new_user = {}
        swal({ title: 'User registered', type: 'success' })
        this.openUserView()
      })
  }

}

ManageUsersController.$inject = ['$http', 'state']

app.component('manageUsers', {
  templateUrl: '/components/global-settings/manage-users-component.html',
  bindings: {
    toggleView: '&'
  },
  controller: ManageUsersController
})

