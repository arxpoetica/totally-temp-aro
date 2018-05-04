// === table view === //

class EditorInterfaceTableController {
  constructor() {
    //
  }

  $onInit() {
    //
  }
  
  addItem(){
    console.log(this)
    console.log(this.displayProps)
    let newItem = {}
    
    // ToDo: should actually make a new instance of a defined class. 
    //  we should pass in a class. There may be properties that we don't show bu want to pass. It can also cut down on the structure definition 
    this.displayProps.cols.forEach(col => {
      newItem[col.property] = col.hasOwnProperty('defaultVal') ? col.defaultVal : null 
    }) 
    
    this.displayProps.rows.push(newItem)
  }
  
  deleteItem(index){
    console.log(index)
    this.displayProps.rows.splice(index, 1)
  }
  
}

let editorInterfaceTable = {
  templateUrl: '/components/common/editor-interfaces/editor-interface-table.html',
  bindings: {
    displayProps: '=', 
    isEdit: '<'
  },
  controller: EditorInterfaceTableController
}
export default editorInterfaceTable
  