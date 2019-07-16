class StateViewMode {
  // Function to convert from hsv to rgb color values.
  // https://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately
  static hsvToRgb (h, s, v) {
    var r, g, b, i, f, p, q, t
    i = Math.floor(h * 6)
    f = h * 6 - i
    p = v * (1 - s)
    q = v * (1 - f * s)
    t = v * (1 - (1 - f) * s)
    switch (i % 6) {
      case 0: r = v, g = t, b = p; break
      case 1: r = q, g = v, b = p; break
      case 2: r = p, g = v, b = t; break
      case 3: r = p, g = q, b = v; break
      case 4: r = t, g = p, b = v; break
      case 5: r = v, g = p, b = q; break
    }
    var rgb = [r, g, b]
    var color = '#'
    rgb.forEach((colorValue) => {
      var colorValueHex = Math.round(colorValue * 255).toString(16)
      if (colorValueHex.length === 1) {
        colorValueHex = '0' + colorValueHex
      }
      color += colorValueHex
    })
    return color
  }

  // view mode click action
  static allowViewModeClickAction (state) {
    return (state.selectedDisplayMode.getValue() === state.displayModes.VIEW || state.selectedDisplayMode.getValue() === state.displayModes.EDIT_PLAN) &&
      state.activeViewModePanel !== state.viewModePanels.EDIT_LOCATIONS && // location edit shouldn't perform other action
      state.activeViewModePanel !== state.viewModePanels.EDIT_SERVICE_LAYER &&
      !state.isRulerEnabled // ruler mode click should not enable other  view action
  }

  // Plan search - tags
  static loadListOfPlanTags ($http, state) {
    var promises = [
      $http.get(`/service/tag-mapping/global-tags`)
    ]

    return Promise.all(promises)
      .then((results) => {
        state.listOfTags = results[0].data
      })
  }

  static loadListOfSAPlanTags ($http, state, dataItems, filterObj, ishardreload) {
    const MAX_SERVICE_AREAS_FROM_ODATA = 10
    // var filter = "layer/id eq 1"
    var libraryItems = []
    var filter = ''

    var selectedServiceLayerLibraries = dataItems && dataItems.service_layer && dataItems.service_layer.selectedLibraryItems
    if (selectedServiceLayerLibraries) libraryItems = selectedServiceLayerLibraries.map(selectedLibraryItem => selectedLibraryItem.name)
    if (libraryItems.length > 0) {
      // Filter using selected serviceLayer id
      var layerfilter = libraryItems.map(libraryName => `layer/id eq ${state.nameToServiceLayers[libraryName].id}`).join(' or ')
      filter = filter ? filter.concat(` and (${layerfilter})`) : `${layerfilter}`
    }

    filter = filterObj ? filter.concat(` and (substringof(code,'${filterObj}') or substringof(name,'${filterObj}'))`) : filter
    if (ishardreload) { state.listOfServiceAreaTags = [] }
    if (filterObj || state.listOfServiceAreaTags.length == 0) {
      $http.get(`/service/odata/ServiceAreaView?$select=id,code,name&$filter=${filter}&$orderby=id&$top=${MAX_SERVICE_AREAS_FROM_ODATA}`)
        .then((results) => {
          state.listOfServiceAreaTags = StateViewMode.removeDuplicates(state.listOfServiceAreaTags.concat(results.data), 'id')
        })
    }
  }

  static loadListOfSAPlanTagsById ($http, state, promises) {
    if (promises) {
      return Promise.all(promises)
        .then((results) => {
          results.forEach((result) => {
            // result.data.forEach((serviceArea) => state.listOfServiceAreaTags = StateViewMode.removeDuplicates(state.listOfServiceAreaTags.concat(results.data), 'id'))
            state.listOfServiceAreaTags = StateViewMode.removeDuplicates(state.listOfServiceAreaTags.concat(result.data), 'id')
          })
          return state.listOfServiceAreaTags
        })
        .catch((err) => console.error(err))
    }
  }

  static removeDuplicates (myArr, prop) {
    return myArr.filter((obj, pos, arr) => {
      return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos
    })
  }

  static getTagColour (tag) {
    return StateViewMode.hsvToRgb(tag.colourHue, config.hsv_defaults.saturation, config.hsv_defaults.value)
  }

  // View mode search
  static getSelectedEquipmentIds (flattenDeep, networkNodeTypes, configuration) {
    var selectedEquipmentIds = []
    var categoryItems = configuration.networkEquipment.equipments
    Object.keys(categoryItems).forEach((categoryItemKey) => {
      var networkEquipment = categoryItems[categoryItemKey]
      networkEquipment.checked &&
        selectedEquipmentIds.push(networkNodeTypes
          .filter(equipmentEntity => equipmentEntity.name === networkEquipment.networkNodeType)
          .map(equ => equ.id)
        )
    })
    return flattenDeep(selectedEquipmentIds)
  }

  static loadBoundaryEntityList ($http, state, dataItems, filterObj) {
    if (filterObj == '') return
    if (state.selectedBoundaryTypeforSearch) {
      var visibleBoundaryLayer = state.selectedBoundaryTypeforSearch

      visibleBoundaryLayer.type === 'census_blocks' && StateViewMode.loadEntityList($http, state, dataItems, 'CensusBlocksEntity', filterObj, 'id,tabblockId', 'tabblockId')
      visibleBoundaryLayer.type === 'wirecenter' && StateViewMode.loadEntityList($http, state, dataItems, 'ServiceAreaView', filterObj, 'id,code,name,centroid', 'code,name')
      visibleBoundaryLayer.type === 'analysis_layer' && StateViewMode.loadEntityList($http, state, dataItems, 'AnalysisArea', filterObj, 'id,code,centroid', 'code')
    }
  }

  static loadEntityList ($http, state, dataItems, entityType, filterObj, select, searchColumn, configuration) {
    if (filterObj == '') return
    var entityListUrl = `/service/odata/${entityType}?$select=${select}`
    if (entityType !== 'AnalysisLayer') {
      entityListUrl = entityListUrl + '&$top=20'
    }

    var filter = ''
    if (entityType === 'LocationObjectEntity') {
      // for UUID odata doesn't support substring
      var pattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
      if (pattern.test(filterObj)) {
        filter = filterObj ? `${searchColumn} eq guid'${filterObj}'` : filter
      } else {
        return // 157501341: Location search should not reach out to endpoint without supplying a valid object id
      }
    } else {
      if (filterObj) {
        var columns = searchColumn.split(',')
        if (columns.length === 1) {
          if (searchColumn === 'id') {
            filter = `${searchColumn} eq ${filterObj}`
          } else if (searchColumn === 'clli') {
            filter = `substringof(${searchColumn},'${filterObj}')`
          } else {
            filter = `${searchColumn} eq '${filterObj}'`
          }
        } else {
          var colFilter = columns.map(col => `substringof(${col},'${filterObj}')`).join(' or ')
          filter = `(${colFilter})`
        }
      }
    }

    var libraryItems = []
    if (entityType === 'LocationObjectEntity') {
      var selectedLocationLibraries = dataItems && dataItems.location && dataItems.location.selectedLibraryItems
      if (selectedLocationLibraries) libraryItems = selectedLocationLibraries.map(selectedLibraryItem => selectedLibraryItem.identifier)
      if (libraryItems.length > 0) {
        var libfilter = libraryItems.map(id => `libraryId eq ${id}`).join(' or ')
        filter = filter ? filter.concat(` and (${libfilter})`) : `${libfilter}`
        // filter = filter ? filter.concat(` and libraryId eq ${libraryItems.toString()}`) : `libraryId eq ${libraryItems.toString()}`
      }
    }

    if (entityType === 'NetworkEquipmentEntity') {
      // Filtering NetworkEquipmentEntity by planId so as to fetch latest equipment info
      filter = filter ? filter.concat(` and (planId eq ${state.plan.id})`) : filter
      var selectedEquipments = StateViewMode.getSelectedEquipmentIds(state.flattenDeep, state.networkNodeTypes, configuration).map(id => `networkNodeType eq ${id}`).join(' or ')
      // Search for equipments that are selected in NetworkEquipment modal
      if (selectedEquipments == '') return
      filter = selectedEquipments ? filter.concat(` and (${selectedEquipments})`) : filter
      filter = filter.concat(` and (isDeleted eq false)`) // filter deleted equipment
    }

    if (entityType === 'ServiceAreaView') {
      // filter = filter ? filter.concat(' and layer/id eq 1') : filter
      var selectedServiceLayerLibraries = dataItems && dataItems.service_layer && dataItems.service_layer.selectedLibraryItems
      if (selectedServiceLayerLibraries) libraryItems = selectedServiceLayerLibraries.map(selectedLibraryItem => selectedLibraryItem.name)
      if (libraryItems.length > 0) {
        // Filter using selected serviceLayer id
        var layerfilter = libraryItems.map(libraryName => `layer/id eq ${state.nameToServiceLayers[libraryName].id}`).join(' or ')
        filter = filter ? filter.concat(` and (${layerfilter})`) : `${layerfilter}`
      }
    }

    entityListUrl = filter ? entityListUrl.concat(`&$filter=${encodeURIComponent(filter)}`) : entityListUrl

    return $http.get(entityListUrl)
      .then((results) => {
        state.entityTypeList[entityType] = results.data
        if (entityType === 'ServiceAreaView' || entityType === 'CensusBlocksEntity' ||
        entityType === 'AnalysisArea') {
          state.entityTypeBoundaryList = state.entityTypeList[entityType]
        }
        return results.data
      })
  }
}

export default StateViewMode
