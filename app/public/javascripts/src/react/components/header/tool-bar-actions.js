import AroHttp from '../../common/aro-http'
import Actions from '../../common/actions'
import PlanActions from '../plan/plan-actions'
import SelectionActions from '../selection/selection-actions'
import { hsvToRgb } from '../../common/view-utils'
import { batch } from 'react-redux'

function setPlanInputsModal (status){
  return {
    type: Actions.TOOL_BAR_SET_SAVE_PLAN_AS,
    payload: status
  }
}

function selectedDisplayMode (value){
  return {
    type: Actions.TOOL_BAR_SET_SELECTED_DISPLAY_MODE,
    payload: value
  }
}

function activeViewModePanel (value){
  return {
    type: Actions.TOOL_BAR_SET_ACTIVE_VIEW_MODE_PANEL,
    payload: value
  }
}

function selectedToolBarAction (value){
  return {
    type: Actions.TOOL_BAR_SELECTED_TOOL_BAR_ACTION,
    payload: value
  }
}

function selectedTargetSelectionMode (value){
  return {
    type: Actions.TOOL_BAR_SELECTED_TARGET_SELECTION_MODE,
    payload: value
  }
}

function setIsRulerEnabled (value){
  return {
    type: Actions.TOOL_BAR_IS_RULER_ENABLED,
    payload: value
  }
}

function getOptimizationBody(optimizationInputs, activeSelectionModeId, locationLayers, plan) {
  return () => {
    const inputs = JSON.parse(JSON.stringify(optimizationInputs))
    // inputs.analysis_type = service.networkAnalysisTypeId
    // inputs.planId = service.planId
    inputs.planId = plan.id
    inputs.locationConstraints = {}
    inputs.locationConstraints.analysisSelectionMode = activeSelectionModeId
    inputs.locationConstraints.locationTypes = []
    locationLayers.forEach(locationsLayer => {
      if (locationsLayer.checked) inputs.locationConstraints.locationTypes.push(locationsLayer.plannerKey)
    })
    return inputs
  }
}

function setIsViewSettingsEnabled (value){
  return {
    type: Actions.TOOL_BAR_IS_VIEW_SETTINGS_ENABLED,
    payload: value
  }
}

function setShowDirectedCable (value){
  return {
    type: Actions.TOOL_BAR_SHOW_DIRECTED_CABLE,
    payload: value
  }
}

function setShowEquipmentLabelsChanged (value){
  return {
    type: Actions.TOOL_BAR_SHOW_EQUIPMENT_LABELS,
    payload: value
  }
}

function setShowFiberSize (value){
  return {
    type: Actions.TOOL_BAR_SHOW_FIBER_SIZE,
    payload: value
  }
}

function setAppConfiguration (appConfiguration){
  return {
    type: Actions.TOOL_BAR_SET_APP_CONFIGURATION,
    payload: appConfiguration
  }
}

function createNewPlan (isEphemeral, planName, parentPlan, planType){
  return (dispatch, getState) => {

    const state = getState()
    const loggedInUserId = state.user.loggedInUser.id
    const defaultPlanCoordinates = state.plan.defaultPlanCoordinates
    const currentPlanTags = state.toolbar.currentPlanTags
    const currentPlanServiceAreaTags = state.toolbar.currentPlanServiceAreaTags

    if (isEphemeral && parentPlan) {
      return Promise.reject('ERROR: Ephemeral plans cannot have a parent plan')
    }

    // Use reverse geocoding to get the address at the current center of the map
    const planOptions = {
      areaName: '',
      latitude: defaultPlanCoordinates.latitude,
      longitude: defaultPlanCoordinates.longitude,
      zoomIndex: defaultPlanCoordinates.zoom,
      ephemeral: isEphemeral,
      name: planName || 'Untitled',
      planType: planType || 'UNDEFINED'
    }
    return getAddressFor(planOptions.latitude, planOptions.longitude)
      .then((address) => {
        planOptions.areaName = address
        // Get the configuration for this user - this will contain the default project template to use
        return AroHttp.get(`/service/auth/users/${loggedInUserId}/configuration`)
      })
      .then((result) => {
        let apiEndpoint = `/service/v1/plan?project_template_id=${result.data.projectTemplateId}`
        if (!isEphemeral && parentPlan) {
          // associate selected tags to child plan
          planOptions.tagMapping = {
            global: [],
            linkTags: {
              geographyTag: 'service_area',
              serviceAreaIds: []
            }
          }

          planOptions.tagMapping.global = currentPlanTags.map(tag => tag.id)
          planOptions.tagMapping.linkTags.serviceAreaIds = currentPlanServiceAreaTags.map(tag => tag.id)
          // A parent plan is specified - append it to the POST url
          apiEndpoint += `&branch_plan=${parentPlan.id}`
        }
        return AroHttp.post(apiEndpoint, planOptions)
      })
      .catch((err) => console.error(err))
  }
}

function loadPlan (planId) {
  return dispatch => {
    trackEvent('LOAD_PLAN', 'CLICK', 'PlanID', planId)
    dispatch(selectedDisplayMode('VIEW'))
    let plan = null
    return AroHttp.get(`/service/v1/plan/${planId}`)
      .then((result) => {
        plan = result.data
        return getAddressFor(plan.latitude, plan.longitude)
      })
      .then((address) => {
        plan.areaName = address
        const mapObject = {
          latitude: plan.latitude,
          longitude: plan.longitude,
          zoom: plan.zoomIndex
        }
        // Due to unable to subscribe requestSetMapCenter as of now used Custom Event Listener
        // https://www.sitepoint.com/javascript-custom-events/
        const event = new CustomEvent('mapChanged', { detail: mapObject})
        window.dispatchEvent(event)
        
        return Promise.resolve()
      })
      .then(() => {
        return batch(() => {
          // TEMPORARY UNTIL WE ALLOW MULTIPLE SERVICE AREA PLAN EDIT
          // Load selected service areas
          dispatch(SelectionActions.loadPlanTargetSelectionsFromServer(planId))
          dispatch(PlanActions.setActivePlan(plan)) // This will also create overlay, tiles, etc.
        })
      })
  }
}

function makeCurrentPlanNonEphemeral (planName, planType) {
  return (dispatch, getState) => {

    const state = getState()
    const plan = state.plan.activePlan
    const defaultPlanCoordinates = state.plan.defaultPlanCoordinates
    const currentPlanTags = state.toolbar.currentPlanTags
    const currentPlanServiceAreaTags = state.toolbar.currentPlanServiceAreaTags

    const newPlan = JSON.parse(JSON.stringify(plan))
    newPlan.name = planName
    newPlan.ephemeral = false
    newPlan.latitude = defaultPlanCoordinates.latitude
    newPlan.longitude = defaultPlanCoordinates.longitude
    newPlan.planType = planType || 'UNDEFINED'
    delete newPlan.optimizationId
    newPlan.tagMapping = {
      global: [],
      linkTags: {
        geographyTag: 'service_area',
        serviceAreaIds: []
      }
    }
    delete newPlan.planErrors

    newPlan.tagMapping.global = currentPlanTags.map(tag => tag.id)
    newPlan.tagMapping.linkTags.serviceAreaIds = currentPlanServiceAreaTags.map(tag => tag.id)
    // newPlan.tagMapping = {"global":service.currentPlanTags.map(tag => tag.id)}
    getAddressFor(newPlan.latitude, newPlan.longitude)
      .then((address) => {
        newPlan.areaName = address
        return AroHttp.put(`/service/v1/plan`, newPlan)
      })
      .then((result) => {
        if (result.status >= 200 && result.status <= 299) {
          // Plan has been saved in the DB. Reload it
          dispatch(PlanActions.setActivePlan(result.data))
        } else {
          console.error('Unable to make plan permanent')
          console.error(result)
        }
      })
  }
}

function copyCurrentPlanTo (planName, planType) {
  return (dispatch, getState) => {

    const state = getState()
    const plan = state.plan.activePlan

    const newPlan = JSON.parse(JSON.stringify(plan))
    newPlan.name = planName
    newPlan.ephemeral = false

    // Only keep the properties needed to create a plan
    const validProperties = new Set(['projectId', 'areaName', 'latitude', 'longitude', 'ephemeral', 'name', 'zoomIndex', 'planType'])
    const keysInPlan = Object.keys(newPlan)
    keysInPlan.forEach((key) => {
      if (!validProperties.has(key)) {
        delete newPlan[key]
      }
    })

    const url = `/service/v1/plan-command/copy?source_plan_id=${plan.id}&is_ephemeral=${newPlan.ephemeral}&name=${newPlan.name}`

    return AroHttp.post(url, {})
      .then((result) => {
        if (result.status >= 200 && result.status <= 299) {
          const center = map.getCenter()
          result.data.latitude = center.lat()
          result.data.longitude = center.lng()
          result.data.planType = planType || 'UNDEFINED'
          return AroHttp.put(`/service/v1/plan`, result.data)
        } else {
          console.error('Unable to copy plan')
          console.error(result)
          return Promise.reject()
        }
      })
      .then((result) => {
        return dispatch(loadPlan(result.data.id))
      })
  }
}

function trackEvent (category, action, label, value) {
  try {
    // 'gtag' is a global variable defined in index.html if an analytics key is provided
    if (window.gtag) {
      gtag('event', category, {
        action: action,
        label: label,
        value: value
      })
    }
  } catch (err) {
    // Yes, we are swallowing the exception. But the tracker should never interfere with the functioning of the app. Being extra cautious.
    console.error(err)
  }
}

function getAddressFor (latitude, longitude) {
  return new Promise((resolve, reject) => {
    const geocoder = new google.maps.Geocoder()
    let address = ''
    geocoder.geocode({ 'location': new google.maps.LatLng(latitude, longitude) }, function (results, status) {
      if (status === 'OK') {
        if (results[1]) {
          address = results[0].formatted_address
        } else {
          console.warn(`No address results for coordinates ${latitude}, ${longitude}`)
        }
      } else {
        console.warn(`Unable to get address for coordinates ${latitude}, ${longitude}`)
      }
      resolve(address) // Always resolve, even if reverse geocoding failed
    })
  })
}

// Plan search - tags
function loadListOfPlanTags () {
  return dispatch => {
    const promises = [
      AroHttp.get(`/service/tag-mapping/global-tags`)
    ]

    return Promise.all(promises)
      .then((results) => {
        dispatch({
          type: Actions.TOOL_BAR_LIST_OF_PLAN_TAGS,
          payload: results[0].data
        })
      })
  }
}

function setCurrentPlanTags (currentPlanTags){
  return {
    type: Actions.TOOL_BAR_SET_CURRENT_PLAN_TAGS,
    payload: currentPlanTags
  }
}

function setCurrentPlanServiceAreaTags (currentPlanServiceAreaTags){
  return {
    type: Actions.TOOL_BAR_SET_CURRENT_PLAN_SA_TAGS,
    payload: currentPlanServiceAreaTags
  }
}


function loadServiceLayers () {
  let serviceLayers = []
  let nameToServiceLayers = {}
  return dispatch => {
    AroHttp.get('/service/odata/ServiceLayer?$select=id,name,description')
      .then((response) => {
        if (response.status >= 200 && response.status <= 299) {
          serviceLayers = response.data
          serviceLayers.forEach((layer) => {
            nameToServiceLayers[layer.name] = layer
          })
          dispatch({
            type: Actions.TOOL_BAR_LOAD_SERVICE_LAYERS,
            payload: nameToServiceLayers
          })
        }
      })
  }
}

function loadListOfSAPlanTags (dataItems, filterObj, isHardReload) {
  return (dispatch, getState) => {

    const state = getState()
    const nameToServiceLayers = state.toolbar.nameToServiceLayers
    const listOfServiceAreaTags = state.toolbar.listOfServiceAreaTags

    const MAX_SERVICE_AREAS_FROM_ODATA = 10
    // let filter = "layer/id eq 1"
    let libraryItems = []
    let filter = ''

    const selectedServiceLayerLibraries = dataItems && dataItems.service_layer && dataItems.service_layer.selectedLibraryItems
    // ToDo: Do not select service layers by name
    // we need a change in service GET /v1/library-entry needs to send id, identifier is not the same thing
    if (selectedServiceLayerLibraries) libraryItems = selectedServiceLayerLibraries.map(selectedLibraryItem => selectedLibraryItem.name)
    if (libraryItems.length > 0) {
      // Filter using selected serviceLayer id
      const layerfilter = libraryItems.map(libraryName => `layer/id eq ${nameToServiceLayers[libraryName].id}`).join(' or ')
      filter = filter ? filter.concat(` and (${layerfilter})`) : `${layerfilter}`
    }

    filter = filterObj ? filter.concat(` and (substringof(code,'${filterObj}') or substringof(name,'${filterObj}'))`) : filter
    if (isHardReload) { 
      dispatch({
        type: Actions.TOOL_BAR_LIST_OF_SERVICE_AREA_TAGS,
        payload: []
      })
    }
    if (filterObj || listOfServiceAreaTags.length === 0) {
      AroHttp.get(`/service/odata/ServiceAreaView?$select=id,code,name&$filter=${filter}&$orderby=id&$top=${MAX_SERVICE_AREAS_FROM_ODATA}`)
        .then((results) => {
          dispatch({
            type: Actions.TOOL_BAR_LIST_OF_SERVICE_AREA_TAGS,
            payload: removeDuplicates(listOfServiceAreaTags.concat(results.data), 'id')
          })
        })
    }
  }
}

function loadListOfSAPlanTagsById (listOfServiceAreaTags, promises) {
  return dispatch => {
    if (promises) {
      let listOfServiceAreaTagsValue
      return Promise.all(promises)
        .then((results) => {
          results.forEach((result) => {
            listOfServiceAreaTagsValue = removeDuplicates(listOfServiceAreaTags.concat(result.data), 'id')
            dispatch({
              type: Actions.TOOL_BAR_LIST_OF_SERVICE_AREA_TAGS,
              payload: listOfServiceAreaTagsValue
            })
          })
          return listOfServiceAreaTagsValue
        })
        .catch((err) => console.error(err))
    }
  }
}

function removeDuplicates (myArr, prop) {
  return myArr.filter((obj, pos, arr) => {
    return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos
  })
}

function getTagColour (tag) {
  return () => {
    return hsvToRgb(tag.colourHue, 0.5, 0.5)
  }
}

function setSelectedHeatMapOption (selectedHeatMapOption){
  return {
    type: Actions.TOOL_BAR_SET_HEAT_MAP_OPTION,
    payload: selectedHeatMapOption
  }
}

function setViewSetting (viewSetting) {
  return {
    type: Actions.TOOL_BAR_SET_VIEW_SETTING,
    payload: viewSetting
  }
}

function setDeletedMapObjects (mapObject) {
  return {
    type: Actions.TOOL_BAR_SET_DELETED_UNCOMMITED_MAP_OBJECTS,
    payload: mapObject
  }
}

function setSidebarWidth (sidebarWidth) {
  return {
    type: Actions.TOOL_BAR_SET_SIDEBAR_WIDTH,
    payload: sidebarWidth
  }
}

export default {
  setPlanInputsModal,
  selectedDisplayMode,
  activeViewModePanel,
  selectedToolBarAction,
  selectedTargetSelectionMode,
  setIsRulerEnabled,
  getOptimizationBody,
  setIsViewSettingsEnabled,
  setShowDirectedCable,
  setShowEquipmentLabelsChanged,
  setShowFiberSize,
  setAppConfiguration,
  createNewPlan,
  loadPlan,
  loadListOfPlanTags,
  setCurrentPlanTags,
  setCurrentPlanServiceAreaTags,
  loadServiceLayers,
  loadListOfSAPlanTags,
  loadListOfSAPlanTagsById,
  getTagColour,
  makeCurrentPlanNonEphemeral,
  copyCurrentPlanTo,
  setSelectedHeatMapOption,
  setViewSetting,
  setDeletedMapObjects,
  setSidebarWidth,
}
