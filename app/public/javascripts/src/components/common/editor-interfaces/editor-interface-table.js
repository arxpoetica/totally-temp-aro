// === table view === //


class EditorInterfaceTableController {
  constructor() {
    this.orderCol = ""
    this.isOrderAscending = true
  }

  $onInit() {
    this.orderCol = this.displayProps[0].propertyName
    this.orderTable()
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
  
  setOrderCol(colName){
    if (colName == this.orderCol){
      this.isOrderAscending = !this.isOrderAscending
    }else{
      this.orderCol = colName
      this.isOrderAscending = true
    }
    
    this.orderTable()
  }
  
  orderTable(){
    
    if (this.isOrderAscending){
      this.rows.sort((a, b) => {
        var valA = a[this.orderCol]
        var valB = b[this.orderCol]
        if (valA < valB) {
          return -1;
        }
        if (valA > valB) {
          return 1;
        }
  
        // names must be equal
        return 0;
      });
    }else{
      this.rows.sort((a, b) => {
        var valA = a[this.orderCol]
        var valB = b[this.orderCol]
        if (valA > valB) {
          return -1;
        }
        if (valA < valB) {
          return 1;
        }
  
        // names must be equal
        return 0;
      });
    }
    
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
  