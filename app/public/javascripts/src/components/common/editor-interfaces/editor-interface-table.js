// === table view === //

/*

rows [objects of same type]

// descriptions of each property (of items in rows) to be shown
// similar to: 
displayProperties: [
  {
    "propertyName": "name",
    "levelOfDetail": 0,
    "format": "",
    "displayName": "Name",
    "enumTypeURL": "",
    "displayDataType": "string",
    "defaultValue": "",
    "editable": true,
    "visible": true
  },
  {
    "propertyName": "description",
    "levelOfDetail": 0,
    "format": "",
    "displayName": "Description",
    "enumTypeURL": "",
    "displayDataType": "string",
    "defaultValue": "",
    "editable": true,
    "visible": true
  },
  {
    "propertyName": "minDown",
    "levelOfDetail": 0,
    "format": "",
    "displayName": "Min Down",
    "enumTypeURL": "",
    "displayDataType": "integer",
    "defaultValue": "0",
    "editable": true,
    "visible": true
  },
  {
    "propertyName": "maxDown",
    "levelOfDetail": 0,
    "format": "",
    "displayName": "Max Down",
    "enumTypeURL": "",
    "displayDataType": "integer",
    "defaultValue": "0",
    "editable": true,
    "visible": true
  }
]

// for additional buttons and standard button override
actions: [
  {
    buttonText: "Permissions", 
    buttonColor: "", // use default
    callBack: function(index, row)
  }, 
  {
    buttonText: "Delete", // in this case you'd send 'false' to canDelete because this button is handling that function 
    buttonColor: "#990000"
    callBack: function(index, row)
  }
]

*/


class EditorInterfaceTableController {
  constructor() {
    //
  }

  $onInit() {
    //
  }
  
  addItem(){
    console.log('add item')
    /*
    console.log(this)
    console.log(this.rows)
    let newItem = {}
    
    // ToDo: should actually make a new instance of a defined class. 
    //  we should pass in a class. There may be properties that we don't show bu want to pass. It can also cut down on the structure definition 
    this.rows.cols.forEach(col => {
      newItem[col.property] = col.hasOwnProperty('defaultVal') ? col.defaultVal : null 
    }) 
    
    this.rows.rows.push(newItem)
    */
  }
  
  deleteItem(index){
    console.log('delete '+index)
    //this.rows.rows.splice(index, 1)
  }
  
}

let editorInterfaceTable = {
  templateUrl: '/components/common/editor-interfaces/editor-interface-table.html',
  bindings: {
    displayProps: '=', 
    rows: '=', 
    onChange: '&', 
    isEdit: '<',
    canAdd: '<', 
    canDelete: '<', 
    actions: '<', 
    rootMetaData: '<'
  },
  controller: EditorInterfaceTableController
}
export default editorInterfaceTable
  