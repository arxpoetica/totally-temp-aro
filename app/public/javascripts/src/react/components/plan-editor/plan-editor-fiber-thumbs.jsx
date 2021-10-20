import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import PlanEditorActions from './plan-editor-actions'
import { Input } from '../common/forms/Input.jsx'

const FiberThumbs = (props) => {
  const {
    selectedFiberNames,
    setSelectedFiber,
    setFiberAnnotations,
    fiberAnnotations,
  } = props

  const [formValues, setFormValues] = useState({})
  const [formPlaceholders, setFormPlaceHolders] = useState({})

  useEffect(() => {
    if (selectedFiberNames.length === 1 && fiberAnnotations[selectedFiberNames[0]]) {
      setFormValues(fiberAnnotations[selectedFiberNames[0]])
    } else if (selectedFiberNames.length > 1) {

      const firstSelected = {} // used for comparison to see if fields are identical
      const fieldsIdentical = {} // for each field hold a bool depending on if the values are identical ex: {route: true, fiberSize: false}

      selectedFiberNames.forEach((fiberRoute) => {
        if (fiberAnnotations[fiberRoute]) {
          Object.keys(fiberAnnotations[fiberRoute]).forEach((annotationName) => {
            const value = fiberAnnotations[fiberRoute][annotationName]
            const firstValue = firstSelected[annotationName]
            // if it doesn't exist yet: set the value
            if (!firstValue) {
              firstSelected[annotationName] = value
              fieldsIdentical[annotationName] = true
            }
            // they aren't equal set fieldsIdentical to false and concat strings for displaying multiple values
            else if (firstValue !== value) {
              fieldsIdentical[annotationName] = false
              firstSelected[annotationName] = firstValue.concat(', ', value)
            }
            // if they are equal and haven't been set before, set true
            else if (!fieldsIdentical[annotationName]) fieldsIdentical[annotationName] = true
          })
        }
      })
      const newFormValues = {} // values for form in state
      const newPlaceholders = {} // for multiple values set as placeholders instead

      Object.entries(fieldsIdentical).forEach(([field, value]) => {
        if (value) newFormValues[field] = firstSelected[field]
        else newPlaceholders[field] = firstSelected[field]
      })
      setFormPlaceHolders(newPlaceholders)
      setFormValues(newFormValues)
    }

    return () => {
      setFormValues({})
      setFormPlaceHolders({})
    }
  }, [selectedFiberNames, fiberAnnotations, setFormPlaceHolders, setFormValues])

  function deselectFiber() {
    setSelectedFiber([])
  }

  function handleChange(event) {
    const { value, name } = event.target
    setFormValues({ ...formValues, [name]: value })
  }

  function handleBlur(event) {
    const { value, name } = event.target

    selectedFiberNames.forEach((fiberName) => {
      fiberAnnotations[fiberName] = {
        ...fiberAnnotations[fiberName],
        [name]: value,
      }
    })

    setFiberAnnotations(fiberAnnotations)
  }
//TODO: right now the fields are hardcoded, for route, fiber size, etc. later this will change to be dynamic
  return (
    <>
      {selectedFiberNames.length > 0 && (
        <div className={'plan-editor-thumb-fiber plan-editor-thumb'}>
          <div className="info">
            <h2>Fiber Route</h2>
          </div>
          <div className="subinfo">{selectedFiberNames.join(', ')}</div>
          <div>
            <div className="plan-editor-thumb-input-container">
              Route:
              <Input
                value={formValues.route}
                name="route"
                onChange={(event) => handleChange(event)}
                onBlur={(event) => handleBlur(event)}
                placeholder={formPlaceholders.route}
                disabled={formPlaceholders.route}
                classes={'aro-input-black fiber-annotation'}
              />
            </div>
            <div className="plan-editor-thumb-input-container">
              Fiber Size:
              <Input
                value={formValues.fiberSize}
                name="fiberSize"
                onChange={(event) => handleChange(event)}
                onBlur={(event) => handleBlur(event)}
                placeholder={formPlaceholders.fiberSize}
                disabled={formPlaceholders.fiberSize}
                classes={'aro-input-black fiber-annotation'}
              />
            </div>
            <div className="plan-editor-thumb-input-container">
              Fiber Count:
              <Input
                value={formValues.fiberCount}
                name="fiberCount"
                onChange={(event) => handleChange(event)}
                onBlur={(event) => handleBlur(event)}
                placeholder={formPlaceholders.fiberCount}
                disabled={formPlaceholders.fiberCount}
                classes={'aro-input-black fiber-annotation'}
              />
            </div>
            <div className="plan-editor-thumb-input-container">
              Build Type:
              <Input
                value={formValues.buildType}
                name="buildType"
                onChange={(event) => handleChange(event)}
                onBlur={(event) => handleBlur(event)}
                placeholder={formPlaceholders.buildType}
                disabled={formPlaceholders.buildType}
                classes={'aro-input-black fiber-annotation'}
              />
            </div>
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
  selectedFiberNames: state.planEditor.selectedFiber,
  fiberAnnotations: state.planEditor.fiberAnnotations,
})

const mapDispatchToProps = (dispatch) => ({
  setSelectedFiber: (fiberNames) =>
    dispatch(PlanEditorActions.setSelectedFiber(fiberNames)),
  setFiberAnnotations: (fiberAnnotations) =>
    dispatch(PlanEditorActions.setFiberAnnotations(fiberAnnotations)),
})

export default connect(mapStateToProps, mapDispatchToProps)(FiberThumbs)
