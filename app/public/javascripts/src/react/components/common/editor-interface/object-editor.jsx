import React, { Component } from 'react'
import { Field, reduxForm } from 'redux-form'

import Multiselect from 'react-widgets/lib/Multiselect'
import DropdownList from 'react-widgets/lib/DropdownList'
import SelectList from 'react-widgets/lib/SelectList'

export class ObjectEditor extends Component {

  constructor (props) {
    super(props)
    console.log(props)
    this.state = {
      isOpen: true // !props.depth
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
            // jsxItems.push(this.renderObject(prop, key, newPropChain + '.', depth + 1))
            jsxItems.push(<ObjectEditor key={newPropChain} metaData={prop} title={key} propChain={newPropChain + '.'} depth={depth + 1}></ObjectEditor>)
          } else {
            jsxItems.push(this.renderItem(prop._meta, key, newPropChain))
          }
        }
      })
    }

    return (
      <div className='ei-items-contain object-editor' key={propChain}>
        <div className='ei-foldout'>
          <div className='ei-header' onClick={() => this.toggleFoldout()}>
            {this.state.isOpen
              ? <i className='far fa-minus-square ei-foldout-icon' ng-if='$ctrl.isKeyExpanded[foldoutIndex]'></i>
              : <i className='far fa-plus-square ei-foldout-icon' ng-if='!$ctrl.isKeyExpanded[foldoutIndex]'></i>
            }
            {name}
          </div>
          <div className='ei-gen-level ei-internal-level' style={{ paddingLeft: '21px' }}>
            <div className='ei-items-contain'>
              {jsxItems}
            </div>
          </div>
          {this.state.isOpen
            ? <div className='ei-foldout-state-label-bottom'
              onClick={() => this.toggleFoldout()}>[ - ]</div>
            : ''
          }
        </div>
      </div>
    )
  }

  renderItem (meta, name, propChain) {
    var field = ''
    switch (meta.displayType) {
      case ObjectEditor.displayTypes.CHECKBOX:
        field = (
          <Field name={propChain}
            className='checkboxfill' component='input' type={meta.displayType} />
        )
        break
      case ObjectEditor.displayTypes.MULTI_SELECT:
        field = (
          <Field
            name={propChain}
            component={this.renderMultiselect}
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
            name={propChain}
            component={this.renderDropdownList}
            data={meta.options}
          />
        )
        break
      case ObjectEditor.displayTypes.SELECT_LIST:
        field = (
          <Field
            name={propChain}
            component={this.renderSelectList}
            data={meta.options}
          />
        )
        break
      default:
        field = (
          <Field name={propChain}
            className='form-control form-control-sm' component='input' type={meta.displayType} />
        )
    }

    return (
      <div className='ei-property-item' key={propChain}>
        <div className='ei-property-label'>
          {name}
        </div>
        <div>
          {field}
        </div>
      </div>
    )
  }

  // --- react-widgets wrappers --- //

  renderMultiselect ({ input, ...rest }) {
    return (
      <Multiselect {...input}
        onBlur={() => input.onBlur()}
        value={input.value || []} // requires value to be an array
        {...rest} />
    )
  }

  renderDropdownList ({ input, ...rest }) {
    return <DropdownList {...input} {...rest} />
  }

  renderSelectList ({ input, ...rest }) {
    return <SelectList {...input} onBlur={() => input.onBlur()} {...rest} />
  }

  // --- //

  toggleFoldout () {
    this.setState({ isOpen: !this.state.isOpen })
    console.log(this.state.isOpen)
  }
}

ObjectEditor.defaultProps = {
  metaData: null,
  title: 'Object',
  propChain: '',
  depth: 0
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
  var meta = new ObjectEditorMeta(args)
  return { ...prop, _meta: meta }
}

export class ObjectEditorMeta {
  constructor (displayType, displayName = '', options = []) {
    this.displayType = displayType
    this.displayName = displayName
    this.options = options
  }
}

export default ObjectEditor
