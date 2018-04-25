// === table view === //

class EditorItnerfaceTableController {
  constructor() {
    //
  }

  $onInit() {
    //
  }
  
  addItem(){
    console.log(this)
    console.log(this.struct)
    let newItem = {}
    
    // ToDo: should actually make a new instance of a defined class.
    //  we should pass in a class. That can also cut down on the structure definition 
    this.struct.cols.forEach(col => {
      newItem[col.property] = col.hasOwnProperty('defaultVal') ? col.defaultVal : null 
    }) 
    
    this.struct.rows.push(newItem)
  }
  
  deleteItem(index){
    console.log(index)
    this.struct.rows.splice(index, 1)
  }
  
}

let editorItnerfaceTable = {
  templateUrl: '/components/common/editor-interfaces/editor-interface-table.html',
  bindings: {
    struct: '=', 
    isEdit: '<'
  },
  controller: EditorItnerfaceTableController
}
export default editorItnerfaceTable
  