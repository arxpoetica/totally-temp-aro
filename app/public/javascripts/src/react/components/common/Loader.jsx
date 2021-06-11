import React from 'react'
import cx from 'clsx'

export default props => {
  const { loading, title = 'loading...' } = props
  return (
    <div className={cx('aro-loader', loading && 'loading', title && 'has-title')}>
      <h3>{title}</h3>
      <div className="spinny"></div>
    </div>
  )
}
