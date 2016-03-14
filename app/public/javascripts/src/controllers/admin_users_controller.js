/* global $ app user_id swal _ */
// Admin users controller
app.controller('admin_users_controller', ($scope, $http) => {
  $scope.users = []
  $scope.user_id = user_id
  $scope.new_user = {}

  $('#manage-users').on('shown.bs.modal', () => {
    $scope.load_users()
  })

  $scope.load_users = () => {
    $http.get('/admin/users')
      .success((response) => {
        $scope.users = response
      })
  }

  $scope.sort_by = (key, descending) => {
    $scope.users = _.sortBy($scope.users, (user) => {
      return user[key] || ''
    })
    if (descending) {
      $scope.users = $scope.users.reverse()
    }
  }

  $scope.open_new_user = () => {
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
        swal({ title: 'User registered', type: 'success' })
        $('#new-user').modal('hide')
        $('#manage-users').modal('show')
      })
  }

  $scope.delete_user = (user) => {
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
        $scope.load_users()
      })
    })
  }
})
