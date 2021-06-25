import React, { Component } from "react";

class Foldout extends Component {
  constructor (props) {
    super(props)

    this.state = {
      isOpen: props.isOpen || false,
      isCollapsible: props.isCollapsible || true,
    }
  }

  _onClick (event, isOpen) {
    this.setState({isOpen})
    if (this.props.onClick) this.props.onClick(event, isOpen)
  }

  render () {
    let isOpen = this.props.isOpen || this.state.isOpen
    return (
      <div className='ei-foldout'>
        <div className={`ei-header ${this.state.isCollapsible ? '' : 'ei-no-pointer'}`} onClick={event => this._onClick(event, !isOpen)} >
          {this.state.isCollapsible
            ? (this.isOpen
              ? <i className='far fa-minus-square ei-foldout-icon' ng-if='$ctrl.isKeyExpanded[foldoutIndex]'></i>
              : <i className='far fa-plus-square ei-foldout-icon' ng-if='!$ctrl.isKeyExpanded[foldoutIndex]'></i>
            )
            : ''
          }
          {this.props.displayName}
        </div>
        <div className='ei-gen-level ei-internal-level' style={{ paddingLeft: this.props.leftIndent + 'px' }}>
          <div className='ei-items-contain'>
            {this.props.children}
          </div>
        </div>
        {this.isCollapsible
          ? (isOpen
            ? <div className='ei-foldout-state-label-bottom'
              onClick={() => this.toggleFoldout()}>[ - ]</div>
            : ''
          )
          : ''
        }
      </div>
    )
  }
}

export default Foldout
