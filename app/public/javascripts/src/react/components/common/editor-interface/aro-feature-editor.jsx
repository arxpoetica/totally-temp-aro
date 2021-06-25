import React, { Component } from 'react'
import { Field, reduxForm } from 'redux-form'
import Foldout from '../foldout.jsx'
import AroFeatureFactory from '../../../../service-typegen/dist/AroFeatureFactory'
import Multiselect from 'react-widgets/lib/Multiselect'
import DropdownList from 'react-widgets/lib/DropdownList'
import SelectList from 'react-widgets/lib/SelectList'

export class AroFeatureEditor extends Component {
  constructor (props) {
    super(props)

    if (!'isCollapsible' in props) props.isCollapsible = true
    if (!'isEditable' in props) props.isEditable = true
    if (!'visible' in props.meta) props.meta.visible = true
  }

  // left off here

  render () {
    console.log(this.props)
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
    // ToDo: the meta data should be an entirely seperate object, not a property of the value 
    //let subMeta = this.props.value.getDisplayProperties()
    //console.log(subMeta)
    var jsx = []
    let isEditable = this.props.isEditable && subMeta.editable
    this.props.value.forEach((item, index) => {
      let objPath = `${this.props.objPath}[${index}]`
      //let displayName = `${this.props.meta.displayName} ${index+1}`
      //let meta = { ...subMeta, displayName}
      //let meta = subMeta
      let meta = item.getDisplayProperties()
      jsx.push(<AroFeatureEditor objPath={objPath} key={objPath} isEditable={isEditable} value={item} meta={meta} onChange={this.props.onChange} />)
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
        <Foldout displayName={this.props.meta.displayName}>
          {jsx}
        </Foldout>
      )
    }
  }

  renderCollection () {
    // ToDo: the meta data should be an entirely seperate object, not a property of the value 
    let subMeta = this.props.value.getDisplayProperties()
    console.log(subMeta)
    var jsx = []
    //let keysByOrder = Object.entries(subMeta).sort((a,b) => a[1].displayOrder - b[1].displayOrder)
    //let keysByOrder = Object.entries(subMeta)
    //for (const [arKey, meta] of subMeta) {
    subMeta.forEach((meta, index) => {
      let key = meta.propertyName
      if (key in this.props.value && meta.visible) {
        let value = this.props.value[key]
        let isEditable = this.props.isEditable && meta.editable
        let objPath = `${this.props.objPath}.${key}`
        jsx.push(<AroFeatureEditor objPath={objPath} key={objPath} isEditable={isEditable} value={value} meta={meta} onChange={this.props.onChange} />)
      }
    })
    console.log(jsx)
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

  /*
  _onChange (event, value, objPath) {
    this.props.onChange(event, value, objPath)
  }
  */

  
  // renderItem () {
  //   // to get the meta use property.getDisplayProperties()

  //   let isEditable = this.props.isEditable && this.props.meta.editable
  //   // make the input item dynamic
  //   var DisplayElement = DisplayTypes[this.props.meta.displayType].element
  //   /*
  //   let invalidMessEle = null
  //   if (this.props.meta.invalidMessage && this.props.meta.invalidMessage != '') {
  //     invalidMessEle = (<div className='dsInvalidMessage'>{this.props.meta.invalidMessage}</div>)
  //   }
  //   */
  //   return (
  //     <div className='spacerEle'>
  //       {/*invalidMessEle*/}
  //       {this.props.meta.displayName}: 
  //       <DisplayElement objPath={this.props.objPath} 
  //         isEditable={isEditable} 
  //         value={this.props.value} 
  //         meta={this.props.meta} 
  //         onChange={this.props.onChange} 
  //       />
  //     </div>
  //   )
  // }




  renderItem () {
    // JUST TO TEST 
    return (
      <div className='ei-property-item' key={this.props.objPath}>
        <div className='ei-property-label'>
          {this.props.meta.displayName}
        </div>
        <div className='ei-property-value'>
          {this.props.value}
        </div>
      </div>
    )

    // ----

    let isEditable = this.props.isEditable && this.props.meta.editable
    var field = ''
    console.log(this.props.meta)
    let options = []
    // ToDo: this should be more abstract, not aware of AroFeatureFactory
    /*
    if (this.props.meta.enumTypeURL) {
      AroFeatureFactory.getEnumSet(this.rootMetaData, this.parentObj, '/service/type-enum/' + this.displayProps.enumTypeURL)
        .then(digestEnum, (errorText) => {
          console.log(errorText)
          this.displayProps.enumSet = []
        })
    }
    */

    if (!isEditable) {
      field = (
        <Field
          name={this.props.objPath}
          component={FieldComponents.renderDisplayOnly}
          value={this.props.value}
        />
      )
    } else {
      switch (this.props.meta.displayDataType) {
        case ObjectEditor.displayTypes.CHECKBOX:
          field = (
            <Field name={this.props.objPath}
              onChange={((event, value) => this.props.onChange(event, value, this.props.objPath))} 
              className='checkboxfill' 
              component='input' 
              type={this.props.meta.displayDataType} 
              value={this.props.value} 
            />
          )
          break
        case ObjectEditor.displayTypes.MULTI_SELECT:
          field = (
            <Field
              onChange={((event, value) => this.props.onChange(event, value, this.props.objPath))} 
              name={this.props.objPath}
              component={FieldComponents.renderMultiselect}
              data={options}
              value={this.props.value}
            />
          )
          break
        case ObjectEditor.displayTypes.DROPDOWN_LIST:
          // when we get fancier with the options we can include on the <Field> tag:
          // valueField="value"
          // textField="displayName"
          // for options that look like: {displayName: 'Feeder Fiber', value: 'FEEDER'}
          field = (
            <Field
              onChange={((event, value) => this.props.onChange(event, value, this.props.objPath))} 
              name={this.props.objPath}
              component={FieldComponents.renderDropdownList}
              data={options}
              value={this.props.value}
            />
          )
          break
        case ObjectEditor.displayTypes.SELECT_LIST:
          field = (
            <Field
              onChange={((event, value) => this.props.onChange(event, value, this.props.objPath))} 
              name={this.props.objPath}
              component={FieldComponents.renderSelectList}
              data={options}
              value={this.props.value}
            />
          )
          break
        default:
          field = (
            <Field name={this.props.objPath}
              onChange={((event, value) => this.props.onChange(event, value, this.props.objPath))} 
              className='form-control form-control-sm' 
              component='input' 
              type={this.props.meta.displayDataType} 
              value={this.props.value}
            />
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

export default AroFeatureEditor
