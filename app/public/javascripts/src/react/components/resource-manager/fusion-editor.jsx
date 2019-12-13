import React, { Component } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import { getFormValues } from 'redux-form'
import { createSelector } from 'reselect'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import { ConduitConnectivityDefinition } from '../common/conduit-connectivity-definition.jsx'
import FusionConstraints from './fusion-editor-form.jsx'
import WormholeFuseDefinition from './wormhole-fuse-definition.jsx'
import Constants from '../../common/constants'
import ResourceManagerActions from './resource-manager-actions'
const fusionSelector = getFormValues(Constants.FUSION_FORM)

const getWormholeFusionConfig = state => state.configuration.ui.wormholeFusion
const getOrderedSpatialEdgeDefinitions = createSelector([getWormholeFusionConfig], wormholeFusionConfig => {
  // Error checking, as we are getting these settings from a database
  // Object.keys(wormholeFusionConfig).forEach(spatialEdgeType => {
  //   if (!SpatialEdgeType[spatialEdgeType]) {
  //     throw new Error(`Error: key ${spatialEdgeType} is not defined in class SpatialEdgeType`)
  //   }
  // })
  // Return ordered spatial edge types
  return Object.keys(wormholeFusionConfig)
    .map(spatialEdgeType => wormholeFusionConfig[spatialEdgeType])
    .sort((a, b) => (a.index > b.index) ? 1 : -1)
})

export class FusionEditor extends Component {
  render () {
    return <div className='p-5' style={{ maxHeight: '500px', overflowY: 'auto' }}>
      <h3>{this.props.editingManager && this.props.editingManager.name}</h3>
      <FusionConstraints initialValues={this.props.definition.config} enableReinitialize />
      <ConduitConnectivityDefinition
        connectivityDefinition={this.props.definition.config.connectivityDefinition}
        setConnectivityDefinition={this.setConnectivityDefinitionWithId.bind(this)}
      />
      <WormholeFuseDefinition
        primarySpatialEdge={this.props.definition.config.primarySpatialEdge}
        spatialEdgeDefinitions={this.props.spatialEdgeDefinitions}
        wormholeFuseDefinitions={this.props.definition.config.wormholeFuseDefinitions}
        setPrimarySpatialEdge={this.setPrimarySpatialEdgeWithId.bind(this)}
        setWormholeFuseDefinition={this.setWormholeFuseDefinitionWithId.bind(this)}
      />
      <button className='btn btn-primary float-right' onClick={() => this.saveSettings()}>Save</button>
    </div>
  }

  setConnectivityDefinitionWithId (spatialEdgeType, networkConnectivityType) {
    this.props.setConnectivityDefinition(this.props.editingManager.id, spatialEdgeType, networkConnectivityType)
  }

  setPrimarySpatialEdgeWithId (primarySpatialEdge) {
    this.props.setPrimarySpatialEdge(this.props.editingManager.id, primarySpatialEdge)
  }

  setWormholeFuseDefinitionWithId (spatialEdgeType, wormholeFusionTypeId) {
    this.props.setWormholeFuseDefinition(this.props.editingManager.id, spatialEdgeType, wormholeFusionTypeId)
  }

  saveSettings () {
    // Compile all the forms into a definition
    var modifiedDefinition = { ...this.props.definition,
      config: { ...this.props.definition.config,
        connectivityDefinition: this.props.definition.config.connectivityDefinition,
        wormholeFuseDefinitions: this.props.definition.config.wormholeFuseDefinitions
      }
    }
    this.props.saveResourceManagerDefinition(this.props.editingManager.id, this.props.editingManager.type, modifiedDefinition)
  }
}

FusionEditor.propTypes = {
}

const mapStateToProps = state => ({
  editingManager: state.resourceManager.editingManager,
  definition: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].definition,
  spatialEdgeDefinitions: getOrderedSpatialEdgeDefinitions(state),
  modifiedFusion: fusionSelector(state)
})

const mapDispatchToProps = dispatch => ({
  saveResourceManagerDefinition: (resourceManagerId, managerType, definition) => dispatch(ResourceManagerActions.saveResourceManagerDefinition(resourceManagerId, managerType, definition)),
  setConnectivityDefinition: (id, spatialEdgeType, networkConnectivityType) => dispatch(ResourceManagerActions.setConnectivityDefinition(id, spatialEdgeType, networkConnectivityType)),
  setPrimarySpatialEdge: (id, primarySpatialEdge) => dispatch(ResourceManagerActions.setPrimarySpatialEdge(id, primarySpatialEdge)),
  setWormholeFuseDefinition: (id, spatialEdgeType, wormholeFusionTypeId) => dispatch(ResourceManagerActions.setWormholeFuseDefinition(id, spatialEdgeType, wormholeFusionTypeId))
})

const FusionEditorComponent = wrapComponentWithProvider(reduxStore, FusionEditor, mapStateToProps, mapDispatchToProps)
export default FusionEditorComponent
