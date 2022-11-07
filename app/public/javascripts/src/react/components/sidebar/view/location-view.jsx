import React, { Component } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from "../../../common/provider-wrapped-component"


const _LocationView = props => {

  //useEffect(() => {})

  // FUTURE: replace this with a generic object viewer (I've built that like three times haven't I?)
  // iterate object props build rows
  let rows = []
  let entity = {}
  if (props.nearnetEntities.length) entity = props.nearnetEntities[0]
  console.log(entity)
  for (const [key, value] of Object.entries(entity)) {
    rows.push(
      <div className="ei-property-item" key={key}>
        <div className="ei-property-label" style={{fontWeight: 'bold'}}>{key}</div>
        <div className="ei-property-value" style={{textAlign: 'right'}}>
          {""+value}
        </div>
      </div>
    )
  }

  return (
    <div className="ei-items-contain object-editor" style={{paddingRight: '16px'}}>
      <div className="ei-header ei-no-pointer ei-header-with-icon">
        Title Here
      </div>
      <div className="ei-gen-level ei-internal-level">
        <div className="ei-items-contain">
          {rows}
        </div>
      </div>
    </div>
  )
}

const mapStateToProps = (state) => {
  return {
    nearnetEntities: state.selection.nearnetEntities,
  }
}

const mapDispatchToProps = dispatch => ({

})

const LocationView = wrapComponentWithProvider(reduxStore, _LocationView, mapStateToProps, mapDispatchToProps)
export default LocationView
