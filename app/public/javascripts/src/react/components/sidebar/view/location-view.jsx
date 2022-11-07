import React, { Component } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from "../../../common/provider-wrapped-component"


const _LocationView = props => {

  //useEffect(() => {})

  return (
    <div>
      <pre>
        {JSON.stringify(props.nearnetEntities, undefined, 2)}
      </pre>
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
