import React, { useState } from 'react'
import { PropTypes } from 'prop-types'
import { connect } from 'react-redux'
import Constants from './constants'
import PlanEditorActions from './plan-editor-actions'

export const DraggableNode = props => {

  const {
    entityType,
    entityDetails,
    icon,
  	startDragging,
  	stopDragging,
    label,
  } = props

  const [aspect, setAspect] = useState({ width: 0, height: 0 })

  function handleDragStart(dragEvent) {
    startDragging()
    dragEvent.dataTransfer.setData(Constants.DRAG_DROP_ENTITY_KEY, entityType)
    dragEvent.dataTransfer.setData(Constants.DRAG_DROP_ENTITY_DETAILS_KEY, entityDetails)
    dragEvent.dataTransfer.setData(Constants.DRAG_DROP_GRAB_OFFSET_X, dragEvent.nativeEvent.offsetX)
    dragEvent.dataTransfer.setData(Constants.DRAG_DROP_GRAB_OFFSET_Y, dragEvent.nativeEvent.offsetY)
    dragEvent.dataTransfer.setData(Constants.DRAG_DROP_GRAB_ICON_W, aspect.width)
    dragEvent.dataTransfer.setData(Constants.DRAG_DROP_GRAB_ICON_H, aspect.height)
    return true
  }

  function handleDragEnd() {
    stopDragging()
  }

  function onImageLoad(event) {
    setAspect({
      width: event.target.width,
      height: event.target.height,
    })
  }

  return (
    <div
      className="node"
      title={label}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <img src={icon} onLoad={onImageLoad} />
    </div>
  )

}

DraggableNode.propTypes = {
  entityType: PropTypes.string,
  entityDetails: PropTypes.string,
  icon: PropTypes.string,
  label: PropTypes.string,
}

const mapStateToProps = (state) => ({})

const mapDispatchToProps = dispatch => ({
  startDragging: () => dispatch(PlanEditorActions.setIsDraggingFeatureForDrop(true)),
  stopDragging: () => dispatch(PlanEditorActions.setIsDraggingFeatureForDrop(false)),
})

export default connect(mapStateToProps, mapDispatchToProps)(DraggableNode)
