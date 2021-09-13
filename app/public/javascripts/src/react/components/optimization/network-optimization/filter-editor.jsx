import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { EditorInterface, EditorInterfaceItem } from './editor-interface.jsx'
import NetworkOptimizationActions from './network-optimization-actions'
import { Select } from '../../common/forms/Select.jsx'
import { Input } from '../../common/forms/Input.jsx'
import cx from 'clsx'
import './editor-interfaces.css'


const boolOptions = [{value: 'True', label: 'Yes'}, {value: 'False', label: 'No'}]

const numberOptions = [
  {value: 'EQ', label: 'Equal'}, 
  {value: 'NEQ', label: 'Not Equal'},
  {value: 'GT', label: 'Greater Than'},
  {value: 'GTE', label: 'Greater Than or Equal'},
  {value: 'LT', label: 'Less Than'},
  {value: 'LTE', label: 'Less Than or Equal'},
  {value: 'RANGE', label: 'Between'},
  // {value: 'IN', label: 'In'},
]

export const FilterEditor = ({
  displayOnly,
  loadFilters,
  setActiveFilters,
  activeFilters,
  filters,
  optimizationInputs,
  planId,
  }) => {

  useEffect(() => {
    loadFilters()

    return () => {
      setActiveFilters([])
    }
  } ,[])

  useEffect(() => {
    // this useEffect is for setting previously added filters from state
    // We have to check if the inputs match the plan
    // inputs don't change when switching to an incomplete plan
    if (optimizationInputs.planId === planId){
      const { objectFilter } = optimizationInputs.locationConstraints
      if ( objectFilter && objectFilter.propertyConstraints) {
        // removes filters that don't match metadata
        const validatedConstraints = objectFilter.propertyConstraints.filter((constraint) =>{
          return filters.some(filter => filter.name === constraint.propertyName)
        })

        // adds extra information from the metadta, that is needed for display
        const loadedFilters = validatedConstraints.map((constraint) => {
          const newActiveFilter = JSON.parse(JSON.stringify(filters.find((filter) => filter.name === constraint.propertyName)))
          newActiveFilter.operator = constraint.op
          newActiveFilter.value1 = constraint.value
          newActiveFilter.value2 = constraint.value2
          return newActiveFilter
        })
        setActiveFilters(loadedFilters)
      }
    }
  } ,[optimizationInputs, filters])

  const newFilter = {
    displayName: null,
    enumMapped: false,
    format: null,
    maxvalue: '',
    minValue: '',
    name: null,
    propertyType: null,
    value: '',
    label: '',
    operator: '',
    value1: '',
    value2: '',
  }

  const addNewFilter = () => setActiveFilters([...activeFilters, newFilter])

  const selectFilterType = (event, index) => {
    const selectedFilter = filters.find(filter => filter.name === event.target.value)
    activeFilters[index] = selectedFilter

    setActiveFilters([...activeFilters])
  }

  const removeActiveFilter = (index) => {
      activeFilters = activeFilters.filter((activeFilter, i) => i !== index)

      setActiveFilters([...activeFilters])
  }

  const selectOperator = (event, filter, index) => {
    activeFilters[index] = {...filter, operator: event.target.value}

    setActiveFilters([...activeFilters])
  }

  const selectBool = (event, filter, index) => {
    activeFilters[index] = {...filter, operator: "EQ", value1: event.target.value}

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
  
  const ActiveFilterForm = (filter, index ) => {
    // generate the forms based on type right now just number or boolean
    // possible formats: STRING, NUMBER, INTEGER, BOOLEAN
    // possible operations: EQ, NEQ, GT, GTE, LT, LTE, IN, RANGE

    // this first select gets rendered only if the type is BOOLEAN
    const MainSelect = (filter.propertyType === 'BOOLEAN' 
      ? <Select
          value={filter.value1}
          placeholder="Select"
          options={boolOptions}
          onChange={event => selectBool(event, filter, index)}
          classes="ei-filter-select-operator"
          disabled={displayOnly}
        />
      : <div className='ei-filter-input-container'>
          <Select
            value={filter.operator}
            placeholder="Select"
            options={numberOptions}
            onChange={event => selectOperator(event, filter, index)}
            classes="ei-filter-select-operator"
            disabled={displayOnly}
          />
          {filter.operator &&
            <Input 
              type={filter.propertyType === 'NUMBER' || 'INTEGER' ? 'number' : 'text'}
              name="value1"
              value={activeFilters[index].value1}
              min={filter.minValue}
              max={filter.maxValue}
              onChange={event => textChange(event, index)}
              onBlur={event => textChange(event, index)}
              classes={cx('ei-filter-input', 
                filter.format === 'DOLLAR' && 'dollar', 
                filter.format === 'PERCENT' && 'percent')}
              disabled={displayOnly}
          />}

          {/* This second field only gets rendered if type is range, adding second inoput */}
          {filter.operator === 'RANGE' && (
            <>
              and
              <Input 
                type={filter.propertyType === 'NUMBER' || 'INTEGER' ? 'number' : 'text'}
                name="value2"
                value={activeFilters[index].value2}
                min={filter.minValue}
                max={filter.maxValue}
                onChange={event => textChange(event, index)}
                onBlur={event => textChange(event, index)}
                classes={cx('ei-filter-input',
                  filter.format === 'DOLLAR' && 'dollar',
                  filter.format === 'PERCENT' && 'percent')}
                disabled={displayOnly}
              />
            </>)}
      </div>
    )
  
    return MainSelect
  }
  //this is the initial select of the filter type
  const FilterSelect = (index) => {
    return (
        <>
          {!displayOnly && <i className="ei-property-icon trashcan svg" onClick={() => removeActiveFilter(index)} />}
          <Select 
            value={activeFilters[index].value}
            placeholder="Select"
            options={filters}
            onClick={event => event.stopPropagation()}
            onChange={(event) => selectFilterType(event, index)}
            classes="ei-filter-select-container"
            disabled={displayOnly}
          />
      </>
    )
  }

  return (
    <EditorInterface title="Filters" action={!displayOnly && addNewFilter}>
      {activeFilters.map((activeFilter, index) => (
        (activeFilter.displayName 
          ? <EditorInterfaceItem subtitle={FilterSelect(index)} key={index}>
              {ActiveFilterForm(activeFilter, index)}
            </EditorInterfaceItem>
          : <EditorInterfaceItem subtitle={FilterSelect(index)} key={index} />
        )
      ))}
    </EditorInterface>
  )
}



const mapStateToProps = (state) => ({
  filters: state.optimization.networkOptimization.filters,
  activeFilters: state.optimization.networkOptimization.activeFilters,
  optimizationInputs: state.optimization.networkOptimization.optimizationInputs,
  planId: state.plan.activePlan.id,
})

const mapDispatchToProps = dispatch => ({
  loadFilters: () => dispatch(NetworkOptimizationActions.loadFilters()),
  setActiveFilters: (filters) => dispatch(NetworkOptimizationActions.setActiveFilters(filters)),
})

export default connect(mapStateToProps, mapDispatchToProps)(FilterEditor)