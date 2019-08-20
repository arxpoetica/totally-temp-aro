import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import Constants from '../../common/constants'

export class DraggableButton extends Component {
  constructor (props) {
    super(props)
    this.state = {
      imageWidth: 0,
      imageHeight: 0
    }
    this.onImageLoad = this.onImageLoad.bind(this)
  }

  render () {
    return <button
      className='btn btn-light'
      style={{ border: 'none' }}
      onDragStart={dragEvent => this.handleDragEvent(dragEvent)}
    >
      <img
        src={this.props.icon}
        onLoad={this.onImageLoad}
      />
    </button>
  }

  handleDragEvent (dragEvent) {
    dragEvent.dataTransfer.setData(Constants.DRAG_DROP_ENTITY_KEY, this.props.entityType)
    dragEvent.dataTransfer.setData(Constants.DRAG_DROP_ENTITY_DETAILS_KEY, this.props.entityDetails)

    dragEvent.dataTransfer.setData(Constants.DRAG_DROP_GRAB_OFFSET_X, dragEvent.nativeEvent.offsetX)
    dragEvent.dataTransfer.setData(Constants.DRAG_DROP_GRAB_OFFSET_Y, dragEvent.nativeEvent.offsetY)
    dragEvent.dataTransfer.setData(Constants.DRAG_DROP_GRAB_ICON_W, this.state.imageWidth)
    dragEvent.dataTransfer.setData(Constants.DRAG_DROP_GRAB_ICON_H, this.state.imageHeight)

    if (this.props.isBoundary) {
      dragEvent.dataTransfer.setData(Constants.DRAG_IS_BOUNDARY, 'true')
    }
    return true
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

export default DraggableButton
