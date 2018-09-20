class StateViewMode {

  // Function to convert from hsv to rgb color values.
  // https://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately
  static hsvToRgb(h, s, v) {
    var r, g, b, i, f, p, q, t;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
      case 0: r = v, g = t, b = p; break;
      case 1: r = q, g = v, b = p; break;
      case 2: r = p, g = v, b = t; break;
      case 3: r = p, g = q, b = v; break;
      case 4: r = t, g = p, b = v; break;
      case 5: r = v, g = p, b = q; break;
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

  //view mode click action
  static allowViewModeClickAction(state) {
    return (state.selectedDisplayMode.getValue() === state.displayModes.VIEW || state.selectedDisplayMode.getValue() === state.displayModes.EDIT_PLAN) &&
      state.activeViewModePanel !== state.viewModePanels.EDIT_LOCATIONS && //location edit shouldn't perform other action
      !state.isRulerEnabled //ruler mode click should not enable other  view action
  }

  //Plan search - tags
  static loadListOfPlanTags($http, state) {
    var promises = [
      $http.get(`/service/tag-mapping/tags`)
    ]

    return Promise.all(promises)
      .then((results) => {
        state.listOfTags = results[0].data
      })
  }

  static loadListOfCreatorTags($http, state, filterObj) {
    if (filterObj == '') return
    var filter = ""
    filter = filterObj ? filter.concat(` substringof(fullName,'${filterObj}')`) : filter
    if (filterObj || state.listOfCreatorTags.length == 0) {
      $http.get(`/service/odata/UserEntity?$select=id,fullName&$filter=${filter}&$orderby=id&$top=10`)
        .then((results) => {
          state.listOfCreatorTags = StateViewMode.removeDuplicates(state.listOfCreatorTags.concat(results.data), 'id')
        })
    }
  }

  static loadListOfCreatorTagsById($http, state, filterExp) {
    if (filterExp) {
      // Our $top is high, and should never be hit as we are getting createdBy for plans that are visible in "search plans"
      return $http.get(`/service/odata/UserEntity?$select=id,fullName&$filter=${filterExp}&$orderby=id&$top=10000`)
        .then((results) => {
          return state.listOfCreatorTags = StateViewMode.removeDuplicates(state.listOfCreatorTags.concat(results.data), 'id')
        })
    }
  }

  static loadListOfSAPlanTags($http, state, filterObj) {
    const MAX_SERVICE_AREAS_FROM_ODATA = 10
    var filter = "layer/id eq 1"
    filter = filterObj ? filter.concat(` and substringof(nameCode,'${filterObj.toUpperCase()}')`) : filter
    if (filterObj || state.listOfServiceAreaTags.length == 0) {
      $http.get(`/service/odata/servicearea?$select=id,code&$filter=${filter}&$orderby=id&$top=${MAX_SERVICE_AREAS_FROM_ODATA}`)
        .then((results) => {
          state.listOfServiceAreaTags = StateViewMode.removeDuplicates(state.listOfServiceAreaTags.concat(results.data), 'id')
        })
    }
  }

  static removeDuplicates(myArr, prop) {
    return myArr.filter((obj, pos, arr) => {
      return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
    });
  }

  static getTagColour(tag) {
    return StateViewMode.hsvToRgb(tag.colourHue,config.hsv_defaults.saturation,config.hsv_defaults.value)
  }

}

export default StateViewMode