import React, { useState, useEffect } from 'react'
import { fiberTypes } from '../../constants'


const fiberInfo = [
  { key: 'atomic_units', label: 'Atomic Units' },
  { key: 'fiber_strands', label: 'Fiber Strands' },
  { key: 'spatial_edge_type', label: 'Spatial Edge Type' },
  // { key: 'link_id', label: 'Link ID' },
  // { key: 'subnet_id', label: 'Subnet ID' },
  // { key: 'from_node', label: 'From Node' },
  // { key: 'to_node', label: 'To Node' },
]

export default ({ fiberMeta = [] }) => {

  return !!fiberMeta.length && (
    <>
      <div className="ei-panel-header clearfix">
        <div className="ei-panel-header-title">Fibers</div>
      </div>
      <div className="equipment-detail ei-panel-content">

        {fiberMeta.map((meta, index) => {

          const title
            = meta.fiber_type === fiberTypes.FEEDER
            ? 'Feeder Fiber'
            : 'Distribution Fiber'

          return (
            <div key={index} className="pt-0">
              <div className="ei-header pt-0">{title}</div>

              <div className="ei-gen-level ei-internal-level">
                {fiberInfo.map(({ label, key }, index) =>
                  <div key={index} className="ei-items-contain">
                    <div className="ei-property-item">
                      <div className="ei-property-name">{label}</div>
                      <div className="ei-output-text">{meta[key]}</div>
                    </div>
                  </div>
                )}
              </div>

              {!!meta.annotations.length &&
                <div className="ei-gen-level ei-internal-level">
                  <div className="ei-items-contain">
                    <div className="ei-property-item">
                      <div className="ei-property-name">Annotations</div>
                      <div className="ei-output-text"></div>
                    </div>
                  </div>
                  <div className="ei-gen-level ei-internal-level pl-3">
                    {meta.annotations.map((annotation, index) =>
                      <div key={index} className="ei-items-contain">
                        <div className="ei-property-item">
                          <div className="ei-property-name">{annotation.label}</div>
                          <div className="ei-output-text">{annotation.value}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              }

            </div>
          )}
        )}

      </div>
    </>
  )

}
