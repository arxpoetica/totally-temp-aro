import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import PlanEditorActions from './plan-editor-actions'
import { Input } from '../common/forms/Input.jsx'

const fieldOptions = ['route', 'fiberSize', 'fiberCount', 'buildType']

const FiberThumbs = (props) => {
  const {
    selectedFiber,
    setSelectedFiber,
    setFiberAnnotations,
    fiberAnnotations,
    selectedSubnetId,
  } = props

  const [formValues, setFormValues] = useState({})
  const [formPlaceholders, setFormPlaceHolders] = useState({})

  useEffect(() => {
    if (selectedFiber.length === 1 && fiberAnnotations[selectedSubnetId]) {
      // if only one route selected, just set the values
      const selectedFiberAnnotations = fiberAnnotations[selectedSubnetId].find(
        (annotation) =>
          annotation.fromNode === selectedFiber[0].fromNode &&
          annotation.toNode === selectedFiber[0].toNode,
      )
      if (selectedFiberAnnotations && selectedFiberAnnotations.annotations) {
        setFormValues(selectedFiberAnnotations.annotations)
      }
    } else if (selectedFiber.length > 1 && fiberAnnotations[selectedSubnetId]) {
      const annotationObject = {} // used for comparison to see if fields are identical
      // { [name]: ['test', 'test2'] } more than one value means switch to placeholder

      // for each selected fiber segment
      selectedFiber.forEach((fiberRoute) => {
        const selectedFiberAnnotations = fiberAnnotations[
          selectedSubnetId
        ].find(
          (annotation) =>
            annotation.fromNode === fiberRoute.fromNode &&
            annotation.toNode === fiberRoute.toNode,
        )
        if (selectedFiberAnnotations) {
          // for each field in the annotations
          Object.entries(selectedFiberAnnotations.annotations).forEach(
            ([key, newValue]) => {
              const values = annotationObject[key]
              // if it doesn't exist yet: set the value
              if (!values) {
                annotationObject[key] = [newValue]
              }
              // they aren't equal push the new value
              else if (!values.includes(newValue)) {
                annotationObject[key].push(newValue)
              }
            },
          )
        }
      })
      const newFormValues = {} // values for form in state
      const newPlaceholders = {} // for multiple values set as placeholders instead

      Object.entries(annotationObject).forEach(([field, values]) => {
        if (values.length === 1)
          newFormValues[field] = annotationObject[field][0]
        else newPlaceholders[field] = annotationObject[field].join(', ')
      })
      setFormPlaceHolders(newPlaceholders)
      setFormValues(newFormValues)
    }

    return () => {
      setFormValues({})
      setFormPlaceHolders({})
    }
  }, [selectedFiber, fiberAnnotations, setFormPlaceHolders, setFormValues])

  function deselectFiber() {
    setSelectedFiber([])
  }

  function handleChange(event) {
    const { value, name } = event.target
    setFormValues({ ...formValues, [name]: value })
  }

  function handleBlur() {
    const subnetAnnotations = fiberAnnotations[selectedSubnetId]
    selectedFiber.forEach((fiberRoute) => {
      if (subnetAnnotations) {
        const annotation = subnetAnnotations.find(
          (annotation) =>
            annotation.fromNode === fiberRoute.fromNode &&
            annotation.toNode === fiberRoute.toNode,
        )
        if (annotation && annotation.annotations) {
          annotation.annotations = { ...annotation.annotations, ...formValues }
        } else {
          const newAnnotation = {
            fromNode: fiberRoute.fromNode,
            toNode: fiberRoute.toNode,
            annotations: formValues,
          }
          subnetAnnotations.push(newAnnotation)
        }
      }
    })

    setFiberAnnotations({ [selectedSubnetId]: subnetAnnotations })
  }

  //TODO: right now the fields are hardcoded, for route, fiber size, etc. later this will change to be dynamic
  return (
    <>
      {selectedFiber.length > 0 && (
        <div className={'plan-editor-thumb-fiber plan-editor-thumb'}>
          <div className="info">
            <h2>Fiber Route{selectedFiber.length > 1 && 's'}</h2>
          </div>
          <div>
            {/* Map options for input */}
            {fieldOptions.map((fieldOption) => (
              <div
                className="plan-editor-thumb-input-container"
                key={fieldOption}
              >
                {fieldOption}
                <Input
                  value={formValues[fieldOption]}
                  name={fieldOption}
                  onChange={(event) => handleChange(event)}
                  onBlur={(event) => handleBlur(event)}
                  placeholder={formPlaceholders[fieldOption]}
                  disabled={formPlaceholders[fieldOption]}
                  classes={'aro-input-black fiber-annotation'}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-sm plan-editor-thumb-close"
            aria-label="Close"
            onClick={() => deselectFiber()}
          >
            <i className="fa fa-times"></i>
          </button>
        </div>
      )}
    </>
  )
}

const mapStateToProps = (state) => ({
  selectedFiber: state.planEditor.selectedFiber,
  fiberAnnotations: state.planEditor.fiberAnnotations,
  selectedSubnetId: state.planEditor.selectedSubnetId,
})

const mapDispatchToProps = (dispatch) => ({
  setSelectedFiber: (fiberNames) =>
    dispatch(PlanEditorActions.setSelectedFiber(fiberNames)),
  setFiberAnnotations: (fiberAnnotations) =>
    dispatch(PlanEditorActions.setFiberAnnotations(fiberAnnotations)),
})

export default connect(mapStateToProps, mapDispatchToProps)(FiberThumbs)
