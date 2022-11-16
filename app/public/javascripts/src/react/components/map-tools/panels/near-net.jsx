import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import MapLayerActions from '../../map-layers/map-layer-actions'
import MapLayerSelectors from '../../map-layers/map-layer-selectors'
import AccordionComponent from './components/accordion-component.jsx';
import PanelComponent from './components/panel-component.jsx';
import AccordionCheckboxComponent from './components/accordion-checkbox-component.jsx';
import AccordionThresholdComponent from './components/accordion-threshold-component.jsx';
import AccordionRadioComponent from './components/accordion-radio-component.jsx';
import AccordionMultiInputComponent from './components/accordion-multi-input-component.jsx'
import AccordionMultiSelectComponent from './components/accordion-multi-select-component.jsx'

const compDictonary = {
  threshold: AccordionThresholdComponent,
  rangeThreshold: AccordionThresholdComponent,
  multiSelect: AccordionCheckboxComponent,
  singleSelect: AccordionRadioComponent,
  multiInput: AccordionMultiInputComponent,
  multiSelectDropdown: AccordionMultiSelectComponent
}

const NearNet = ({
  selectedManager,
  listedManager,
  configuration,
  filterValues,
  updateMapLayerFilters,
  setAndRequestPCM,
  hasResourceItems
}) => {
  const [showNearNet, setShowNearNet] = useState(false)

  useEffect(() => {
    if (!selectedManager) return
    !listedManager && hasResourceItems
      ? setAndRequestPCM()
      : setShowNearNet(listedManager.definition.generateNearNetAnalysis)
  }, [
    hasResourceItems,
    (selectedManager && selectedManager.id),
    JSON.stringify(listedManager && listedManager.definition)
  ])

  const onFilterChange = (key, type, value, payload) => {
    const newValue = payload || {};
    if (!payload) {
      newValue[type] = value
    }
    updateMapLayerFilters('near_net', key, newValue)
  }

  const accordionData = () => {
    if (!configuration.ui.perspective.mapTools) return []

    const configurationFilters = configuration.ui.perspective.mapTools.toolDetails.near_net.filters
    const accordionData = [
      ...configurationFilters.filter(filter => filter.top),
      ...configurationFilters.filter(filter => !filter.top)
    ]

    return accordionData.map(filter => {
      const Component = compDictonary[filter.type]
      filter.body = <Component
          filter={filter}
          values={filter.values}
          onChange={(key, type, value, payload = null) => onFilterChange(key, type, value, payload)}
          data={filterValues.near_net[filter.attributeKey] && filterValues.near_net[filter.attributeKey]}
        />

      return filter;
    })
  }

  return (
    <>
      {showNearNet &&
        <PanelComponent
          panelKey='near_net'
          panelLabel='Near Net'
        >
          <AccordionComponent
            data={accordionData()}
            defaultValues={['location_filters', 'entity_type']}
          />          
        </PanelComponent>
      }
    </>
  )
}

const mapStateToProps = (state) => {
  const selectedManager = state.plan.resourceItems.planning_constraints_manager && state.plan.resourceItems.planning_constraints_manager.selectedManager
  const listedManager = state.resourceManager.managers[selectedManager && selectedManager.id]
  return {
    selectedManager,
    listedManager,
    configuration: state.configuration,
    filterValues: MapLayerSelectors.getFilterValues(state),
    hasResourceItems: Object.keys(state.plan.resourceItems).length > 0
  }
}

const mapDispatchToProps = (dispatch) => ({
  updateMapLayerFilters: (layer, key, value) => dispatch(MapLayerActions.updateMapLayerFilters(layer, key, value)),
  setAndRequestPCM: () => dispatch(MapLayerActions.setAndRequestPCM())
})

const NearNetComponent = connect(mapStateToProps, mapDispatchToProps)(NearNet)
export default NearNetComponent