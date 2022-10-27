import React from 'react'
import PanelComponent from './components/panel-component.jsx';
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import reduxStore from '../../../../redux-store'

export const NearNetPanel = () => {
  return (
    <PanelComponent
      panelKey='near_net'
      panelLabel='Near Net'
    />
  )
}

const mapStateToProps = () => { return {} }

const mapDispatchToProps = () => ({})

export default wrapComponentWithProvider(reduxStore, NearNetPanel, mapStateToProps, mapDispatchToProps)
