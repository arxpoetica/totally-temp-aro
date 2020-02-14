import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import AnnotationList from './annotation-list.jsx'

export class ToolBox extends Component {
  render () {
    return <div className='card' style={ { position: 'absolute', bottom: '30px', left: '5px', width: '300px'} }>
      <div className='card-header map-tools-card-header bg-primary text-white'>
        Toolbox: Map Annotations
      </div>
      <div className='card-body'>
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
