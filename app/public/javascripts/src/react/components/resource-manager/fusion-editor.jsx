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
import ResourceActions from '../resource-editor/resource-actions'
const fusionSelector = getFormValues(Constants.FUSION_FORM)

const getConduits = state => { return { ...state.mapLayers.networkEquipment.conduits, ...state.mapLayers.networkEquipment.roads } }
const getOrderedSpatialEdgeDefinitions = createSelector([getConduits], conduits => {
  // Return ordered spatial edge types
  return Object.keys(conduits)
    .map(spatialEdgeType => conduits[spatialEdgeType])
    .sort((a, b) => (a.listIndex > b.listIndex) ? 1 : -1)
})

export class FusionEditor extends Component {

  componentDidMount () {
    this.props.setModalTitle(this.props.resourceManagerName);  
  }

  render () {
    if (!this.props.definition) return ''

    return (
      <div>
        <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
          <div style={{flex: '1 1 auto'}}>
            <FusionConstraints initialValues={this.props.definition.config} enableReinitialize />
            <ConduitConnectivityDefinition
              connectivityDefinition={this.props.definition.config.connectivityDefinition}
              setConnectivityDefinition={this.setConnectivityDefinitionWithId.bind(this)}
              spatialEdgeDefinitions={this.props.spatialEdgeDefinitions}
            />
            <WormholeFuseDefinition
              primarySpatialEdge={this.props.definition.config.primarySpatialEdge}
              spatialEdgeDefinitions={this.props.spatialEdgeDefinitions}
              wormholeFuseDefinitions={this.props.definition.config.wormholeFuseDefinitions}
              setPrimarySpatialEdge={this.setPrimarySpatialEdgeWithId.bind(this)}
              setWormholeFuseDefinition={this.setWormholeFuseDefinitionWithId.bind(this)}
            />
          </div>
          <div style={{flex: '0 0 auto'}}>
            <div style={{textAlign: 'right'}}>
              <button className='btn btn-light mr-2' onClick={() => this.props.onDiscard()}>
                <i className="fa fa-undo action-button-icon"></i>Discard changes
              </button>
              <button className='btn btn-primary' onClick={() => this.saveSettings()}>
                <i className="fa fa-save action-button-icon"></i>Save
              </button>
            </div>
          </div>
        </div>
      </div>
    )
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
    var modifiedDefinition = {
      managerType: 'fusion_manager',
      config: this.props.modifiedFusion
    }
    this.props.saveResourceManagerDefinition(this.props.editingManager.id, this.props.editingManager.type, modifiedDefinition)
    this.props.onDiscard()
  }
}

FusionEditor.propTypes = {
}

const mapStateToProps = state => ({
  editingManager: state.resourceManager.editingManager,
  resourceManagerName: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].resourceManagerName,
  definition: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].definition,
  spatialEdgeDefinitions: getOrderedSpatialEdgeDefinitions(state),
  modifiedFusion: fusionSelector(state)
})

const mapDispatchToProps = dispatch => ({
  saveResourceManagerDefinition: (resourceManagerId, managerType, definition) => dispatch(ResourceManagerActions.saveResourceManagerDefinition(resourceManagerId, managerType, definition)),
  setConnectivityDefinition: (id, spatialEdgeType, networkConnectivityType) => dispatch(ResourceManagerActions.setConnectivityDefinition(id, spatialEdgeType, networkConnectivityType)),
  setPrimarySpatialEdge: (id, primarySpatialEdge) => dispatch(ResourceManagerActions.setPrimarySpatialEdge(id, primarySpatialEdge)),
  setWormholeFuseDefinition: (id, spatialEdgeType, wormholeFusionTypeId) => dispatch(ResourceManagerActions.setWormholeFuseDefinition(id, spatialEdgeType, wormholeFusionTypeId)),
  setModalTitle: (title) => dispatch(ResourceActions.setModalTitle(title))
})

const FusionEditorComponent = wrapComponentWithProvider(reduxStore, FusionEditor, mapStateToProps, mapDispatchToProps)
export default FusionEditorComponent
