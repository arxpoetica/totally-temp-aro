import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import cx from 'clsx'

const DefectsPanel = props => {

  const { subnetFeatures } = props

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
        <span className="plus-minus"></span>
        <h2>Plan Defects <small>{exceptions.length} item{exceptions.length ? 's' : ''}</small></h2>
      </div>

      <div className={cx('content', open && 'open')}>

        {exceptions.map((exception, index) =>
          <label key={exception.id}>
            <input
              type="checkbox"
              checked={exception.checked}
              onChange={() => toggleChecked(index)}
            />
            <h2>{exception.id}</h2>
          </label>
        )}

      </div>

    </div>
  ) : null

}

const mapStateToProps = state => ({
  subnetFeatures: state.planEditor.subnetFeatures,
})

const mapDispatchToProps = dispatch => ({
})

export default connect(mapStateToProps, mapDispatchToProps)(DefectsPanel)
