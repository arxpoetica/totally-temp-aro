// === table view === //


class EditorInterfaceTableController {
  constructor() {
    this.orderCol = ""
    this.isOrderAscending = true
    this.pageOffset = 0
    this.lastPage = 0
    this.pages = []
  }

  $onInit() {
    this.orderCol = this.displayProps[0].propertyName
    this.orderTable()
    this.setPage()
  }
  
  $onChanges(changes){
    if (changes.hasOwnProperty('rows')){
      this.orderTable()
      this.setPage()
    }
  }
  
  $doCheck(){
    this.setPage()
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
  
  setPage(page){
    if ('undefined' == typeof page){
      page = this.pageOffset
    }
    
    page == Math.floor(page)
    
    this.lastPage = Math.floor((this.rows.length-1) / this.rowsPerPage)
    if (this.lastPage < 0) this.lastPage = 0
    
    if (page > this.lastPage){
      page = this.lastPage
    }
    
    if (page < 0) page = 0
    
    var newPages = []
    // -1 indicates "..."
    if (this.lastPage < 7){
      newPages = [...Array(this.lastPage+1).keys()]
    }else if (page < 2 || page+2 > this.lastPage){
      newPages = [0,1,2,-1,this.lastPage-2,this.lastPage-1,this.lastPage]
    }else if(2 == page){
      newPages = [0,1,2,3,-1,this.lastPage-1,this.lastPage]
    }else if(this.lastPage-2 == page){
      newPages = [0,1,-1,this.lastPage-3,this.lastPage-2,this.lastPage-1,this.lastPage]
    }else{
      newPages = [0,-1,page-1,page,page+1,-1,this.lastPage]
    }
    
    this.pages = newPages
    this.pageOffset = page
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
    rowsPerPage: '<', 
    rootMetaData: '<'
  },
  controller: EditorInterfaceTableController
}
export default editorInterfaceTable
  