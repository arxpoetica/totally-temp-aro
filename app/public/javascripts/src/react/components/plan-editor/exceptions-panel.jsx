import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import cx from 'clsx'
import PlanEditorSelectors from './plan-editor-selectors.js'

const DefectsPanel = props => {
  console.log(PlanEditorSelectors.ExceptionTypes)

  const { subnetFeatures, locationExceptions } = props

  const [exceptions, setExceptions] = useState([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // FIXME: there could be a bug here if we're only measuring length
    // FIXME: what if the lengths are the same as the prior selections???
    if (Object.keys(subnetFeatures).length) {
      console.log('setting exceptions')
      console.log(subnetFeatures)
      {/* FIXME: let's get the right data in here */}
      setExceptions(Object.entries(subnetFeatures).map(([id, { feature }]) => {
        return { id, checked: false }
      }))
    }
  }, [subnetFeatures])

  const handleOpenState = () => setOpen(!open)

  function toggleChecked(index) {
    if (typeof index === 'number' && index > -1) {
      // initially mutating, but then setting
      exceptions[index].checked = !exceptions[index].checked
      setExceptions([...exceptions])
    }
  }

  return exceptions.length ? (
    <div className={cx('exceptions-panel', open && 'open')}>

      <div className="header" onClick={handleOpenState}>
        <span className="svg plus-minus"></span>
        <span className="svg warning"></span>
        <h2>Plan Defects <small>{exceptions.length} item{exceptions.length ? 's' : ''}</small></h2>
      </div>

      <ul className={cx('content', open && 'open')}>

        {exceptions.map((exception, index) =>
          <li key={exception.id}>
            {/* <input
              type="checkbox"
              checked={exception.checked}
              onChange={() => toggleChecked(index)}
            /> */}
            <div className="text">
              <div className="svg location"></div>
              Drop Cable Length Exceeded
            </div>



            <div className="dropdown">
              <div className="svg caret"></div>
              <ul className="list">
                <li>Ignore this Error</li>
              </ul>
            </div>

          </li>
        )}

      </ul>

    </div>
  ) : null

}

const mapStateToProps = state => ({
  subnetFeatures: state.planEditor.subnetFeatures,
  locationExceptions: PlanEditorSelectors.getExceptionsForSelectedSubnet(reduxState),
})

const mapDispatchToProps = dispatch => ({
})

export default connect(mapStateToProps, mapDispatchToProps)(DefectsPanel)
