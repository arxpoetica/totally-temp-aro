import React, {useEffect, useState} from 'react'
import { propTypes } from 'react-widgets/lib/SelectList'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import { EditorInterface, EditorInterfaceItem } from './editor-interface.jsx'
import NetworkOptimizationActions from './network-optimization-actions'
import { Select } from '../../common/forms/Select.jsx'
// import './editor-interfaces.css'

export const FilterEditorComponent = ({loadFilters, setActiveFilters, activeFilters, filters}) => {
  const [filterOptions, setFilterOptions] = useState([])

  useEffect(() => {
    loadFilters()
  }, [])

  useEffect(() => {
    const newFilterOptions = filters.map(filter => {
      filter.label = filter.displayName
      filter.value = filter.name
      return filter
    })
    setFilterOptions(newFilterOptions)
  }, [filters])

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
  }

  const addNewFilter = () => {
    setActiveFilters([...activeFilters, newFilter])
  }

  const selectFilterType = (event, index) => {
    const selectedFilter = filters.find(filter => filter.name === event.target.value)
    const newActiveFilters = activeFilters
    newActiveFilters[index] = selectedFilter
    console.log(newActiveFilters)

    setActiveFilters([...newActiveFilters])
  }

  const removeActiveFilter = (index) => {
    const newActiveFilters = activeFilters.filter((activeFilter, i) => i !== index)

    setActiveFilters([...newActiveFilters])
  }

  const FilterSelect = (index) => {
    return (
        <>
          <i className="ei-property-icon trashcan svg" onClick={() => removeActiveFilter(index)} />
          <Select 
          value={activeFilters[index].value}
          placeholder="Select"
          options={filterOptions}
          // onClick={event => event.stopPropagation()}
          onChange={(event) => selectFilterType(event, index)}
          classes="ei-select"
          />
      </>
    )
  }

  return (
    <EditorInterface title="Filters" action={addNewFilter}>
      {activeFilters.map((activeFilter, index) => (
        (activeFilter.displayName ? (
          <EditorInterfaceItem subtitle={FilterSelect(index)} key={index}>
            <FilterEditorItem filter={activeFilter}/>
          </EditorInterfaceItem>
          ) : (
          <EditorInterfaceItem subtitle={FilterSelect(index)} key={index} />
          )
        )   
      ))}
    </EditorInterface>
  )
}

const FilterEditorItem = ({ filter }) => {
  console.log(filter)
  const boolOptions = [{value: 'True', label: 'Yes'}, {value: 'False', label: 'No'}]
  const numberOptions = [
    {value: 'EQ', label: 'Equal'}, 
    {value: 'NEQ', label: 'Not Equal'},
    {value: 'GT', label: 'Greater Than'},
    {value: 'GTE', label: 'Greater Than or Equal'},
    {value: 'LT', label: 'Less Than'},
    {value: 'LTE', label: 'Less Than or Equal'},]
  // I will generate the forms based on type right now just number or boolean
  //possible formats: STRING, NUMBER, INTEGER, BOOLEAN
  //possible operations: EQ, NEQ, GT, GTE, LT, LTE, IN, RANGE
  const MainSelect = (filter.format === 'BOOLEAN' ? (
    <Select
      value='yes'
      options={boolOptions}
      // onChange=?
      />
  ): (
    <Select
      value=""
      placeholder="Select"
      options={numberOptions}
      />
  ))


  return (
    <>{MainSelect}</>
  )
}

const mapStateToProps = (state) => ({
  filters: state.optimization.networkOptimization.filters,
  activeFilters: state.optimization.networkOptimization.activeFilters,
})

const mapDispatchToProps = dispatch => ({
  loadFilters: () => dispatch(NetworkOptimizationActions.loadFilters()),
  setActiveFilters: (filters) => dispatch(NetworkOptimizationActions.setActiveFilters(filters)),
})

const FilterEditor = wrapComponentWithProvider(reduxStore, FilterEditorComponent, mapStateToProps, mapDispatchToProps)
export default FilterEditor
