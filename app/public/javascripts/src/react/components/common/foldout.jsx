import React, { Component } from "react";

class Foldout extends Component {
  constructor (props) {
    super(props)
    this.leftIndent = this.props.leftIndent || 12
    let isCollapsible = props.isCollapsible || true
    let isOpen = props.isOpen || props.initIsOpen || false
    if (!isCollapsible) isOpen = true
    this.state = {
      isOpen: isOpen,
      isCollapsible: isCollapsible,
    }
  }

  componentDidUpdate(prevProps, prevState) {
    // check if initIsOpen updated
    // this is admittedly ugly but react doesn't really have a better way
    // console.log({prevProps, props: this.props})
    // console.log(Object.is(prevProps, this.props))
    // console.log({prevState, state: this.state})
    // console.log(Object.is(prevState, this.state))
    
    if (!('initIsOpen' in this.props)) return
    if (this.props.initIsOpen == this.state.isOpen) return
    let doUpdate = false
    if (this.props.initIsOpen != prevProps.initIsOpen) doUpdate = true
    if (!doUpdate) {
      // if nothing else changed then initIsOpen was probably set from true to true
      // if (JSON.stringify(prevState) == JSON.stringify(this.state)
      //   && JSON.stringify(prevProps) == JSON.stringify(this.props)
      // ) doUpdate = true
    }
    if (doUpdate) this._onClick({}, this.props.initIsOpen)
  }

  _onClick (event, isOpen) {
    this.setState({isOpen})
    if (this.props.onClick) this.props.onClick(event, isOpen)
  }

  render () {
    let isOpen = this.props.isOpen || this.state.isOpen
    return (
      <div className='ei-foldout' style={{ width: "100%" }}>
        <div className={`ei-header ${this.state.isCollapsible ? '' : 'ei-no-pointer'}`} onClick={event => this._onClick(event, !isOpen)} >
          {this.state.isCollapsible
            ? (isOpen
              ? <div className='far fa-minus-square ei-foldout-icon'></div>
              : <div className='far fa-plus-square ei-foldout-icon'></div>
            )
            : ''
          }
          <div className="ei-foldout-header-content">{this.props.displayName}</div>
        </div>
        <div className='ei-gen-level ei-internal-level' style={{ paddingLeft: this.leftIndent + 'px' }}>
          <div className='ei-items-contain'>
            {isOpen
              ? this.props.children
              : <div className='dsCollapsedPlaceholder'
                onClick={event => this._onClick(event, !isOpen)}>...</div>
            }
          </div>
        </div>
        {this.isCollapsible
          ? (isOpen
            ? <div className='ei-foldout-state-label-bottom'
                onClick={event => this._onClick(event, !isOpen)}>[ - ]</div>
            : ''
          )
          : ''
        }
      </div>
    )
  }
}

export default Foldout
