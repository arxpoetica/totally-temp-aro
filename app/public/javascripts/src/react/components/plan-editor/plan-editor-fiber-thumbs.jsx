import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import PlanEditorActions from './plan-editor-actions'
import { Input } from '../common/forms/Input.jsx'

const fieldOptions = ['route', 'fiberSize', 'fiberCount', 'buildType']

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
    if (
      selectedFiberNames.length === 1 
      && fiberAnnotations[selectedFiberNames[0]]
    ) {
      // if only one route selected, just set the values
      setFormValues(fiberAnnotations[selectedFiberNames[0]])
    } else if (selectedFiberNames.length > 1) {
      const annotationObject = {} // used for comparison to see if fields are identical
      // { [name]: ['test', 'test2'] } more than one value means switch to placeholder

      // for each selected fiber segment
      selectedFiberNames.forEach((fiberRoute) => {
        if (fiberAnnotations[fiberRoute]) {
          // for each field in the annotations
          Object.keys(fiberAnnotations[fiberRoute]).forEach((annotationName) => {
              const newValue = fiberAnnotations[fiberRoute][annotationName]
              const values = annotationObject[annotationName]
              // if it doesn't exist yet: set the value
              if (!values) {
                annotationObject[annotationName] =  [ newValue ]
              }
              // they aren't equal push the new value
              else if (!values.includes(newValue)) {
                annotationObject[annotationName].push(newValue)
              }
            },
          )
        }
      })
      const newFormValues = {} // values for form in state
      const newPlaceholders = {} // for multiple values set as placeholders instead

      Object.entries(annotationObject).forEach(([field, values]) => {
        if (values.length === 1) newFormValues[field] = annotationObject[field][0]
        else newPlaceholders[field] = annotationObject[field].join(', ')
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
            {/* Map options for input */}
            {fieldOptions.map((fieldOption) => (
              <div className="plan-editor-thumb-input-container" key={fieldOption}>
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
