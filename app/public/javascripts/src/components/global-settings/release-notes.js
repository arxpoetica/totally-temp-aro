var marked = require('marked')

class ReleaseNotesController {
  constructor ($element, $http, $timeout, globalSettingsService) {
    this.$element = $element
    this.$http = $http
    this.$timeout = $timeout
    this.globalSettingsService = globalSettingsService

    this.releaseVersion = null
    this.versionToNameInfo = []
    this.markedOptions = {
      'baseUrl': null,
      'breaks': false,
      'gfm': true,
      'headerIds': true,
      'headerPrefix': '',
      'highlight': null,
      'langPrefix': 'language-',
      'mangle': true,
      'pedantic': false,
      'sanitize': false,
      'sanitizer': null,
      'silent': false,
      'smartLists': false,
      'smartypants': false,
      'tables': true,
      'xhtml': false
    }
  }

  onClickVersion (id) {
    this.$http.get(`/reports/releaseNotes/${id}`)
      .then((result) => {
        this.globalSettingsService.currentReleaseNotesView = this.globalSettingsService.ReleaseNotesView.Description

        this.releaseVersion = result.data.version
        this.$element.find('#releaseNotes')[0].innerHTML = marked(result.data.description, this.markedOptions)
        this.$timeout()
      })
  }

  $onInit () {
    this.$http.get(`/reports/releaseNotes`)
      .then((result) => {
        result.data.forEach((notes) => {
        // var versionTable = this.$element.find("#versionTable")[0]
        // var row = versionTable.insertRow(0)
        // var column1 = row.insertCell(0);
        // var column2 = row.insertCell(1);
        // column1.innerHTML = notes.version;
        // column2.innerHTML = marked(notes.name,this.markedOptions);

          this.versionToNameInfo.push({ 'id': notes.id, 'version': notes.version, 'name': marked(notes.name, this.markedOptions) })
        })
      })
  }
}

ReleaseNotesController.$inject = ['$element', '$http', '$timeout', 'globalSettingsService']

let releaseNotes = {
  templateUrl: '/components/global-settings/release-notes.html',
  bindings: {
    releaseNotesView: '='
  },
  controller: ReleaseNotesController
}

export default releaseNotes
