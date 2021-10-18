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
  const [formPlaceholder, setFormPlaceHolder] = useState('')

  useEffect(() => {
    if (
      selectedFiberNames.length === 1 &&
      fiberAnnotations[selectedFiberNames[0]]
    ) {
      setFormValues(fiberAnnotations[selectedFiberNames[0]])
    } else if (selectedFiberNames.length > 1) {
      setFormPlaceHolder('Multiple Routes Selected')
    }

    return () => {
      setFormValues({})
      setFormPlaceHolder('')
    }
  }, [selectedFiberNames, fiberAnnotations, setFormPlaceHolder, setFormValues])

  function deselectFiber(event) {
    event.stopPropagation()
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
                placeholder={formPlaceholder}
                disabled={formPlaceholder}
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
                placeholder={formPlaceholder}
                disabled={formPlaceholder}
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
                placeholder={formPlaceholder}
                disabled={formPlaceholder}
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
                placeholder={formPlaceholder}
                disabled={formPlaceholder}
                classes={'aro-input-black fiber-annotation'}
              />
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm plan-editor-thumb-close"
            aria-label="Close"
            onClick={(event) => deselectFiber(event)}
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
