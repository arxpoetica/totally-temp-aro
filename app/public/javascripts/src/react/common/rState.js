import { Subject, BehaviorSubject } from 'rxjs';

const viewSettingsChangedSubject = new BehaviorSubject();
const requestMapLayerRefreshSubject = new BehaviorSubject();
const mapTileOptionsSubject = new BehaviorSubject();

class rState {

  constructor () {
    var service = {}

    service.viewSettingsChanged = {
      sendMessage: message => viewSettingsChangedSubject.next(message),
      getMessage: () => viewSettingsChangedSubject.asObservable()
    }

    service.requestMapLayerRefresh = {
      sendMessage: message => requestMapLayerRefreshSubject.next(message),
      getMessage: () => requestMapLayerRefreshSubject.asObservable()
    }

    service.mapTileOptions = {
      sendMessage: message => mapTileOptionsSubject.next(message),
      getMessage: () => mapTileOptionsSubject.asObservable()
    }

    return service

  }

}

export default rState;
