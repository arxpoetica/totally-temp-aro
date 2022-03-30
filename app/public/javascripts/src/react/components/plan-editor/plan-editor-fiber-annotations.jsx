import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import PlanEditorActions from './plan-editor-actions'
import PlanEditorSelectors from './plan-editor-selectors'
import { Input } from '../common/forms/Input.jsx'

const fieldOptions = [
  { name: 'route', label: 'Route' },
  { name: 'fiberSize', label: 'Fiber Size' },
  { name: 'fiberCount', label: 'Fiber Count' },
  { name: 'buildType', label: 'BuildType' },
]

const FiberAnnotations = (props) => {
  const {
    selectedFiber,
    setSelectedFiber,
    setFiberAnnotations,
    fiberAnnotations,
    selectedSubnetId,
    subnetFeatures,
    rootSubnetIdForChild,
    subnets
  } = props

  const [formValues, setFormValues] = useState({})
  const [formPlaceholders, setFormPlaceHolders] = useState({})

  useEffect(() => {
    // this useEffect is for pulling the annotations from state
    if (selectedFiber.length === 1 && fiberAnnotations[rootSubnetIdForChild]) {
      // if only one route selected, just set the values
      const selectedFiberAnnotations = fiberAnnotations[rootSubnetIdForChild].find(
        (annotation) =>
          annotation.fromNode === selectedFiber[0].fromNode &&
          annotation.toNode === selectedFiber[0].toNode,
      )
      if (selectedFiberAnnotations && selectedFiberAnnotations.annotations) {
        setFormValues(selectedFiberAnnotations.annotations)
      }
    } else if (selectedFiber.length > 1 && fiberAnnotations[rootSubnetIdForChild]) {
      // if multiple routes are selected, compare the values to see if they match
      // if there is only one value, set it and make it editable
      // if there are multiple values, display the multiple values as a placeholder
      const annotationObject = {} // used for comparison to see if fields are identical
      // { [name]: { values: ['test'], label: 'label' } more than one value means switch to placeholder

      // for each selected fiber segment
      selectedFiber.forEach((fiberRoute) => {
        const selectedFiberAnnotations = fiberAnnotations[
          rootSubnetIdForChild
        ].find(
          (annotation) =>
            annotation.fromNode === fiberRoute.fromNode &&
            annotation.toNode === fiberRoute.toNode,
        )
        if (selectedFiberAnnotations) {
          // for each field in the annotations
          Object.entries(selectedFiberAnnotations.annotations).forEach(
            ([key, newValue]) => {
              const annotations = annotationObject[key]
              // if it doesn't exist yet: set the value
              if (!annotations) {
                annotationObject[key] = {
                  values: [newValue.value],
                  label: newValue.label,
                }
              }
              // they aren't equal push the new value
              else if (!annotations.values.includes(newValue.value)) {
                annotationObject[key].values.push(newValue.value)
              }
            },
          )
        }
      })
      const newFormValues = {} // values for form in state
      const newPlaceholders = {} // for multiple values set as placeholders instead

      Object.entries(annotationObject).forEach(([field, object]) => {
        // if the length is one, there is a single value, set it and keep it editable
        if (object.values && object.values.length === 1)
          newFormValues[field] = {
            value: annotationObject[field].values[0],
            label: annotationObject[field].label,
          }
        // otherwise set the multiple values as the placeholder text
        else newPlaceholders[field] = annotationObject[field].values.join(', ')
      })
      setFormPlaceHolders(newPlaceholders)
      setFormValues(newFormValues)
    }

    return () => {
      setFormValues({})
      setFormPlaceHolders({})
    }
  }, [selectedFiber, fiberAnnotations, setFormPlaceHolders, setFormValues, selectedSubnetId])

  function deselectFiber() {
    setSelectedFiber([])
  }

  function handleChange(event, label) {
    const { value, name } = event.target
    setFormValues({ ...formValues, [name]: { value, label } })
  }

  function saveAnnotations() {
    const subnetAnnotations = fiberAnnotations[rootSubnetIdForChild]
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

    setFiberAnnotations(
      { [rootSubnetIdForChild]: subnetAnnotations },
      rootSubnetIdForChild,
    )
  }

  //TODO: right now the fields are hardcoded, for route, fiber size, etc. later this will change to be dynamic
  return (
    <>
      {selectedFiber.length > 0 
        && rootSubnetIdForChild 
        && subnetFeatures[rootSubnetIdForChild] 
        && subnetFeatures[rootSubnetIdForChild].feature.networkNodeType === "central_office"
        && (
        !subnets[selectedSubnetId]
        || (
          subnets[selectedSubnetId]
          && !subnets[selectedSubnetId].parentSubnetId
          )
        )
        && (
        <div className={'fiber-annotations plan-editor-thumb'}>
          <div className="info">
            <h2>Fiber Route{selectedFiber.length > 1 && 's'}</h2>
          </div>
          
          {/* Map options for input */}
          {fieldOptions.map((fieldOption) => (
            <div
              className="annotation-input"
              key={fieldOption.name}
            >
              {fieldOption.label}
              <Input
                value={
                  formValues[fieldOption.name] &&
                  formValues[fieldOption.name].value
                }
                name={fieldOption.name}
                onChange={(event) => handleChange(event, fieldOption.label)}
                placeholder={formPlaceholders[fieldOption.name]}
                disabled={formPlaceholders[fieldOption.name]}
                classes={'black fiber-annotation'}
              />
            </div>
          ))}
          
          <div className="save-button">
            <button
              type="button"
              className="btn btn-sm btn-primary fiber-thumb-btn"
              onClick={() => saveAnnotations()}
            >
              Save
            </button>
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
  subnetFeatures: state.planEditor.subnetFeatures,
  subnets: state.planEditor.subnets,
  rootSubnetIdForChild: PlanEditorSelectors.getRootSubnetIdForChild(state)
})

const mapDispatchToProps = (dispatch) => ({
  setSelectedFiber: (fiberNames) =>
    dispatch(PlanEditorActions.setSelectedFiber(fiberNames)),
  setFiberAnnotations: (fiberAnnotations, subnetId) =>
    dispatch(PlanEditorActions.setFiberAnnotations(fiberAnnotations, subnetId)),
})

export default connect(mapStateToProps, mapDispatchToProps)(FiberAnnotations)
