import LocationEditorController from './locationEditorController'

let locationEditor = {
  templateUrl: '/components/sidebar/view/location-editor-component.html',
  bindings: {
    mapGlobalObjectName: '@'
  },
  controller: LocationEditorController
}

export default locationEditor