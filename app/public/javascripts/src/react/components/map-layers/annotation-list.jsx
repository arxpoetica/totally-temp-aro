import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import { connect } from 'react-redux'
import MapLayerActions from './map-layer-actions'
import AnnotationMapObjects from './annotation-map-objects.jsx'

export class AnnotationList extends Component {
  constructor (props) {
    super(props)
    this.onAddAnnotationClicked = this.onAddAnnotationClicked.bind(this)
    this.onClearAllAnnotationsClicked = this.onClearAnnotationsClicked.bind(this)
  }

  render () {
    const NUM_ANNOTATIONS_TO_CLEAR = 1  // Clear 100 of the oldest annotations
    return <div className='text-center'>
      <p>Annotations will be auto-saved as you draw them.</p>
      <button className='btn btn-danger btn-sm mr-2'
        onClick={() => this.onClearAnnotationsClicked(NUM_ANNOTATIONS_TO_CLEAR)}
      >
        <i className='fa fa-trash-alt pr-1' />Clear old geometries
      </button>
      <button className='btn btn-danger btn-sm'
        onClick={() => this.onClearAnnotationsClicked(this.props.annotations[0].geometries.length)}
      >
        <i className='fa fa-trash-alt pr-1' />Clear All
      </button>
      <AnnotationMapObjects />
    </div>
  }

  onAddAnnotationClicked (event) {
    const maxAnnotationId = Math.max(Object.keys(this.props.annotations)) || 0
    this.props.addAnnotation({
      id: maxAnnotationId + 1,
      name: 'New Annotation'
    })
  }

  onClearAnnotationsClicked (numberToClear) {
    // Clears the oldest annotations
    this.props.clearOlderAnnotations(numberToClear)
    this.props.saveAnnotationsForUser(this.props.userId, this.props.annotations)
      .then(() => this.props.loadAnnotationsForUser(this.props.userId))
      .catch(err => console.error(err))
  }

  componentDidMount () {
    this.props.loadAnnotationsForUser(this.props.userId)
  }
}

AnnotationList.propTypes = {
}

const mapStateToProps = state => ({
  annotations: state.mapLayers.annotation.collections,
  userId: state.user.loggedInUser.id
})

const mapDispatchToProps = (dispatch) => ({
  loadAnnotationsForUser: userId => dispatch(MapLayerActions.loadAnnotationsForUser(userId)),
  saveAnnotationsForUser: (userId, annotations) => dispatch(MapLayerActions.saveAnnotationsForUser(userId, annotations)),
  clearOlderAnnotations: numberToClear => dispatch(MapLayerActions.clearOlderAnnotations(numberToClear))
})

const AnnotationListComponent = connect(mapStateToProps, mapDispatchToProps)(AnnotationList)
export default AnnotationListComponent
