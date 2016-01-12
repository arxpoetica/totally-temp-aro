// Admin users controller
app.controller('admin_users_controller', function($scope, $http) {
  $scope.users = [];
  $scope.user_id = user_id;
  $scope.new_user = {};

  $('#manage-users').on('shown.bs.modal', function() {
    $scope.load_users();
  });

  $scope.load_users = function() {
    $http.get('/admin/users')
      .success(function(response) {
        $scope.users = response;
      });
  }

  $scope.sort_by = function(key, descending) {
    $scope.users = _.sortBy($scope.users, function(user) {
      return user[key] || '';
    });
    if (descending) {
      $scope.users = $scope.users.reverse();
    }
  };

  $scope.open_new_user = function() {
    $('#manage-users').modal('hide');
    $('#new-user').modal('show');
  };

  $scope.register_user = function() {
    if ($scope.new_user.email !== $scope.new_user.email_confirm) {
      return swal({
        title: 'Error',
        text: 'Emails do not match',
        type: 'error'
      });
    }
    $http.post('/admin/users/register', $scope.new_user)
      .success(function(response) {
        swal({ title:'User registered', type:'success' });
        $('#new-user').modal('hide');
        $('#manage-users').modal('show');
      });
  };

  $scope.delete_user = function(user) {
    swal({
      title: "Are you sure?",
      text: "You will not be able to recover the deleted user!",
      type: "warning",
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, delete it!",
      showCancelButton: true,
      closeOnConfirm: true,
    }, function() {
      $http.post('/admin/users/delete', { user: user.id }).success(function(response) {
        $scope.load_users();
      });
    });

  };

});
