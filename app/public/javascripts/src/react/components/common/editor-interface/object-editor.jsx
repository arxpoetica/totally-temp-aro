import React, { Component } from 'react'
import { Field, reduxForm } from 'redux-form'

import Multiselect from 'react-widgets/lib/Multiselect'
import DropdownList from 'react-widgets/lib/DropdownList'
import SelectList from 'react-widgets/lib/SelectList'

export class ObjectEditor extends Component {
  constructor (props) {
    super(props)

    this.isCollapsible = props.collapsible
    var isOpen = !props.depth // true // !props.depth
    if (!this.isCollapsible) {
      isOpen = true
    }

    this.state = {
      isOpen: isOpen
    }
  }

  render () {
    if (!this.props.metaData) return ''
    return this.renderObject(this.props.metaData, this.props.title, this.props.propChain, this.props.depth)
  }

  // we're using recursion so we gaurd against edge case
  renderObject (meta, name, propChain, depth) {
    if (depth > 200) return <div>...</div>
    var jsxItems = []
    if (this.state.isOpen) {
      Object.keys(meta).forEach(key => {
        if (key !== '_meta') {
          var prop = meta[key]
          var newPropChain = propChain + key
          if (prop._meta.displayType === ObjectEditor.displayTypes.OBJECT) {
            jsxItems.push(<ObjectEditor key={newPropChain} metaData={prop} title={key} propChain={newPropChain + '.'} depth={depth + 1} leftIndent={this.props.leftIndent} handleChange={this.props.handleChange} displayOnly={this.props.displayOnly} collapsible></ObjectEditor>)
          } else {
            jsxItems.push(this.renderItem(prop._meta, key, newPropChain))
          }
        }
      })
    }

    return (
      <div className='ei-items-contain object-editor' key={propChain}>
        <div className='ei-foldout'>
          <div className={`ei-header ${this.isCollapsible ? '' : 'ei-no-pointer'}`} onClick={() => this.toggleFoldout()} >
            {this.isCollapsible
              ? (this.state.isOpen
                ? <i className='far fa-minus-square ei-foldout-icon' ng-if='$ctrl.isKeyExpanded[foldoutIndex]'></i>
                : <i className='far fa-plus-square ei-foldout-icon' ng-if='!$ctrl.isKeyExpanded[foldoutIndex]'></i>
              )
              : ''
            }
            {name}
          </div>
          <div className='ei-gen-level ei-internal-level' style={{ paddingLeft: this.props.leftIndent + 'px' }}>
            <div className='ei-items-contain'>
              {jsxItems}
            </div>
          </div>
          {this.isCollapsible
            ? (this.state.isOpen
              ? <div className='ei-foldout-state-label-bottom'
                onClick={() => this.toggleFoldout()}>[ - ]</div>
              : ''
            )
            : ''
          }
        </div>
      </div>
    )
  }

  renderItem (meta, name, propChain) {
    var field = ''

    if (this.props.displayOnly || meta.displayOnly) {
      field = (
        <Field
          onChange={this.props.handleChange}
          name={propChain}
          component={FieldComponents.renderDisplayOnly}
        />
      )
    } else {
      switch (meta.displayType) {
        case ObjectEditor.displayTypes.CHECKBOX:
          field = (
            <Field name={propChain}
              onChange={this.props.handleChange}
              className='checkboxfill' component='input' type={meta.displayType} />
          )
          break
        case ObjectEditor.displayTypes.MULTI_SELECT:
          field = (
            <Field
              onChange={this.props.handleChange}
              name={propChain}
              component={FieldComponents.renderMultiselect}
              data={meta.options}
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
              onChange={this.props.handleChange}
              name={propChain}
              component={FieldComponents.renderDropdownList}
              data={meta.options}
            />
          )
          break
        case ObjectEditor.displayTypes.SELECT_LIST:
          field = (
            <Field
              onChange={this.props.handleChange}
              name={propChain}
              component={FieldComponents.renderSelectList}
              data={meta.options}
            />
          )
          break
        default:
          field = (
            <Field name={propChain}
              onChange={this.props.handleChange}
              className='form-control form-control-sm' component='input' type={meta.displayType} />
          )
      }
    }

    return (
      <div className='ei-property-item' key={propChain}>
        <div className='ei-property-label'>
          {name}
        </div>
        <div className='ei-property-value'>
          {field}
        </div>
      </div>
    )
  }

  // --- //

  toggleFoldout () {
    if (this.isCollapsible) this.setState({ isOpen: !this.state.isOpen })
  }
}

ObjectEditor.defaultProps = {
  metaData: null,
  title: 'Object',
  propChain: '',
  displayOnly: false,
  depth: 0,
  leftIndent: 21,
  collapsible: false,
  handleChange: (...args) => {}
}

ObjectEditor.displayTypes = {
  OBJECT: 'object',
  TEXT: 'text',
  NUMBER: 'number',
  CHECKBOX: 'checkbox',
  MULTI_SELECT: 'multiSelect',
  DROPDOWN_LIST: 'dropdownList',
  SELECT_LIST: 'selectList'
}
Object.freeze(ObjectEditor.displayTypes)

// --- utility functions --- //

ObjectEditor.addMeta = (prop, ...args) => {
  var meta = new ObjectEditorMeta( ...args)
  // return { ...prop, _meta: meta }
  return { _meta: meta }
}

ObjectEditor.buildMeta = (prop) => {
  var meta = {}
  var type = typeof prop
  if (type === 'object') {
    // run iterative
    meta = ObjectEditor.addMeta(prop, ObjectEditor.displayTypes.OBJECT)
    Object.keys(prop).forEach(key => {
      if (key !== '_meta') {
        meta[key] = ObjectEditor.buildMeta(prop[key])
      }
    })
    return meta
  } else {
    var displayType = ObjectEditor.displayTypes.TEXT
    switch (type) {
      case 'number':
        displayType = ObjectEditor.displayTypes.NUMBER
        break
      case 'boolean':
        displayType = ObjectEditor.displayTypes.CHECKBOX
        break
    }
    return ObjectEditor.addMeta(prop, displayType)
  }
}

export class ObjectEditorMeta {
  constructor (displayType, displayName = '', options = []) {
    this.displayType = displayType
    this.displayName = displayName
    this.options = options
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

export default ObjectEditor
