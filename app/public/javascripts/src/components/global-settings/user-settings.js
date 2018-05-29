class UserSettingsController {

  constructor($http, state, globalSettingsService) {
    this.$http = $http
    this.state = state
    this.globalSettingsService = globalSettingsService

    this.userConfiguration = {}
    $http.get(`/service/auth/users/${state.loggedInUser.id}/configuration`)
      .then((result) => this.userConfiguration = result.data)
      .catch((err) => console.error(err))

    this.allProjectTemplates = []
    $http.get(`/service/v1/project-template?user_id=${state.loggedInUser.id}`)
      .then((result) => this.allProjectTemplates = result.data)
      .catch((err) => console.error(err))

    var default_location = this.globalSettingsService.user.default_location
    var ids = 0
    var search = $('#set-default-location .select2')
    search.select2({
      placeholder: 'Set an address, city, state or CLLI code',
      initSelection: function (select, callback) {
        callback({"id": 0, "text":default_location})
      },
      ajax: {
        url: '/search/addresses',
        dataType: 'json',
        delay: 250,
        data: (term) => ({ text: term }),
        results: (data, params) => {
          var items = data.map((location) => {
            return {
              id: 'id-' + (++ids),
              text: location.name,
              bounds: location.bounds,
              centroid: location.centroid
            }
          })
          this.search_results = items
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
        this.globalSettingsService.user.default_location = selected.text
      }
    })

    search.select2("val", default_location, true)
  }

  saveSettings() {
    this.globalSettingsService.saveLocation()
    this.$http.post(`/service/auth/users/${this.state.loggedInUser.id}/configuration`, this.userConfiguration)
  }
}

UserSettingsController.$inject = ['$http', 'state', 'globalSettingsService']

let userSettings = {
  templateUrl: '/components/global-settings/user-settings.html',
  controller: UserSettingsController
}

export default userSettings