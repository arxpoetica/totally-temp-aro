import { Subject, BehaviorSubject } from 'rxjs';

var viewSetting = {
  selectedFiberOption: null,
  heatmapOptions: [
    {
      id: 'HEATMAP_ON',
      label: 'Aggregate heatmap'
    },
    {
      id: 'HEATMAP_DEBUG',
      label: 'Aggregate points'
    },
    {
      id: 'HEATMAP_OFF',
      label: 'Raw Points'
    }
  ]
}

var heatmapOptions = {
  showTileExtents: false,
  heatMap: {
    useAbsoluteMax: false,
    maxValue: 100,
    powerExponent: 0.5,
    worldMaxValue: 500000
  },
  selectedHeatmapOption: viewSetting.heatmapOptions[0] // 0, 2
}

const viewSettingsChangedSubject = new BehaviorSubject();
const requestMapLayerRefreshSubject = new BehaviorSubject();
const mapTileOptionsSubject = new BehaviorSubject(heatmapOptions);

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
