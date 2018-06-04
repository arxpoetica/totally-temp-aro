class ManageUsersController {

  constructor($http, $timeout, state, globalSettingsService) {
    this.state = state
    this.globalSettingsService = globalSettingsService
    this.$http = $http
    this.$timeout = $timeout
    this.allUsers = []
    this.filteredUsers = []
    this.isLoadingUsers = false
    this.allGroups = []
    this.mapIdToGroup = {}
    this.searchText = ''
    this.searchPromise = null
    this.pagination = {
      itemsPerPage: 8,
      currentPage: 1,
      allPages: [1],
      visiblePages: [1]
    }
    $http.get('/admin/users/count')
      .then((result) => {
        this.recalculatePagination(result.data[0].count)
        this.pagination.currentPage = 1
        this.recalculateVisiblePages()
        this.$timeout()
      })
    this.$http.get('/service/auth/groups')
      .then((result) => {
        this.allGroups = result.data
        result.data.forEach((group) => this.mapIdToGroup[group.id] = group)
        this.loadUsers()
        $timeout()
      })
    this.userTypes = [
      {
        name: 'Admin',
        rol: 'admin'
      },
      {
        name: 'Standard',
        rol: 'standard'
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
    this.initializeNewUser()
  }

  recalculatePagination(maxNumberOfItems) {
    this.pagination.allPages = []
    const numPages = Math.floor(maxNumberOfItems / this.pagination.itemsPerPage) + 1
    for (var iPage = 0; iPage < numPages; ++iPage) {
      this.pagination.allPages.push(iPage + 1)
    }
  }

  recalculateVisiblePages() {
    const NUM_VISIBLE_PAGES_BY2 = 3
    const visiblePageStart = Math.max(0, this.pagination.currentPage - NUM_VISIBLE_PAGES_BY2)
    const visiblePageEnd = 1 + Math.min(this.pagination.allPages.length - 1, this.pagination.currentPage + NUM_VISIBLE_PAGES_BY2 - 2)
    this.pagination.visiblePages = this.pagination.allPages.slice(visiblePageStart, visiblePageEnd)
    this.$timeout()
  }

  selectPage(newPageNumber) {
    if (this.pagination.allPages.indexOf(newPageNumber) < 0) {
      console.error(`Page ${newPageNumber} selected, but this page does not exist in our list`)
      return
    }
    this.pagination.currentPage = newPageNumber
    this.filterUsers(false)
    this.recalculateVisiblePages()
  }

  selectPreviousPage() {
    const currentIndex = this.pagination.allPages.indexOf(this.pagination.currentPage)
    if (currentIndex > 0) {
      this.selectPage(this.pagination.allPages[currentIndex - 1])
    }
  }

  selectNextPage() {
    const currentIndex = this.pagination.allPages.indexOf(this.pagination.currentPage)
    if (currentIndex < this.pagination.allPages.length - 1) {
      this.selectPage(this.pagination.allPages[currentIndex + 1])
    }    
  }

  filterUsers(repaginate) {
    this.filteredUsers = []
    if (this.searchText === '') {
      this.filteredUsers = this.allUsers
    } else {
      // For now do search in a crude way. Will get this from the ODATA endpoint later
      this.allUsers.forEach((user) => {
        if (JSON.stringify(user).indexOf(this.searchText) >= 0) {
          this.filteredUsers.push(user)
        }
      })
    }
    if (repaginate) {
      this.recalculatePagination(this.filteredUsers.length)
      this.pagination.currentPage = 1
      this.recalculateVisiblePages()
    }
    const startIndex = (this.pagination.currentPage - 1) * this.pagination.itemsPerPage
    this.filteredUsers = this.filteredUsers.slice(startIndex, startIndex + this.pagination.itemsPerPage)
    this.$timeout()
  }

  onSearchKeyUp(event) {
    const SEARCH_DELAY = 500  // milliseconds. Delay before we fire a search request on the server
    if (this.searchPromise) {
      // We have already scheduled a search (from the previous keystroke). Cancel it.
      this.$timeout.cancel(this.searchPromise)
      this.searchPromise = null
    }
    this.searchPromise = this.$timeout(() => this.filterUsers(true), SEARCH_DELAY)
  }

  loadUsers() {
    this.isLoadingUsers = true
    this.$timeout()
    this.$http.get('/service/auth/users')
      .then((result) => {
        this.isLoadingUsers = false
        this.allUsers = result.data
        // For a user we will get the IDs of the groups that the user belongs to. Our control uses objects to bind to the model.
        // Remove the group ids property and replace it with group objects
        this.allUsers.forEach((user, index) => {
          var selectedGroupObjects = []
          user.groupIds.forEach((userGroupId) => selectedGroupObjects.push(this.mapIdToGroup[userGroupId]))
          this.allUsers[index].userGroups = selectedGroupObjects   // Make sure you modify the object and not a copy
          delete this.allUsers[index].groupIds
        })
        this.filterUsers(true)
      })
    .catch((err) => console.error(err))
  }

  initializeNewUser() {
    this.newUser = {
      firstName: '',
      lastName: '',
      email: '',
      confirmEmail: '',
      companyName: '',
      rol: this.userTypes[0].rol,
      groups: []
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

  // Save any modifications made to the filtered users
  saveUsers() {
    this.filteredUsers.forEach((user, index) => {
      // aro-service requires group ids in the user objects. replace group objects by group ids
      var serviceUser = angular.copy(user)
      serviceUser.groupIds = []
      serviceUser.userGroups.forEach((userGroup) => serviceUser.groupIds.push(userGroup.id))
      delete serviceUser.userGroups
      // Save the user to aro-service
      this.$http.put('/service/auth/users', serviceUser)
        .catch((err) => console.error(err))
    })
  }

  registerUser() {
    if (this.newUser.email !== this.newUser.confirmEmail) {
      return swal({
        title: 'Error',
        text: 'Emails do not match',
        type: 'error'
      })
    }
    var serviceUser = angular.copy(this.newUser)
    serviceUser.groupIds = []
    this.newUser.groups.forEach((group) => serviceUser.groupIds.push(group.id))


    this.$http.post('/admin/users/register', this.newUser)
      .then((response) => {
        swal({ title: 'User registered', type: 'success' })
      })
      .catch((err) => console.error(err))
    this.initializeNewUser()
    this.loadUsers()
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