class UserSettingsController {
  constructor ($http, $timeout, state, Utils) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
    this.utils = Utils
    this.searchSessionToken = this.utils.getInsecureV4UUID()

    this.userConfiguration = {}
    this.allProjectTemplates = []
    $http.get(`/service/v1/project-template?user_id=${state.loggedInUser.id}`)
      .then((result) => this.allProjectTemplates = result.data)
      .catch((err) => console.error(err))

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
}

UserSettingsController.$inject = ['$http', '$timeout', 'state', 'Utils']

let userSettings = {
  templateUrl: '/components/global-settings/user-settings.html',
  bindings: {
    userId: '<'
  },
  controller: UserSettingsController
}

export default userSettings
