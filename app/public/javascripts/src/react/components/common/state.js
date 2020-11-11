class State {
  constructor () {

    var Rx = require('rxjs')

    var service = {}

     // View Settings layer - define once
     service.viewSetting = {
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

    service.viewFiberOptions = [
      {
        id: 1,
        name: 'Uniform width'
      },
      {
        id: 2,
        name: 'Fiber Strand Count',
        field: 'fiber_strands',
        multiplier: 2.1,
        pixelWidth: {
          min: 2,
          max: 12,
          divisor: 1 / 3
        },
        opacity: {
          min: 0.66,
          max: 1
        }
      },
      {
        id: 3,
        name: 'Atomic Unit Demand',
        field: 'atomic_units',
        multiplier: 1,
        pixelWidth: {
          min: 2,
          max: 12,
          divisor: 1 / 3,
          atomicDivisor: 50
        },
        opacity: {
          min: 0.66,
          max: 1
        }
      }
    ]

    service.mapLayers = new Rx.BehaviorSubject({})
    var heatmapOptions = {
      showTileExtents: false,
      heatMap: {
        useAbsoluteMax: false,
        maxValue: 100,
        powerExponent: 0.5,
        worldMaxValue: 500000
      },
      selectedHeatmapOption: service.viewSetting.heatmapOptions[0]
    }
    service.mapTileOptions = new Rx.BehaviorSubject(heatmapOptions)
    service.requestMapLayerRefresh = new Rx.BehaviorSubject({})
    service.viewSettingsChanged = new Rx.BehaviorSubject()

    service.expertModeTypes = {
      OPTIMIZATION_SETTINGS: { id: 'OPTIMIZATION_SETTINGS', label: 'Optimization Settings' },
      MANUAL_PLAN_TARGET_ENTRY: { id: 'MANUAL_PLAN_TARGET_ENTRY', label: 'Manual plan Target Selection', isQueryValid: false },
      MANUAL_PLAN_SA_ENTRY: { id: 'MANUAL_PLAN_SA_ENTRY', label: 'Manual Plan Service Area Selection', isQueryValid: false }
    }

    service.expertMode = {
      OPTIMIZATION_SETTINGS: null,
      MANUAL_PLAN_TARGET_ENTRY: null,
      MANUAL_PLAN_SA_ENTRY: null
    }

    return service
  }
}

export default State
