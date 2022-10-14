import React from 'react'
import PanelComponent from './components/panel-component.jsx';
import { createSelector } from 'reselect'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import reduxStore from '../../../../redux-store'
const getAllLocationLayers = (state) => state.mapLayers.location
const getLocationLayersList = createSelector([getAllLocationLayers], (locationLayers) => locationLayers.toJS())

export const NearNetPanel = (props) => {
  const {
    locationLayers,
  } = props


  return (
    <PanelComponent
      panelKey='near_net'
      panelLabel='Near Net'
      resourceEntityTypes={locationLayers}
    />
  )
}

const mapStateToProps = (state) => {
  return {
    locationLayers: getLocationLayersList(state).sort((a, b) => (b.key > a.key ? 1 : -1)),
  }
}

const mapDispatchToProps = () => ({})

export default wrapComponentWithProvider(reduxStore, NearNetPanel, mapStateToProps, mapDispatchToProps)
