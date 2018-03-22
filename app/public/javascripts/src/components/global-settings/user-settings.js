class UserSettingsController {

  constructor(globalSettingsService) {
    this.globalSettingsService = globalSettingsService

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

}

UserSettingsController.$inject = ['globalSettingsService']

let userSettings = {
  templateUrl: '/components/global-settings/user-settings.html',
  controller: UserSettingsController
}

export default userSettings