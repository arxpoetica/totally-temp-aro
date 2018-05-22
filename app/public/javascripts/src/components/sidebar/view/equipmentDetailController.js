import AroFeatureFactory from '../../../service-typegen/dist/AroFeatureFactory'
import EquipmentFeature from '../../../service-typegen/dist/EquipmentFeature'


class EquipmentDetailController {

	constructor($http, $timeout, state, configuration) {
    this.angular = angular
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
    this.configuration = configuration
    this.networkNodeType = ''
    this.selectedEquipmentInfo = {}
    //this.selectedEquipmentInfoChanges = {}
    //this.selectedEquipmentInfoDispProps = []
    
    //this.isEdit = false
    this.headerIcon = '' //"/images/map_icons/aro/remote_terminal.png"
    
    /*
    this.debugFeature = {
      "physicallyLinked":"true",
      "site_info":{  
         "siteName":"ROAD 7 & HWY 281",
         "siteClli":"QNCYWADX",
         "hsiOfficeCode":null,
         "dpiEnvironment":null,
         "address":"16968 Road 7 NW, QUINCY 98848"
      },
      "notes":null,
      "t1":null,
      "fiberAvailable":null,
      "existingEquipment":[
        {  
         "latency":null,
         "clliCode":"QNCYWADXH00",
         "modelNumber":"ADTRAN TA 5004",
         "switchType":null,
         "deploymentDate":"2017-06-01",
         "uplinkSpeed":null
        }, 
        {  
          "latency":null,
          "clliCode":"QNCYWADXH00",
          "modelNumber":"ADTRAN TA 5004",
          "switchType":null,
          "deploymentDate":"2017-06-01",
          "uplinkSpeed":null
         }
      ]
    }
    
    // an example display property object 
    this.dispProps = {}
    this.dispProps['equipment'] = [
      
      {
        'displayName': "Site Info", 
        'editable': false, 
        'format': "tree", 
        'propertyName': "siteInfo", 
        'visible': true, 
        'children': [
          {
            'displayName': "Name", 
            'editable': true, 
            'format': "string", 
            'propertyName': "siteName", 
            'levelOfDetail': "1", 
            'visible': true
          },
          {
            'displayName': "CLLI", 
            'editable': false, 
            'format': "", 
            'propertyName': "siteClli", 
            'levelOfDetail': "1", 
            'visible': true
          },
          {
            'displayName': "Address", 
            'editable': true, 
            'format': "string", 
            'propertyName': "address", 
            'levelOfDetail': "2", 
            'visible': true
          },
          {
            'displayName': "DPI Environment", 
            'editable': true, 
            'format': "string", 
            'propertyName': "dpiEnvironment", 
            'levelOfDetail': "2", 
            'visible': true
          },
          {
            'displayName': "HSI OfficeCode", 
            'editable': true, 
            'format': "string", 
            'propertyName': "hsiOfficeCode", 
            'levelOfDetail': "2", 
            'visible': true
          }, 
          {
            'displayName': "Physically Linked", 
            'editable': true, 
            'format': "check", 
            'propertyName': "physicallyLinked", 
            'levelOfDetail': "2", 
            'visible': true
          }, 
          {
            'displayName': "Fiber Available", 
            'editable': true, 
            'format': "check", 
            'propertyName': "fiberAvailable", 
            'levelOfDetail': "2", 
            'visible': true
          }, 
          {
            'displayName': "T1", 
            'editable': true, 
            'format': "check", 
            'propertyName': "t1", 
            'levelOfDetail': "2", 
            'visible': true
          }, 
        ]
      }, 
      {
        'displayName': "Equipment", 
        'editable': false, 
        'format': "list", 
        'propertyName': "existingEquipment", 
        'visible': true, 
        'children': [
          {
            'displayName': "CLLI", 
            'editable': false, 
            'format': "string", 
            'propertyName': "clliCode", 
            'levelOfDetail': "1", 
            'visible': true
          },
          {
            'displayName': "modelNumber", 
            'editable': true, 
            'format': "string", 
            'propertyName': "modelNumber", 
            'levelOfDetail': "1", 
            'visible': true
          },
          {
            'displayName': "Latency", 
            'editable': true, 
            'format': "string", 
            'propertyName': "latency", 
            'levelOfDetail': "1", 
            'visible': true
          },
          {
            'displayName': "Switch Type", 
            'editable': true, 
            'format': "string", 
            'propertyName': "switchType", 
            'levelOfDetail': "2", 
            'visible': true
          },
          {
            'displayName': "Deployment Date", 
            'editable': true, 
            'format': "string", 
            'propertyName': "deploymentDate", 
            'levelOfDetail': "2", 
            'visible': true
          },
          {
            'displayName': "Uplink Speed", 
            'editable': true, 
            'format': "string", 
            'propertyName': "uplinkSpeed", 
            'levelOfDetail': "2", 
            'visible': true
          }
        ]
      }, 
      {
        'displayName': "notes", 
        'editable': true, 
        'enumEntityName': "", 
        'format': "text", 
        'propertyName': "Notes", 
        'visible': true
      }
      
    ]
    */
    
    // DEBUG ONLY 
    //this.selectedEquipmentInfoChanges = this.debugFeature
    //this.selectedEquipmentInfoDispProps = this.dispProps['equipment']
    
    
    // Skip the first event as it will be the existing value of mapFeaturesSelectedEvent
    state.mapFeaturesSelectedEvent.skip(1).subscribe((options) => {
      // most of this funcltion is assuring the properties we need exist. 
      // ToDo: the feature selection system could use some refactoring 
      //console.log(options)
      if (!options.hasOwnProperty('equipmentFeatures')) return
      if (0 == options.equipmentFeatures.length) return
      
      var plan = state.plan.getValue()
      if (!plan || !plan.hasOwnProperty('id')) return
      
      
      var equipmentList = options.equipmentFeatures
      var selectedFeature = null
      var featureId = null
      for (var featureI = 0; featureI < equipmentList.length; featureI++){
        var feature = equipmentList[featureI]
        if (feature.hasOwnProperty('object_id')){
        
          if ( feature.hasOwnProperty('id') ){
            featureId = feature.id
          }else if ( feature.hasOwnProperty('location_id') ){
            featureId = feature.location_id
          }
          
          if (null != featureId){
            selectedFeature = feature
            break
          }
        }
      }
      
      if (null != selectedFeature){
        //console.log(selectedFeature)
        this.updateSelectedState(selectedFeature, featureId)
        this.displayEquipment(plan.id, selectedFeature.object_id)
      }
    })
    
    
    
    state.clearViewMode.subscribe((clear) => {
      if(clear){
        this.networkNodeType = ''
        this.selectedEquipmentInfo = {}
        //this.selectedEquipmentInfoChanges = {}
        //this.selectedEquipmentInfoDispProps = []
        this.updateSelectedState()
      }
    })
  }
	
	
	
	getEquipmentInfo(planId, objectId){
	  return this.$http.get('/service/plan-feature/'+planId+'/equipment/'+objectId).then((response) => {
      return response.data
    })
	}
  
	updateSelectedState(selectedFeature, featureId){
	  // tell state
    var selectedViewFeaturesByType = this.state.selectedViewFeaturesByType.getValue()
    selectedViewFeaturesByType.equipment = {}
    if ('undefined' != typeof selectedFeature && 'undefined' != typeof featureId){
      selectedViewFeaturesByType.equipment[ featureId ] = selectedFeature
    }
    this.state.reloadSelectedViewFeaturesByType(selectedViewFeaturesByType)
	}
	
	displayEquipment(planId, objectId){
	  //console.log(planId)
	  //console.log(objectId)
	  return this.getEquipmentInfo(planId, objectId).then((equipmentInfo) => {
      console.log(equipmentInfo)
      if (equipmentInfo.hasOwnProperty('dataType') && equipmentInfo.hasOwnProperty('objectId')){
        if (this.configuration.networkEquipment.equipments.hasOwnProperty(equipmentInfo.networkNodeType)){
          this.headerIcon = this.configuration.networkEquipment.equipments[equipmentInfo.networkNodeType].iconUrl
        }else{
          // no icon
          this.headerIcon = ''
        }
        
        this.networkNodeType = equipmentInfo.networkNodeType
        this.selectedEquipmentGeog = equipmentInfo.geometry.coordinates
        
        try{ // because ANYTHING that goes wrong in an RX subscription will fail silently (ugggh) 
          this.selectedEquipmentInfo = AroFeatureFactory.createObject(equipmentInfo).networkNodeEquipment
          //this.selectedEquipmentInfoDispProps = this.traverseProperties(this.selectedEquipmentInfo)
        }catch(error) {
          console.error(error) 
          return
        }
        
        //console.log('=== DISP INFO ===')
        //console.log(this.selectedEquipmentInfo)
        //console.log(this.selectedEquipmentInfoDispProps)
        
        this.state.activeViewModePanel = this.state.viewModePanels.EQUIPMENT_INFO
        this.$timeout()
      }
      return equipmentInfo
    })
	}
	
	/*
	traverseProperties(eqPropVals){
	  if ('function' != typeof eqPropVals.getDisplayProperties) return []
	  var eqDispProps = eqPropVals.getDisplayProperties()
	  for (var i=0; i<eqDispProps.length; i++){// loop on values not disp props
	    var dispProp = eqDispProps[i]
	    if (!dispProp.visible || !eqPropVals.hasOwnProperty(dispProp.propertyName)) continue
	    var propVal = eqPropVals[ dispProp.propertyName ]
	    if (null == propVal) continue
	    var type = typeof propVal
	    if ('object' == type && Array.isArray(propVal)) type = 'array'
	    
	    // drop down list
	    // text area vs single line?
	    // date
	    if (!dispProp.format){
  	    switch (type) {
  	      case 'boolean':
  	        eqDispProps[i].format = "check"
  	        break
  	      case 'number':
  	        eqDispProps[i].format = "number"
  	        break
  	      case 'string':
            eqDispProps[i].format = "string"
            break
  	      case 'array':
            eqDispProps[i].format = "list"
            break
  	      case 'object':
            eqDispProps[i].format = "tree"
            break
  	    }
	    }
	    if ('array' == type){
	      if (propVal.length > 0 && 'function' == typeof propVal[0].getDisplayProperties ){
	        eqDispProps[i].children = this.traverseProperties(propVal[0])
	      }
	    }else if ('object' == type){
	      if ('function' == typeof propVal.getDisplayProperties){
  	      eqDispProps[i].children = this.traverseProperties(propVal)
	      }
	    }
	  }
	  return eqDispProps
	}
	*/
	// ---
	
	/*
  //ToDo: these perhaps get moved to the UI component 
  beginEdit(){
    // set up listeners etc
    this.isEdit = true
  }
  
  cancelEdit(){
    // return the object to init state
    //angular.copy(this.selectedEquipmentInfo, this.selectedEquipmentInfoChanges)
    this.isEdit = false
  }
  
  commitEdit(){
    // set the object to the edited object and tell the DB
    // may need to compare to check for deletes and creates 
    //angular.copy(this.selectedEquipmentInfoChanges, this.selectedEquipmentInfo)
    this.isEdit = false
    console.log('send changed data to DB:')
    console.log(this.selectedEquipmentInfo)
  }
  */
  // ---
  
  viewSelectedEquipment(selectedEquipment) {
    //console.log(selectedEquipment)
    
    var plan = this.state.plan.getValue()
    //if (!plan || !plan.hasOwnProperty('id')) return
    this.updateSelectedState(selectedEquipment, selectedEquipment.id)
    this.displayEquipment(plan.id, selectedEquipment.objectId).then((equipmentInfo) => {
      if ("undefined" != typeof equipmentInfo){
        map.setCenter({ lat: this.selectedEquipmentGeog[1], lng: this.selectedEquipmentGeog[0] })
      }
    })
    
    
  }
  
}

EquipmentDetailController.$inject = ['$http', '$timeout', 'state', 'configuration']

export default EquipmentDetailController