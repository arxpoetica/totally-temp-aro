import React from 'react'
// import './editor-interfaces.css'

export const EditorInterface = ({ children, title, footer, action }) => {
  return (
    <div className="ei-items-contain object-editor">
      <div className="ei-header ei-no-pointer ei-header-with-icon">
        {title} 
        {action && <i onClick={() => action()} className="ei-header-icon plus-sign svg" />}
      </div>
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
