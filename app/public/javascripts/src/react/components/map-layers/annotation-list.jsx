import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import { connect } from 'react-redux'
import MapLayerActions from './map-layer-actions'

export class AnnotationList extends Component {
  constructor (props) {
    super(props)
    this.onAddAnnotationClicked = this.onAddAnnotationClicked.bind(this)
  }

  render () {
    return <div>
      <table className='table table-sm table-striped'>
        <tbody>
          {Object.keys(this.props.annotations).map(annotationKey => {
            const annotation = this.props.annotations[annotationKey]
            return <tr>
              <td>{annotation.id}</td>
              <td>{annotation.name}</td>
              <td>
                <button className='btn btn-sm btn-danger'
                  onClick={() => this.props.removeAnnotation(annotation)}
                >
                  <i className='fa fa-trash-alt' />
                </button>
              </td>
            </tr>
          })}
        </tbody>
      </table>
      <button
        className='btn btn-sm btn-primary'
        onClick={event => this.onAddAnnotationClicked(event)}
        >
        Add
      </button>
    </div>
  }

  onAddAnnotationClicked (event) {
    const maxAnnotationId = Math.max(Object.keys(this.props.annotations)) || 0
    this.props.addAnnotation({
      id: maxAnnotationId + 1,
      name: 'New Annotation'
    })
  }
}

AnnotationList.propTypes = {
}

const mapStateToProps = state => ({
  annotations: state.mapLayers.annotation.collections
})

const mapDispatchToProps = (dispatch) => ({
  addAnnotation: annotation => dispatch(MapLayerActions.addAnnotation(annotation)),
  removeAnnotation: annotation => dispatch(MapLayerActions.removeAnnotation(annotation))
})

const AnnotationListComponent = connect(mapStateToProps, mapDispatchToProps)(AnnotationList)
export default AnnotationListComponent
