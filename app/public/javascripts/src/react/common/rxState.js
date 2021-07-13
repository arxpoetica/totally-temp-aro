import { BehaviorSubject } from 'rxjs'
import reduxStore from '../../redux-store'

const state = reduxStore.getState()

const viewSettingsChangedSubject = new BehaviorSubject()
const requestMapLayerRefreshSubject = new BehaviorSubject()
const mapTileOptionsSubject = new BehaviorSubject(state.toolbar.heatmapOptions)
const requestSetMapCenterSubject = new BehaviorSubject(state.plan.defaultPlanCoordinates)
const requestSetMapZoomSubject = new BehaviorSubject(state.plan.defaultPlanCoordinates.zoom)

class rxState {
  constructor () {
    const service = {}

    service.viewSettingsChanged = {
      sendMessage: (message) => viewSettingsChangedSubject.next(message),
      getMessage: () => viewSettingsChangedSubject.asObservable()
    }

    service.requestMapLayerRefresh = {
      sendMessage: (message) => requestMapLayerRefreshSubject.next(message),
      getMessage: () => requestMapLayerRefreshSubject.asObservable()
    }

    service.mapTileOptions = {
      sendMessage: (message) => mapTileOptionsSubject.next(message),
      getMessage: () => mapTileOptionsSubject.asObservable()
    }

    service.requestSetMapCenter = {
      sendMessage: (message) => requestSetMapCenterSubject.next(message),
      getMessage: () => requestSetMapCenterSubject.asObservable()
    }

    service.requestSetMapZoom = {
      sendMessage: (message) => requestSetMapZoomSubject.next(message),
      getMessage: () => requestSetMapZoomSubject.asObservable()
    }

    return service
  }
}

export default rxState
