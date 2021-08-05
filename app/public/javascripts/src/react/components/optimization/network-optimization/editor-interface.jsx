import React, { useState, useContext } from 'react'
// import cx from 'clsx'
// import './editor-interfaces.css'


export const EditorInterface = ({ children, title }) => {

  return (
    <div className="ei-items-contain object-editor">
      <div className="ei-header ei-no-pointer">{title}</div>
      <div className="ei-gen-level ei-internal-level" style={{ paddingLeft: '11px' }}>
        <div className="ei-items-contain">
          <div className="ei-property-item">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
