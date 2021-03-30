import { BehaviorSubject } from 'rxjs';

const viewSetting = {
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

const heatmapOptions = {
  showTileExtents: false,
  heatMap: {
    useAbsoluteMax: false,
    maxValue: 100,
    powerExponent: 0.5,
    worldMaxValue: 500000
  },
  selectedHeatmapOption: viewSetting.heatmapOptions[0] // 0, 2
}

const defaultPlanCoordinates = {
  zoom: 14,
  latitude: 47.6062, // Seattle, WA by default. For no particular reason.
  longitude: -122.3321, // Seattle, WA by default. For no particular reason.
  areaName: 'Seattle, WA' // Seattle, WA by default. For no particular reason.
}

const viewSettingsChangedSubject = new BehaviorSubject();
const requestMapLayerRefreshSubject = new BehaviorSubject();
const mapTileOptionsSubject = new BehaviorSubject(heatmapOptions);
const requestSetMapCenterSubject = new BehaviorSubject(defaultPlanCoordinates);
const requestSetMapZoomSubject = new BehaviorSubject(defaultPlanCoordinates.zoom);

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

export default rxState;
