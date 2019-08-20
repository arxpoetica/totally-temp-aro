import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import { connect } from 'react-redux'
import Constants from './constants'
import PlanEditorActions from './plan-editor-actions'

export class DraggableButton extends Component {
  constructor (props) {
    super(props)
    this.state = {
      imageWidth: 0,
      imageHeight: 0
    }
    this.onImageLoad = this.onImageLoad.bind(this)
    this.handleDragStart = this.handleDragStart.bind(this)
    this.handleDragEnd = this.handleDragEnd.bind(this)
  }

  render () {
    return <button
      className='btn btn-light'
      style={{ border: 'none', background: 'none' }}
      onDragStart={this.handleDragStart}
      onDragEnd={this.handleDragEnd}
    >
      <img
        src={this.props.icon}
        onLoad={this.onImageLoad}
      />
    </button>
  }

  handleDragStart (dragEvent) {
    this.props.startDragging()
    dragEvent.dataTransfer.setData(Constants.DRAG_DROP_ENTITY_KEY, this.props.entityType)
    dragEvent.dataTransfer.setData(Constants.DRAG_DROP_ENTITY_DETAILS_KEY, this.props.entityDetails)

    dragEvent.dataTransfer.setData(Constants.DRAG_DROP_GRAB_OFFSET_X, dragEvent.nativeEvent.offsetX)
    dragEvent.dataTransfer.setData(Constants.DRAG_DROP_GRAB_OFFSET_Y, dragEvent.nativeEvent.offsetY)
    dragEvent.dataTransfer.setData(Constants.DRAG_DROP_GRAB_ICON_W, this.state.imageWidth)
    dragEvent.dataTransfer.setData(Constants.DRAG_DROP_GRAB_ICON_H, this.state.imageHeight)
    return true
  }

  handleDragEnd () {
    this.props.stopDragging()
  }

  onImageLoad (e) {
    this.setState({
      imageWidth: e.target.width,
      imageHeight: e.target.height
    })
  }
}

DraggableButton.propTypes = {
  entityType: PropTypes.string,
  entityDetails: PropTypes.string,
  icon: PropTypes.string,
  isBoundary: PropTypes.bool
}

const mapStateToProps = (state) => ({
})

const mapDispatchToProps = dispatch => ({
  startDragging: () => dispatch(PlanEditorActions.setIsDraggingFeatureForDrop(true)),
  stopDragging: () => dispatch(PlanEditorActions.setIsDraggingFeatureForDrop(false))
})

const DraggableButtonComponent = connect(mapStateToProps, mapDispatchToProps)(DraggableButton)
export default DraggableButtonComponent
