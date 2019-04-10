// === table view === //


class EditorInterfaceTableController {
  constructor () {
    this.orderCol = ''
    this.isOrderAscending = true
    this.pageOffset = 0
    this.lastPage = 0
    this.actionDisplayLimit = 1
    this.pages = []
    this.prevRowsJSON = ''
    this.openRowId = null
    this.rowViewName = "<editor-interface-primitive></editor-interface-primitive>"
  }

  $onInit () {
    this.orderCol = this.displayProps[0].propertyName
    this.orderTable()
    this.setPage()
  }

  $onChanges (changes) {
    if (changes.hasOwnProperty('rows')) {
      this.prevRowsJSON = JSON.stringify(this.rows)
      this.orderTable()
      this.setPage()
    }
  }

  $doCheck () {
    // check for parent changing rows
    var rowsJSON = JSON.stringify(this.rows)
    if (this.prevRowsJSON != rowsJSON){
      this.prevRowsJSON = rowsJSON
      this.orderTable()
    }
    
    this.setPage()
  }

  setPage (page) {
    if (typeof page === 'undefined') {
      page = this.pageOffset
    }

    page == Math.floor(page)

    this.lastPage = Math.floor((this.rows.length - 1) / this.rowsPerPage)
    if (this.lastPage < 0) this.lastPage = 0

    if (page > this.lastPage) {
      page = this.lastPage
    }

    if (page < 0) page = 0

    var newPages = []
    // -1 indicates "..."
    if (this.lastPage < 7) {
      newPages = [...Array(this.lastPage + 1).keys()]
    } else if (page < 2 || page + 2 > this.lastPage) {
      newPages = [0, 1, 2, -1, this.lastPage - 2, this.lastPage - 1, this.lastPage]
    } else if (page == 2) {
      newPages = [0, 1, 2, 3, -1, this.lastPage - 1, this.lastPage]
    } else if (this.lastPage - 2 == page) {
      newPages = [0, 1, -1, this.lastPage - 3, this.lastPage - 2, this.lastPage - 1, this.lastPage]
    } else {
      newPages = [0, -1, page - 1, page, page + 1, -1, this.lastPage]
    }

    this.pages = newPages
    this.pageOffset = page
  }

  setOrderCol (colName) {
    if (colName == this.orderCol) {
      this.isOrderAscending = !this.isOrderAscending
    } else {
      this.orderCol = colName
      this.isOrderAscending = true
    }

    this.orderTable()
  }

  orderTable () {
    var ascendMult = -1.0
    if (this.isOrderAscending) ascendMult = 1.0
    
    this.rows.sort((a, b) => {
      var valA = a[this.orderCol]
      var valB = b[this.orderCol]
      if (valA < valB) {
        return -1 * ascendMult
      }
      if (valA > valB) {
        return 1 * ascendMult
      }
      // if equal
      return 0
    })
  }
  
  toggleRow (rowKey) {
    if (this.openRowId == rowKey){
      this.openRowId = null
    }else{
      this.openRowId = rowKey
    }
  }
  
}

let editorInterfaceTable = {
  templateUrl: '/components/common/editor-interfaces/editor-interface-table.html',
  bindings: {
    displayProps: '=',
    idProp: '<', 
    rows: '=',
    onChange: '&',
    isEdit: '<',
    actions: '<',
    rowsPerPage: '<',
    rootMetaData: '<'
  },
  controller: EditorInterfaceTableController
}
export default editorInterfaceTable
