import React, { useEffect } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from "../../../common/provider-wrapped-component"
import ToolBarActions from '../../header/tool-bar-actions'


const _LocationView = props => {

  useEffect(() => {
    props.setActiveViewModePanel('LOCATION_INFO')
  }, [props.nearnetEntities])

  // FUTURE: replace this with a generic object viewer (I've built that like three times haven't I?)
  // iterate object props build rows
  
  //console.log(entity)
  function getObjectRows (entity) {
    let rows = []
    for (const [key, value] of Object.entries(entity)) {
      let formattedValue 
      if (typeof value === "object") {
        formattedValue = getObjectRows(value)
      } else {
        //formattedValue = ""+value
        formattedValue = (
          <div className="ei-property-value" style={{textAlign: 'right'}}>
            {""+value}
          </div>
        )
      }
      rows.push(
        <div className="ei-property-item" key={key}>
          <div className="ei-property-label" style={{fontWeight: 'bold'}}>{key}</div>
          
            {formattedValue}
          
        </div>
      )
    }
    return rows
  }

  let entity = {}
  if (props.nearnetEntities.length) entity = props.nearnetEntities[0]
  let allRows = getObjectRows(entity)
  let title = ' '
  if ('address_nearnet' in entity) title = entity.address_nearnet
  return (
    <div className="ei-items-contain object-editor" style={{paddingRight: '16px'}}>
      <div className="ei-header ei-no-pointer ei-header-with-icon">
        {title}
      </div>
      <div className="ei-gen-level ei-internal-level">
        <div className="ei-items-contain">
          {allRows}
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
  setActiveViewModePanel: displayPanel => dispatch(ToolBarActions.activeViewModePanel(displayPanel)),
})

const LocationView = wrapComponentWithProvider(reduxStore, _LocationView, mapStateToProps, mapDispatchToProps)
export default LocationView
