import React, { useState, useRef, useEffect } from 'react'
//import reduxStore from '../../../../redux-store'
//import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import { connect } from 'react-redux'
import cx from 'clsx'
import './road-segment-tagging.css'

export const RoadSegmentTagging = props => {

  const [showSegments, setShowSegments] = useState(false)
  const [rows, setRows] = useState([
    { label: 'Aerial', display: '', checked: false },
    { label: 'Buried', display: '', checked: false },
    { label: 'Untagged', display: '', checked: false },
    { label: 'Special Type', display: '', checked: false },
  ])

  function handleCheckbox(index) {
    const updatedRows = rows.map((row, mapIndex) => {
      if (mapIndex === index) {
        row.checked = !row.checked
      }
      return row
    })
    setRows(updatedRows)
  }

  return (
    <div className="segments-tagging">
      {/* <style></style> */}
      <label className="header">
        <h3>Show Segments by Tag</h3>
        <input
          className="checkboxfill"
          type="checkbox"
          checked={showSegments}
          onChange={() => setShowSegments(!showSegments)}
        />
      </label>
      <div className={cx('tag-rows', showSegments && 'show')}>
        {rows.map((row, index) =>
          <label key={index}>
            <h4>{row.label}</h4>
            <div className="display"></div>
            <div className="checkbox">
              <input
                className="checkboxfill"
                type="checkbox"
                checked={row.checked}
                onChange={() => handleCheckbox(index)}
              />
            </div>
          </label>
        )}
      </div>
    </div>
  )
}


const mapStateToProps = state => ({
})

const mapDispatchToProps = dispatch => ({
})

//export default wrapComponentWithProvider(reduxStore, RoadSegmentTagging, mapStateToProps, mapDispatchToProps)
export default connect(mapStateToProps, mapDispatchToProps)(RoadSegmentTagging)