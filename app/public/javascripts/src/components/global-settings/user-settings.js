class UserSettingsController {
  constructor ($http, $timeout, $ngRedux, state, Utils) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
    this.utils = Utils
    this.searchSessionToken = this.utils.getInsecureV4UUID()
    this.userConfiguration = {}
    this.allProjectTemplates = []

    this.perspectives = [
      {
        name: 'Admin',
        perspective: 'admin'
      },
      {
        name: 'Standard',
        perspective: 'standard'
      },
      {
        name: 'Biz-dev',
        perspective: 'biz-dev'
      },
      {
        name: 'Sales Engineers',
        perspective: 'sales_engineer'
      },
      {
        name: 'Account Executive',
        perspective: 'account_exec'
      }
    ]

    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)
  }

  $onInit () {
    this.userConfiguration = {}
    this.$http.get(`/service/auth/users/${this.userId}/configuration`)
      .then((result) => {
        this.userConfiguration = result.data
        this.initSearchBox()
        this.$timeout()
      })
      .catch((err) => console.error(err))

      const filter = `deleted eq false and userId eq ${this.userId}`
      // const RESOUSRCE_READ = 4
      this.$http.get(`/service/odata/userprojectentity?$select=id,name,permissions&$filter=${filter}&$orderby=name&$top=10000`)
        .then((result) => {
          let myProjects = []
  
          // loop through the project and find check the permission bits to see
          // if the current user has READ and ADMIN privilage to manage the resource
          for(let i = 0; i < result.data.length; i++) {
            const permissions = result.data[i].permissions
            const hasView = Boolean(permissions & this.authPermissions.RESOURCE_READ.permissionBits)
            if(hasView) {
              delete result.data[i].permissions
              myProjects.push(result.data[i])
            }
          }
            
          this.allProjectTemplates = myProjects
        })
        .catch((err) => console.error(err))
  }

  initSearchBox () {
    var ids = 0
    var search = $('#set-default-location .select2')
    var self = this
    search.select2({
      placeholder: 'Set an address, city, state or CLLI code',
      initSelection: function (select, callback) {
        callback({ 'id': 0, 'text': self.userConfiguration.defaultLocation })
      },
      ajax: {
        url: '/search/addresses',
        dataType: 'json',
        quietMillis: 250, // *** In newer versions of select2, this is called 'delay'. Remember this when upgrading select2
        data: (term) => ({
          text: term,
          sessionToken: this.searchSessionToken,
          biasLatitude: this.state.defaultPlanCoordinates.latitude,
          biasLongitude: this.state.defaultPlanCoordinates.longitude
        }),
        results: (data, params) => {
          var items = data.map((location) => {
            return {
              id: 'id-' + (++ids),
              text: location.displayText,
              type: location.type,
              value: location.value
            }
          })
          if (items.length === 0) {
            items.push({
              id: 'id-' + (++ids),
              text: 'Search an address, city, or state',
              type: 'placeholder'
            })
          }
          return {
            results: items,
            pagination: {
              more: false
            }
          }
        },
        cache: true
      }
    }).on('change', (e) => {
      var selected = e.added
      if (selected) {
        this.searchSessionToken = this.utils.getInsecureV4UUID()
        this.userConfiguration.defaultLocation = selected.text
      }
    })
    search.select2('val', this.userConfiguration.defaultLocation, true)
  }

  saveSettings () {
    this.$http.post(`/service/auth/users/${this.userId}/configuration`, this.userConfiguration)
    // The perspective may have changed. Reload it if we are the currently logged in user
    if (this.userId === this.state.loggedInUser.id) {
      this.state.configuration.loadPerspective(this.userConfiguration.perspective)
      this.state.loggedInUser.perspective = this.userConfiguration.perspective
      this.state.reloadLocationTypes()
      this.$timeout()
    }
  }

  mapStateToThis (reduxState) {
    return {
      authPermissions: reduxState.user.authPermissions,
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
    }
  }
}

UserSettingsController.$inject = ['$http', '$timeout', '$ngRedux', 'state', 'Utils']

let userSettings = {
  templateUrl: '/components/global-settings/user-settings.html',
  bindings: {
    userId: '<'
  },
  controller: UserSettingsController
}

export default userSettings
