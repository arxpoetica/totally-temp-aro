var marked = require('marked')
var showdown  = require('showdown') 

class ReleaseNotesController {

  constructor($element, $http, globalSettingsService) {
    this.$element = $element
    this.$http = $http
    this.globalSettingsService = globalSettingsService

    this.markedOptions = {
      "baseUrl": null,
      "breaks": false,
      "gfm": true,
      "headerIds": true,
      "headerPrefix": "",
      "highlight": null,
      "langPrefix": "language-",
      "mangle": true,
      "pedantic": false,
      "sanitize": false,
      "sanitizer": null,
      "silent": false,
      "smartLists": false,
      "smartypants": false,
      "tables": true,
      "xhtml": false
     }
  }
  
  $onInit() {
    this.$http.get(`/reports/releaseNotes`)
    .then((result) => {
      //this.$element.find("#releaseNotes")[0].innerHTML = marked(result.data[0].release_notes,this.markedOptions)
      var converter = new showdown.Converter()
      var html = converter.makeHtml(result.data[0].release_notes);
      this.$element.find("#releaseNotes")[0].innerHTML = html
    })
  }
}

ReleaseNotesController.$inject = ['$element', '$http', 'globalSettingsService']

let releaseNotes = {
  templateUrl: '/components/global-settings/release-notes.html',
  controller: ReleaseNotesController
}

export default releaseNotes