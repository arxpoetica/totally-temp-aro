import React from 'react'
import { connect } from 'react-redux'
import ToolBarActions from '../header/tool-bar-actions'
import { displayModes } from './constants'
import cx from 'clsx'

const iconNames = Object.freeze({
  VIEW: 'fa-eye',
  ANALYSIS: 'fa-gavel',
  EDIT_RINGS: 'fa-project-diagram',
  EDIT_PLAN: 'fa-pencil-alt',
  DEBUG: 'fa-bug',
  PLAN_SETTINGS: 'fa-cog',
})

const DisplayButton = props => {
  const {
    title,
    mode,
    disabled,
    selectedDisplayMode,
    setSelectedDisplayMode,
  } = props
  const displayMode = displayModes[mode]

  const buttonClassName = cx(
    'btn',
    'display-mode-button',
    selectedDisplayMode === displayMode ? 'btn-primary' : 'btn-light',
  )
  const iconClassName = cx('fa', 'fa-2x', iconNames[mode])

  function handleClick() {
    if (!disabled) {
      setSelectedDisplayMode(displayMode)
    } 
  }

  return (
    <button
      type="button"
      className={buttonClassName}
      disabled={disabled}
      onClick={handleClick}
    >
      <div
        className={iconClassName}
        data-toggle="tooltip"
        data-placement="bottom"
        title={title}
      />
    </button>
  )
}

const mapStateToProps = (state) => ({
  selectedDisplayMode: state.toolbar.rSelectedDisplayMode,
})
const mapDispatchToProps = (dispatch) => ({
  setSelectedDisplayMode: (value) => dispatch(ToolBarActions.selectedDisplayMode(value)),
})
export default connect(mapStateToProps, mapDispatchToProps)(DisplayButton)
