import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { EditorInterface, EditorInterfaceItem } from './editor-interface.jsx'
import NetworkOptimizationActions from './network-optimization-actions'
import NetworkOptimizationSelectors from './network-optimization-selectors.js'
import EnumInputModal from './enum-input-modal.jsx'
import { Select } from '../../common/forms/Select.jsx'
import { Input } from '../../common/forms/Input.jsx'
import Loader from '../../common/Loader.jsx'
import ReactSelect from "react-select"
import { getDateString, getDateTimeString } from '../../../common/view-utils.js'
import {
  boolOptions,
  numberOptions,
  dateOptions,
  enumOptions,
  stringOptions,
  newFilter,
} from './filter-objects.js'

import cx from 'clsx'
import './editor-interfaces.css'

const getOperators = (propertyType, enumType) => {
  if (enumType === 'BOUNDED' || enumType === 'UNBOUNDED') return enumOptions

  switch (propertyType) {
    case 'NUMBER':
    case 'INTEGER':
      return numberOptions
    case 'STRING':
      return stringOptions
    case 'DATETIME':
    case 'DATE':
      return dateOptions
    default:
      return numberOptions
  }
}

const getInputType = (propertyType) => {
  switch (propertyType) {
    case 'NUMBER':
    case 'INTEGER':
      return 'number'
    case 'STRING':
      return 'text'
    case 'DATETIME':
      return 'datetime-local'
    case 'DATE':
      return 'date'
    default:
      return 'text'
  }
}

export const FilterEditor = ({
  displayOnly,
  loadFilters,
  setActiveFilters,
  activeFilters,
  filters,
  optimizationInputs,
  planId,
  updatedLocationConstraints,
  loadSelectionFromObjectFilter,
  validatedFilters,
  serviceAreas,
  isPreviewLoading,
  getEnumOptions,
  formattedEnumOptions,
}) => {
  const [modalData, setModalData] = useState({ isOpen: false, index: null })

  useEffect(() => {
    loadFilters()
  }, [])

  useEffect(() => {
    // this useEffect is for setting previously added filters from state
    // We have to check if the inputs match the plan
    // inputs don't change when switching to an incomplete plan
    if (optimizationInputs.planId === planId && !activeFilters.length) {
      const { objectFilter } = optimizationInputs.locationConstraints
      if (objectFilter && objectFilter.propertyConstraints) {
        // removes filters that don't match metadata
        const validatedConstraints = objectFilter.propertyConstraints.filter(
          (constraint) => {
            return filters.some(
              (filter) => filter.name === constraint.propertyName,
            )
          },
        )

        // adds extra information from the metadta, that is needed for display
        const loadedFilters = validatedConstraints.map((constraint) => {
          const newActiveFilter = JSON.parse(
            JSON.stringify(
              filters.find((filter) => filter.name === constraint.propertyName),
            ),
          )

          newActiveFilter.operator = constraint.op
          newActiveFilter.value1 = constraint.value
          newActiveFilter.value2 = constraint.value2

          if (newActiveFilter.enumType === 'BOUNDED') {
            getEnumOptions(newActiveFilter.name)
          }

          // convert date from millseonds since epoch to format for datetime-local input
          if (newActiveFilter.propertyType === 'DATETIME') {
            newActiveFilter.value1 = getDateTimeString(
              new Date(parseInt(newActiveFilter.value1)),
            )
            if (newActiveFilter.value2) {
              newActiveFilter.value2 = getDateTimeString(
                new Date(parseInt(newActiveFilter.value2)),
              )
            }
          }
          if (newActiveFilter.propertyType === 'DATE') {
            newActiveFilter.value1 = getDateString(
              new Date(parseInt(newActiveFilter.value1)),
            )
            if (newActiveFilter.value2) {
              newActiveFilter.value2 = getDateString(
                new Date(parseInt(newActiveFilter.value2)),
              )
            }
          }
          return newActiveFilter
        })
        setActiveFilters(loadedFilters)
      }
    }
  }, [optimizationInputs, filters])

  const addNewFilter = () => setActiveFilters([...activeFilters, newFilter])

  const selectFilterType = (event, index) => {
    const selectedFilter = filters.find(
      (filter) => filter.name === event.target.value,
    )
    activeFilters[index] = selectedFilter

    setActiveFilters([...activeFilters])
  }

  const removeActiveFilter = (index) => {
    activeFilters = activeFilters.filter((activeFilter, i) => i !== index)

    setActiveFilters([...activeFilters])
  }

  const selectOperator = (event, filter, index) => {
    activeFilters[index] = { ...filter, operator: event.target.value }

    setActiveFilters([...activeFilters])
  }

  const selectBool = (event, filter, index) => {
    activeFilters[index] = {
      ...filter,
      operator: 'EQ',
      value1: event.target.value,
    }

    setActiveFilters([...activeFilters])
  }

  const textChange = (event, index) => {
    if (event.target.name === 'value1') {
      activeFilters[index].value1 = event.target.value
    } else if (event.target.name === 'value2') {
      activeFilters[index].value2 = event.target.value
    }

    setActiveFilters([...activeFilters])
  }

  const selectChange = (newValue, index) => {
    activeFilters[index].value1 = newValue

    setActiveFilters([...activeFilters])
  }

  const handlePreview = () => {
    if (serviceAreas.size > 1) {
      swal({
        title: 'Error',
        text: 'Preview on map is currently only supported for a single service area.',
        type: 'error',
      })
    } else {
      loadSelectionFromObjectFilter(planId, updatedLocationConstraints)
    }
  }

  const getInputElements = (filter, index) => {
    const { propertyType, enumType } = filter
    // if Bool return simple yes/no
    if (propertyType === 'BOOLEAN') {
      return (
        <Select
          value={filter.value1}
          placeholder="Select"
          options={boolOptions}
          onChange={(event) => selectBool(event, filter, index)}
          classes="ei-filter-select-operator"
          disabled={displayOnly}
        />
      )
    }
    // if bounded enum return multi select
    if (enumType === 'BOUNDED') {
      getEnumOptions(filter.name)

      // convert loaded filter from string to array
      if (activeFilters[index].value1 && typeof activeFilters[index].value1 === 'string' && formattedEnumOptions[filter.name]) {
        const names = activeFilters[index].value1.split(',')
        const options = names.map((name) => {
          return formattedEnumOptions[filter.name].find((option) => option.value === name)
        })
        activeFilters[index].value1 = options

        setActiveFilters([...activeFilters])
      }

      return (
        <>
          { filter.operator 
            &&  <ReactSelect
              options={formattedEnumOptions[filter.name]}
              isMulti={true}
              value={activeFilters[index].value1}
              onChange={(newValue) => selectChange(newValue, index)}
              isDisabled={displayOnly}
            />}
        </>
        
      )
    }
    // if unbounded return button for input popup
    if (enumType === 'UNBOUNDED') {
      return (
        <div className="ei-filter-input-container">
          {filter.operator && !filter.value1 && (
            <span className="empty-warning">No Input</span>
          )}
          {filter.operator && (
            <button
              type="button"
              disabled={displayOnly}
              onClick={() => setModalData({ isOpen: true, index })}
            >
              {filter.value1 ? 'Edit' : 'Set Input'}
            </button>
          )}
        </div>
      )
    }
    //otherwise return input elements
    else {
      return (
        <div className="ei-filter-input-container">
          {filter.operator && (
            <Input
              type={getInputType(filter.propertyType)}
              name="value1"
              value={activeFilters[index].value1}
              min={filter.minValue}
              max={filter.maxValue}
              onChange={(event) => textChange(event, index)}
              onBlur={(event) => textChange(event, index)}
              classes={cx(
                'ei-filter-input',
                filter.format === 'DOLLAR' && 'dollar',
                filter.format === 'PERCENT' && 'percent',
              )}
              disabled={displayOnly}
            />
          )}

          {/* This second field only gets rendered if type is range, adding second inoput */}
          {filter.operator === 'RANGE' && (
            <>
              and
              <Input
                type={getInputType(filter.propertyType)}
                name="value2"
                value={activeFilters[index].value2}
                min={filter.minValue}
                max={filter.maxValue}
                onChange={(event) => textChange(event, index)}
                onBlur={(event) => textChange(event, index)}
                classes={cx(
                  'ei-filter-input',
                  filter.format === 'DOLLAR' && 'dollar',
                  filter.format === 'PERCENT' && 'percent',
                )}
                disabled={displayOnly}
              />
            </>
          )}
        </div>
      )
    }
  }
  //this is the initial select of the filter type
  const FilterSelect = (index, activeFilter) => {
    return (
      <>
        {!displayOnly && (
          <i
            className="ei-property-icon trashcan svg"
            onClick={() => removeActiveFilter(index)}
          />
        )}
        <Select
          value={activeFilters[index].value}
          placeholder="Select"
          options={filters}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => selectFilterType(event, index)}
          classes="ei-filter-select-container"
          disabled={displayOnly}
        />
        {/* This renders once a filter has been selected, show the available operators */}
        {activeFilter
         && activeFilter.propertyType 
         && activeFilter.propertyType !== 'BOOLEAN' 
         && <Select
              value={activeFilter.operator}
              placeholder="Select"
              options={getOperators(
                activeFilter.propertyType,
                activeFilter.enumType,
              )}
              onChange={(event) => selectOperator(event, activeFilter, index)}
              classes="ei-filter-select-operator"
              disabled={displayOnly}
            />
          }
      </>
    )
  }

  return (
    <EditorInterface
      title="Filters"
      middleSection={
        !displayOnly &&
        validatedFilters.length > 0 && (
          <div className="button-group">
            <button
              type="button"
              className="ei-header-filter-preview"
              onClick={() => handlePreview()}
            >
              Preview On Map
            </button>
            <Loader loading={isPreviewLoading} title="Calculating..." />
          </div>
        )
      }
      rightSection={
        !displayOnly && (
          <i
            onClick={() => addNewFilter()}
            className="ei-header-icon plus-sign svg"
          />
        )
      }
    >
      <EnumInputModal
        filterIndex={modalData.index}
        isOpen={modalData.isOpen}
        startingText={
          activeFilters[modalData.index] &&
          activeFilters[modalData.index].value1
        }
        closeModal={() => setModalData({ isOpen: false, index: null })}
      />

      {activeFilters.map((activeFilter, index) =>
        activeFilter.displayName ? (
          <EditorInterfaceItem
            subtitle={FilterSelect(index, activeFilter)}
            key={index}
          >
            {getInputElements(activeFilter, index)}
          </EditorInterfaceItem>
        ) : (
          <EditorInterfaceItem
            subtitle={FilterSelect(index, activeFilter)}
            key={index}
          />
        ),
      )}
    </EditorInterface>
  )
}

const mapStateToProps = (state) => ({
  filters: state.optimization.networkOptimization.filters,
  activeFilters: state.optimization.networkOptimization.activeFilters,
  optimizationInputs: state.optimization.networkOptimization.optimizationInputs,
  planId: state.plan.activePlan.id,
  updatedLocationConstraints:
    NetworkOptimizationSelectors.getUpdatedLocationConstraints(state),
  validatedFilters: NetworkOptimizationSelectors.getValidatedFilters(state),
  formattedEnumOptions: NetworkOptimizationSelectors.getFormattedEnumOptions(state),
  serviceAreas: state.selection.planTargets.serviceAreas,
  isPreviewLoading: state.optimization.networkOptimization.isPreviewLoading,
})

const mapDispatchToProps = (dispatch) => ({
  loadFilters: () => dispatch(NetworkOptimizationActions.loadFilters()),
  setActiveFilters: (filters) =>
    dispatch(NetworkOptimizationActions.setActiveFilters(filters)),
  loadSelectionFromObjectFilter: (planId, constraints) =>
    dispatch(
      NetworkOptimizationActions.getLocationPreview(planId, constraints),
    ),
  getEnumOptions: (propertyName) => dispatch(NetworkOptimizationActions.getEnumOptions(propertyName)),
})

export default connect(mapStateToProps, mapDispatchToProps)(FilterEditor)
