import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import AnnotationList from './annotation-list.jsx'

export class ToolBox extends Component {
  render () {
    return <div style={ { position: 'absolute', top: '100px', left: '100px', width: '300px', backgroundColor: '#eeeeee', border: 'solid 1px #a0a0a0'} }>
      <AnnotationList />
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
