import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import PlanEditorActions from './plan-editor-actions'
import { Input } from '../common/forms/Input.jsx'

const FiberThumbs = props => {
  const { selectedFiberNames, setSelectedFiber, setFiberAnnotations, fiberAnnotations } = props

  const [formValue, setFormValue] = useState('')
  const [formPlaceholder, setFormPlaceHolder] = useState('')

  useEffect(() => {
    if (selectedFiberNames.length === 1 && fiberAnnotations[selectedFiberNames[0]]) {
      setFormValue(fiberAnnotations[selectedFiberNames[0]])
    } else if (selectedFiberNames.length > 1) {
      setFormPlaceHolder('Multiple Routes Selected')
    }

    return () => {
      setFormValue('')
      setFormPlaceHolder('')
    }
  }, [ selectedFiberNames, fiberAnnotations, setFormPlaceHolder, setFormValue ])


  function deselectFiber(event) {
    event.stopPropagation()
    setSelectedFiber([])
  }

  function handleBlur(event) {
    event.stopPropagation()
    const { value } = event.target
    const annotations = {}

    selectedFiberNames.forEach((fiberName) => {
      annotations[fiberName] = value
    })

    setFiberAnnotations(annotations)
  }

  return (

    <>
    {selectedFiberNames.length > 0 && 
      <div
        className={'plan-editor-thumb-fiber plan-editor-thumb'}
      >
        <div className="info">
          <h2>Fiber Route</h2>
        </div>
        <div className="subinfo">
          {selectedFiberNames.join(', ')}
        </div>
        <div>
          <Input
            value={formValue}
            onChange={(event) => setFormValue(event.target.value)}
            onBlur={(event) => handleBlur(event)}
            placeholder={formPlaceholder}
            disabled={formPlaceholder}
          />
        </div>
        <button type="button" 
          className="btn btn-sm plan-editor-thumb-close" 
          aria-label="Close"
          onClick={event => deselectFiber(event)}
        ><i className="fa fa-times"></i></button>
      </div>
    }
    </>

  )

}

const mapStateToProps = state => ({
  selectedFiberNames: state.planEditor.selectedFiber,
  fiberAnnotations: state.planEditor.fiberAnnotations,
})

const mapDispatchToProps = dispatch => ({
  setSelectedFiber: (fiberNames) => dispatch(PlanEditorActions.setSelectedFiber(fiberNames)),
  setFiberAnnotations: (fiberAnnotations) => dispatch(PlanEditorActions.setFiberAnnotations(fiberAnnotations)),
})

export default connect(mapStateToProps, mapDispatchToProps)(FiberThumbs)
