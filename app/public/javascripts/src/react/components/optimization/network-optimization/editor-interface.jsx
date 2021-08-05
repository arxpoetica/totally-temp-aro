import React from 'react'
// import './editor-interfaces.css'

export const EditorInterface = ({ children, title, footer }) => {
  return (
    <div className="ei-items-contain object-editor">
      <div className="ei-header ei-no-pointer">{title}</div>
      <div className="ei-gen-level ei-internal-level">
        <div className="ei-items-contain">
          {children}
        </div>
      </div>
      {footer}
    </div>
  )
}

export const EditorInterfaceItem = ({ children, subtitle }) => {
  return (
    <div className="ei-property-item">
      {subtitle && <div className="ei-property-label">{subtitle}</div>}
      <div className="ei-property-value">
        {children}
      </div>
    </div>
  )
}
