import AroFeatureFactory from '../../../service-typegen/dist/AroFeatureFactory'
// === editable value === //

class EditorInterfacePrimitiveController {
  constructor ($timeout) {
    this.$timeout = $timeout
  }

  $onInit () {
    this.enumVal = ''
    //this.enumSet = []
    this.isValid = true
    this.needsValidation = false
    this.dateVal = new Date()
  }

  onRefresh () {
    if (this.displayProps.displayDataType == 'date' || this.displayProps.displayDataType == 'datetime') {
      if (typeof this.model === 'undefined' || isNaN(this.model) || this.model == 0) {
        this.dateVal = new Date()
        this.model = this.dateVal.getTime()
      } else {
        var newDateVal = new Date(this.model)
        if (newDateVal.getTime() != this.dateVal.getTime()) { // interesting fact: new Date(0) != new Date(0)
          this.dateVal = newDateVal
        }
      }
    }
  }

  getEnumSet () {
    if (this.displayProps.displayDataType == 'enum') {
      
      var digestEnum = (enumSet) => {
        var oldEnumText = JSON.stringify(this.displayProps.enumSet)
        var isEnumSame = (JSON.stringify(enumSet) == oldEnumText)

        this.displayProps.enumSet = enumSet
        
        
        var isInSet = false
        for (let i = 0; i < this.displayProps.enumSet.length; i++) {
          if (this.displayProps.enumSet[i].id == this.model) {
            this.enumVal = this.displayProps.enumSet[i].description
            isInSet = true
            break
          }
        }
        if (!isInSet && this.displayProps.enumSet && this.displayProps.enumSet.length > 0) {
          if (this.isEdit) {
            this.enumVal = this.displayProps.enumSet[0].description
            this.model = this.displayProps.enumSet[0].id
          } else {
            this.enumVal = this.model
          }
          this.onChange()
        } else if (!isEnumSame) {
          // need to refresh the local view
          // this.$timeout() // Commenting out for now, this was causing an infinite loop
        }
      }
      
      if (this.displayProps.enumTypeURL) {
        AroFeatureFactory.getEnumSet(this.rootMetaData, this.parentObj, '/service/type-enum/' + this.displayProps.enumTypeURL)
          .then(digestEnum, (errorText) => {
            console.log(errorText)
            this.displayProps.enumSet = []
          })
      }else{
        digestEnum(this.displayProps.enumSet)
      }
        
    }
  }

  setDate () {
    if (!this.isEdit ||
        typeof this.dateVal === 'undefined' ||
        (this.dateVal === null && typeof this.dateVal === 'object')) return
    this.model = this.dateVal.getTime()
    this.onChange()
  }

  checkConstraint () {
    return (this.model !== '')
  }

  onInput () {
    if (this.needsValidation) {
      if (!this.checkConstraint()) {
        this.isValid = false
      } else {
        this.isValid = true
        this.onChange()
      }
    } else {
      this.onChange()
    }
  }
}

EditorInterfacePrimitiveController.$inject = ['$timeout']

let editorInterfacePrimitive = {
  templateUrl: '/components/common/editor-interfaces/editor-interface-primitive.html',
  bindings: {
    displayProps: '=',
    model: '=',
    onChange: '&',
    isEdit: '<',
    parentObj: '<',
    rootMetaData: '<'
  },
  controller: EditorInterfacePrimitiveController
}
export default editorInterfacePrimitive
