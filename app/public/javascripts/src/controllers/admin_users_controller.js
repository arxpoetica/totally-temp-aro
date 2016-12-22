/* global $ app user_id swal _ */
// Admin users controller
app.controller('admin_users_controller', ($scope, $http, $timeout) => {
  $scope.users = []
  $scope.user_id = user_id
  $scope.new_user = {}
  $scope.mailSubject = ''
  $scope.mailBody = ''

  $('#manage-users').on('shown.bs.modal', () => {
    loadUsers()
  })

  function loadUsers () {
    $http.get('/admin/users')
      .success((response) => {
        $scope.users = response
      })
  }

  $scope.copyLink = (user) => {
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

  $scope.sortBy = (key, descending) => {
    $scope.users = _.sortBy($scope.users, (user) => {
      return user[key] || ''
    })
    if (descending) {
      $scope.users = $scope.users.reverse()
    }
  }

  $scope.openNewUser = () => {
    $('#manage-users').modal('hide')
    $('#new-user').modal('show')
  }

  $scope.register_user = () => {
    if ($scope.new_user.email !== $scope.new_user.email_confirm) {
      return swal({
        title: 'Error',
        text: 'Emails do not match',
        type: 'error'
      })
    }
    $http.post('/admin/users/register', $scope.new_user)
      .success((response) => {
        $scope.new_user = {}
        swal({ title: 'User registered', type: 'success' })
        $('#new-user').modal('hide')
        $('#manage-users').modal('show')
      })
  }

  $scope.resendLink = (user) => {
    swal({
      title: 'Are you sure?',
      text: 'A new mail will be sent to this user',
      type: 'warning',
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Yes, send it!',
      showCancelButton: true,
      closeOnConfirm: true
    }, () => {
      $http.post('/admin/users/resend', { user: user.id }).success((response) => {
        loadUsers()
      })
    })
  }

  $scope.deleteUser = (user) => {
    swal({
      title: 'Are you sure?',
      text: 'You will not be able to recover the deleted user!',
      type: 'warning',
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Yes, delete it!',
      showCancelButton: true,
      closeOnConfirm: true
    }, () => {
      $http.post('/admin/users/delete', { user: user.id }).success((response) => {
        loadUsers()
      })
    })
  }

  $scope.makeAdmin = (user) => {
    swal({
      title: 'Are you sure?',
      text: 'This user will have admin access after this action',
      type: 'warning',
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Yes',
      showCancelButton: true,
      closeOnConfirm: true
    }, () => {
      $http.post('/admin/users/make_admin', { user: user.id }).success((response) => {
        loadUsers()
      })
    })
  }

  $scope.downloadCSV = () => {
    window.location.href = '/admin/users/csv'
  }

  $scope.openSendMail = () => {
    $('#manage-users').modal('hide')
    $('#send-mail').modal('show')
  }

  $scope.sendMail = () => {
    $http.post('/admin/users/mail', { subject: $scope.mailSubject, text: $scope.mailBody })
      .success((response) => {
        swal({ title: 'Emails sent', type: 'success' })
        $('#send-mail').modal('hide')
        $('#manage-users').modal('show')
      })
  }
})
