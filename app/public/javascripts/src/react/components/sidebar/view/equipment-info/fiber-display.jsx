import React, { useState, useEffect } from 'react'
import { fiberTypes } from '../../constants'

export default ({ fiberMeta = [] }) => {

  return !!fiberMeta.length && (
    <>
      <div className="ei-panel-header clearfix">
        <div className="ei-panel-header-title">Fibers</div>
      </div>
      <div className="equipment-detail ei-panel-content">

        {fiberMeta.map((meta, index) =>

          <div key={index}>
            <div className="ei-header">{fiberTypes[meta.fiber_type]}</div>
            <div className="ei-gen-level ei-internal-level">

              {/* {meta.annotations.map((annotation, index) =>
                <div key={index} className="ei-items-contain">
                  <div className="ei-property-item">
                    <div className="ei-property-name">{annotation.label}</div>
                    <div className="ei-output-text">{annotation.value}</div>
                  </div>
                </div>
              )} */}

            </div>
          </div>

        )}

      </div>
    </>
  )

}
