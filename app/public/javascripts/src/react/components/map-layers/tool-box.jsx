import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import AnnotationList from './annotation-list.jsx'

export class ToolBox extends Component {
  constructor (props) {
    super(props)
    this.state = {
      isExpanded: true
    }
  }

  render () {
    // Position component so that it appears just below the toolbar.
    return <div className='card' style={ { position: 'absolute', top: '47px', left: '80px', width: '300px'} }>
      <div
        className='card-header map-tools-card-header bg-light text-dark p-1'
        style={{ cursor: 'pointer' }}
        onClick={() => this.setState({isExpanded: !this.state.isExpanded})}
      >
        <span style={ { fontSize: '12px' }}>Toolbox: Map Annotations</span>
        <i className={'float-right ' + (this.state.isExpanded ? 'fa fa-chevron-up' : 'fa fa-chevron-down')} style={{ lineHeight: '20px'}} />
      </div>
      <div className='card-body p-2' style={{ fontSize: '12px', display: this.state.isExpanded ? 'block' : 'none' }}>
        <AnnotationList />
      </div>
    </div>
  }
}

ToolBox.propTypes = {
}

const mapStateToProps = state => ({
})

const mapDispatchToProps = (dispatch) => ({
})

const ToolBoxComponent = wrapComponentWithProvider(reduxStore, ToolBox, mapStateToProps, mapDispatchToProps)
export default ToolBoxComponent
