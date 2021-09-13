import React, { Component } from 'react'
//import { Field, reduxForm } from 'redux-form'
import Foldout from '../foldout.jsx'
//import AroFeatureFactory from '../../../../service-typegen/dist/AroFeatureFactory'
import Multiselect from 'react-widgets/lib/Multiselect'
import DropdownList from 'react-widgets/lib/DropdownList'
import SelectList from 'react-widgets/lib/SelectList'

export class AroFeatureEditorNode extends Component {
  constructor (props) {
    super(props)

    if (!'isCollapsible' in props) props.isCollapsible = true
    if (!'isEditable' in props) props.isEditable = true
    if (!'visible' in props.meta) props.meta.visible = true

    //this.value = this.props.value
    //console.log({key: this.props.objPath, val: this.value, iVal: this.props.value})
    if ('undefined' === typeof this.props.value) {
      console.log(` --- undefined --- ${this.props.objPath}`)
      // eh something is wrong
      this.props.meta.visible = false
    }
  }

  render () {
    if (!this.props.meta.visible) return []

    if (this.props.meta.displayDataType.startsWith('object')) {
      return this.renderCollection()
    } else if (this.props.meta.displayDataType.startsWith('array')) {
      return this.renderList()
    } else {
      return this.renderItem()
    }
  }

  renderList () {
    var jsx = []
    var itemMeta = JSON.parse(JSON.stringify(this.props.meta))
    // get the object type out of the array type
    let len = itemMeta.displayDataType.length
    if ('array[' === itemMeta.displayDataType.substring(0, 6)
      && ']' === itemMeta.displayDataType.charAt(len-1)) {
        itemMeta.displayDataType = itemMeta.displayDataType.substring(6, len-1)
    }
    
    this.props.value.forEach((item, index) => {
      let objPath = `${this.props.objPath}[${index}]`
      let isEditable = this.props.isEditable && this.props.meta.editable
      itemMeta.displayName = `${index}`
      jsx.push(<AroFeatureEditorNode objPath={objPath} key={objPath} isEditable={isEditable} value={item} meta={itemMeta} onChange={this.props.onChange} />)
    })
    // ToDo: repeat code below
    if (this.props.omitRootContain) {
      return (
        <>
          {jsx}
        </>
      )
    } else {
      return (
        <Foldout displayName={`${this.props.meta.displayName} ${this.props.value.length}`}>
          {jsx}
        </Foldout>
      )
    }
  }

  renderCollection () {
    let subMeta = this.props.meta.properties
    var jsx = []
    let propsList = Object.values(subMeta)
    propsList.sort((a, b) => {
      let isSwap = a.displayOrder - b.displayOrder
      if (a.displayOrder === -1 && b.displayOrder !== -1) isSwap = -isSwap
      return isSwap
    })
    propsList.forEach((meta, index) => {
      let key = meta.propertyName
      if (key in this.props.value && meta.visible) {
        let value = this.props.value[key]
        let isEditable = this.props.isEditable && meta.editable
        let objPath = `${this.props.objPath}.${key}`
        jsx.push(<AroFeatureEditorNode objPath={objPath} key={objPath} isEditable={isEditable} value={value} meta={meta} onChange={this.props.onChange} />)
      }
    })
    
    if (this.props.omitRootContain) {
      return (
        <>
          {jsx}
        </>
      )
    } else {
      return (
        <Foldout displayName={this.props.meta.displayName}>
          {jsx}
        </Foldout>
      )
    }
  }

  renderItem () {
    let isEditable = this.props.isEditable && this.props.meta.editable
    var field = ''
    
    let options = []
    // multiple meta.displayDataType may resolve to the same form element
    //  find this one
    let formEleType = null
    for (const displayTypeName in AroFeatureEditorNode.displayTypes) {
      if (AroFeatureEditorNode.displayTypes[displayTypeName].includes(this.props.meta.displayDataType)) {
        formEleType = displayTypeName
      }
    }
    
    if (!isEditable || !formEleType) {
      field = (
        <div style={{ display: 'inline-block' }}>{String(this.props.value)}</div>
      )
    } else {
      let eleProps = {
        'name': this.props.objPath,
        'onChange': ((event) => this.props.onChange(event, event.target.value, this.props.objPath)),
        'type': formEleType,
        'value': this.props.value,
        //'ref': this.props.value,
      }
      switch (formEleType) {
        case 'checkbox':
          eleProps.onChange = ((event) => this.props.onChange(event, !this.props.value, this.props.objPath))
          field = (
            <input {...eleProps} checked={this.props.value === true ? 'checked' : null} className='checkboxfill layer-type-checkboxes'></input>
          )
          break
        case 'multiSelect':
          field = (
            <Multiselect {...eleProps} />
          )
          break
        case 'dropdownList':
          // when we get fancier with the options we can include on the <Field> tag:
          // valueField="value"
          // textField="displayName"
          // for options that look like: {displayName: 'Feeder Fiber', value: 'FEEDER'}
          field = (
            <DropdownList {...eleProps} />
          )
          break
        case 'selectList':
          field = (
            <SelectList {...eleProps} />
          )
          break
        default:
          field = (
            <input {...eleProps} className='form-control form-control-sm'></input>
          )
      }
    }

    return (
      <div className='ei-property-item' key={this.props.objPath}>
        <div className='ei-property-label'>
          {this.props.meta.displayName}
        </div>
        <div className='ei-property-value'>
          {field}
        </div>
      </div>
    )
  }

}

AroFeatureEditorNode.displayTypes = {
  //OBJECT: ['object'],
  'string': ['string'],
  'text': ['text'],
  'number': ['number', 'integer'],
  'checkbox': ['checkbox', 'boolean'],
  'multiSelect': ['multiSelect'],
  'dropdownList': ['dropdownList', 'enum'],
  'selectList': ['selectList'],
  'date': ['date'],
  'datetime-local': ['datetime'],
}
Object.freeze(AroFeatureEditorNode.displayTypes)

// --- react-widgets wrappers, now for export! --- //
export class FieldComponents {
  static renderDisplayOnly ({ input, ...rest }) {
    var display = input.value
    if (rest.textField && rest.valueField && rest.data) {
      display = rest.data.find(item => item[rest.valueField] === input.value)[rest.textField]
    }
    if (typeof display === 'undefined') display = input.value
    return (
      <div style={{ display: 'inline-block' }}>{display}</div>
    )
  }

  static renderMultiselect ({ input, ...rest }) {
    return (
      <Multiselect {...input} onBlur={() => input.onBlur()} value={input.value || []} {...rest} />
    )
  }

  static renderDropdownList ({ input, ...rest }) {
    const { valueField } = rest
    function handleChange (item) {
      let value = item
      if (valueField) {
        value = item[valueField]
      }
      input.onChange(value)
    }
    return <DropdownList {...input} onBlur={() => input.onBlur()} {...rest} onChange={handleChange} />
  }

  static renderSelectList ({ input, ...rest }) {
    return <SelectList {...input} onBlur={() => input.onBlur()} {...rest} />
  }
}

export default AroFeatureEditorNode
