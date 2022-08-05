import React, { useState } from 'react'
import { PropTypes } from 'prop-types'
import { connect } from 'react-redux'
import { constants } from './shared'
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
    dragEvent.dataTransfer.setData(constants.DRAG_DROP_ENTITY_KEY, entityType)
    dragEvent.dataTransfer.setData(constants.DRAG_DROP_ENTITY_DETAILS_KEY, entityDetails)
    dragEvent.dataTransfer.setData(constants.DRAG_DROP_GRAB_OFFSET_X, dragEvent.nativeEvent.offsetX)
    dragEvent.dataTransfer.setData(constants.DRAG_DROP_GRAB_OFFSET_Y, dragEvent.nativeEvent.offsetY)
    dragEvent.dataTransfer.setData(constants.DRAG_DROP_GRAB_ICON_W, aspect.width)
    dragEvent.dataTransfer.setData(constants.DRAG_DROP_GRAB_ICON_H, aspect.height)
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
      <div className="node-wrap">
        <img src={icon} onLoad={onImageLoad} />
      </div>
      <style jsx>{`
        .node {
          position: relative;
          width: 50px;
          height: 50px;
          background-color: #f3f3f3;
          border: 1px solid transparent;
          transition: all 0.2s ease-in-out;
          cursor: pointer;
        }
        .node:hover {
          background-color: #e1e1e1;
          border-color: #cccccc;
        }
        .node-wrap {
          display: flex;
          justify-content: center;
          align-items: center;
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
        }
      `}</style>
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
