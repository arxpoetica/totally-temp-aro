import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import cx from 'clsx'
import PlanEditorActions from './plan-editor-actions'
import PlanEditorSelectors from './plan-editor-selectors'
import { getIconUrl } from './shared'
import FiberAnnotations from './plan-editor-fiber-annotations.jsx'
import { constants } from './shared'

const PlanEditorHeader = props => {

  const {
    equipments,
    features,
    selectedEditFeatureIds,
    selectedSubnetId,
    locationCounts,
    setSelectedSubnetId,
    deselectEditFeatureById,
    updatePlanThumbInformation,
    constructionAreas,
    planThumbInformation,
  } = props

  useEffect(() => {
    if (Object.keys(features).length) {
      selectedEditFeatureIds.forEach(selectedFeatureId => {
        let feature = features[selectedFeatureId] ? features[selectedFeatureId].feature : null
        if (feature && feature.dataType === "edge_construction_area") {
          const isBlocker = constants.BLOCKER.COST_MULTIPLIER === feature.costMultiplier
          const dropdownValue = isBlocker
            ? constants.BLOCKER.KEY
            : constants.INCLUSION.KEY
            if (dropdownValue !== planThumbInformation[feature.objectId]) {
              // This was updating infinitely due to the useEffect check on features
              // Even if the costMultiplier didn't change on the route adjuster the
              // date modified did. Resulting in infinite loop of death.
              updatePlanThumbInformation({
                key: feature.objectId,
                planThumbInformation: dropdownValue
              })
            }
        }
      })
    }
  }, [selectedEditFeatureIds, JSON.stringify(features)])

  function onClick(event, objectId) {
    event.stopPropagation()
    if (objectId === selectedSubnetId) { objectId = null } // deselect
    if (!features[objectId]) { objectId = null } // deselect
    setSelectedSubnetId(objectId)
  }

  function onClose(event, objectId) {
    event.stopPropagation()
    if (objectId === selectedSubnetId) { setSelectedSubnetId() }
    deselectEditFeatureById(objectId)
  }

  function onChange(event, id) {
    event.stopPropagation()
    updatePlanThumbInformation({key: id, planThumbInformation: event.target.value})
  }

  function totalCounts(id) {
    const isNumber = typeof locationCounts[id] === "number"
    const connectedLocations = isNumber
      ? locationCounts[id]
      : locationCounts[id].connected
    let countText = `Location connections: ${connectedLocations}`
    if (!isNumber) {
      countText += '\n'
      countText += `Locations in boundary: ${locationCounts[id].total}`
    }

    return countText
  }

  function isValidCount(id) {
    return locationCounts[id] > 0 || locationCounts[id].total > 0
  }

  return (
    <>
      {!!Object.keys(features).length && selectedEditFeatureIds.map(id => {

        const feature = features[id] && features[id].feature
        if (feature) {
          const type = feature.networkNodeType ? feature.networkNodeType : feature.dataType;
          const mapLayers = feature.networkNodeType ? equipments : constructionAreas;
          const { label } = mapLayers[type];
          const { coordinates } = feature.geometry;

          return (
          <div
            key={id}
            className={cx(
              'plan-editor-thumb',
              id === selectedSubnetId && 'selected',
            )}
            onClick={event => onClick(event, id)}
          >
            <div className="info">
              <img src={getIconUrl(feature, props)} alt={label}/>
              <h2>{label}</h2>
            </div>
            {isValidCount(id) &&
              <p className="household-connections">{ totalCounts(id) }</p>
            }
            <div className="subinfo">
            {mapLayers[type].planThumbOptions && mapLayers[type].planThumbOptions.thumbText
              ? <div className="item"> {mapLayers[type].planThumbOptions.thumbText} </div>
              : <span>
                  <div className="item">
                    <div className="badge badge-dark">LATITUDE</div>
                    {coordinates[1]}
                  </div>
                  <div className="item">
                    <div className="badge badge-dark">LONGITUDE</div>
                    {coordinates[0]}
                  </div>
                </span>
            }
            </div>
            {mapLayers[type].planThumbOptions && mapLayers[type].planThumbOptions.dropdownOptions &&
              <div className="subinfo">
                  <select
                    value={planThumbInformation[id]}
                    onClick={event => event.stopPropagation()}
                    onChange={event => onChange(event, id)}
                  >
                    {mapLayers[type].planThumbOptions.dropdownOptions.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option> 
                    ))}
                  </select>
              </div>
            }
            <button type="button" 
              className="btn btn-sm plan-editor-thumb-close" 
              aria-label="Close"
              onClick={event => onClose(event, id)}
            ><i className="fa fa-times"></i></button>
          </div>
          )
        }
      })}
      <FiberAnnotations />
    </>

  )

}

const mapStateToProps = state => ({
  ARO_CLIENT: state.configuration.system.ARO_CLIENT,
  equipments: state.mapLayers.networkEquipment.equipments,
  constructionAreas: state.mapLayers.constructionAreas.construction_areas,
  features: state.planEditor.subnetFeatures,
  selectedEditFeatureIds: state.planEditor.selectedEditFeatureIds,
  selectedSubnetId: state.planEditor.selectedSubnetId,
  // DO NOT DELETE `locationAlerts`: `getIconUrl` chokes without this.
  // The wiring is not "hard," but state still depends on it.
  locationAlerts: PlanEditorSelectors.getAlertsForSubnetTree(state),
  locationCounts: PlanEditorSelectors.getLocationCounts(state),
  planThumbInformation: state.planEditor.planThumbInformation,
})

const mapDispatchToProps = dispatch => ({
  setSelectedSubnetId: id => dispatch(PlanEditorActions.setSelectedSubnetId(id)),
  deselectEditFeatureById: id => dispatch(PlanEditorActions.deselectEditFeatureById(id)),
  updatePlanThumbInformation: payload => dispatch(PlanEditorActions.updatePlanThumbInformation(payload)),
})

export default connect(mapStateToProps, mapDispatchToProps)(PlanEditorHeader)
