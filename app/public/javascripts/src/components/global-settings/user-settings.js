class UserSettingsController {

  constructor($http, state, globalSettingsService, Utils) {
    this.$http = $http
    this.state = state
    this.globalSettingsService = globalSettingsService
    this.utils = Utils
    this.searchSessionToken = this.utils.getInsecureV4UUID()

    this.userConfiguration = {}
    $http.get(`/service/auth/users/${state.loggedInUser.id}/configuration`)
      .then((result) => {
        this.userConfiguration = result.data
        this.initSearchBox()
      })
      .catch((err) => console.error(err))

    this.allProjectTemplates = []
    $http.get(`/service/v1/project-template?user_id=${state.loggedInUser.id}`)
      .then((result) => this.allProjectTemplates = result.data)
      .catch((err) => console.error(err))
  }

  initSearchBox() {
    var ids = 0
    var search = $('#set-default-location .select2')
    var self = this
    search.select2({
      placeholder: 'Set an address, city, state or CLLI code',
      initSelection: function (select, callback) {
        callback({"id": 0, "text": self.userConfiguration.defaultLocation})
      },
      ajax: {
        url: '/search/addresses',
        dataType: 'json',
        delay: 250,
        data: (term) => ({ text: term, sessionToken: this.searchSessionToken }),
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
    search.select2("val", this.userConfiguration.defaultLocation, true)
  }

  saveSettings() {
    this.$http.post(`/service/auth/users/${this.state.loggedInUser.id}/configuration`, this.userConfiguration)
  }
}

UserSettingsController.$inject = ['$http', 'state', 'globalSettingsService', 'Utils']

let userSettings = {
  templateUrl: '/components/global-settings/user-settings.html',
  controller: UserSettingsController
}

export default userSettings