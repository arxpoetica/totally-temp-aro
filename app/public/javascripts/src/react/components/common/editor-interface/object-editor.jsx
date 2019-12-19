import React, { Component } from 'react'
import { Field, reduxForm } from 'redux-form'

export class ObjectEditor extends Component {
  constructor (props) {
    super(props)

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
          if (prop._meta.type === 'object') {
            // jsxItems.push(this.renderObject(prop, key, newPropChain + '.', depth + 1))
            jsxItems.push(<ObjectEditor key={newPropChain} metaData={prop} title={key} propChain={newPropChain + '.'} depth={depth + 1}></ObjectEditor>)
          } else {
            jsxItems.push(this.renderItem(prop._meta.type, key, newPropChain))
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

  renderItem (inputType, name, propChain) {
    var field = ''
    switch (inputType) {
      case 'checkbox':
        field = (
          <Field name={propChain}
            className='checkboxfill' component='input' type={inputType} />
        )
        break;
      default:
        field = (
          <Field name={propChain}
            className='form-control form-control-sm' component='input' type={inputType} />
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

  toggleFoldout () {
    this.setState({ isOpen: !this.state.isOpen })
    console.log(this.state.isOpen)
  }
}
/*
let NetworkArchitectureForm = reduxForm({
  form: Constants.NETWORK_ARCHITECTURE
})(NetworkArchitecture)
*/

ObjectEditor.defaultProps = {
  metaData: null,
  title: 'Object',
  propChain: '',
  depth: 0
}

export default ObjectEditor
