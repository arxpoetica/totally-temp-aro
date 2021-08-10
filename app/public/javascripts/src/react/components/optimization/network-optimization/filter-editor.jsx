import React, {useEffect, useState} from 'react'
import { propTypes } from 'react-widgets/lib/SelectList'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import { EditorInterface, EditorInterfaceItem } from './editor-interface.jsx'
import NetworkOptimizationActions from './network-optimization-actions'
import { Select } from '../../common/forms/Select.jsx'
import { Input } from '../../common/forms/Input.jsx'
// import './editor-interfaces.css'


const boolOptions = [{value: 'True', label: 'Yes'}, {value: 'False', label: 'No'}]

const numberOptions = [
  {value: 'EQ', label: 'Equal'}, 
  {value: 'NEQ', label: 'Not Equal'},
  {value: 'GT', label: 'Greater Than'},
  {value: 'GTE', label: 'Greater Than or Equal'},
  {value: 'LT', label: 'Less Than'},
  {value: 'LTE', label: 'Less Than or Equal'},
]

export const FilterEditorComponent = ({loadFilters, setActiveFilters, activeFilters, filters}) => {
  const [textValues, setTextValues] = useState({})

  useEffect(() => {
    loadFilters()
  }, [])

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
  }

  const addNewFilter = () => {
    setActiveFilters([...activeFilters, newFilter])
  }

  const selectFilterType = (event, index) => {
    const selectedFilter = filters.find(filter => filter.name === event.target.value)
    const newActiveFilters = activeFilters
    newActiveFilters[index] = selectedFilter

    setActiveFilters([...newActiveFilters])
  }

  const removeActiveFilter = (index) => {
    const newActiveFilters = activeFilters.filter((activeFilter, i) => i !== index)

    setActiveFilters([...newActiveFilters])
  }

  const selectOperator = (event, filter, index) => {
    const newActiveFilters = activeFilters
    newActiveFilters[index] = {...filter, operator: event.target.value}

    setActiveFilters([...newActiveFilters])
  }
  
  const FilterEditorItem = ({ filter, index }) => {
    // generate the forms based on type right now just number or boolean
    // possible formats: STRING, NUMBER, INTEGER, BOOLEAN
    // possible operations: EQ, NEQ, GT, GTE, LT, LTE, IN, RANGE
    const MainSelect = (filter.format === 'BOOLEAN' ? (
      <Select
        value={filter.operator}
        placeholder="Select"
        options={boolOptions}
        onChange={event => selectOperator(event, filter, index)}
        />
    ): (
      <div className='ei-filter-input-container'>
        <Select
          value={filter.operator}
          placeholder="Select"
          options={numberOptions}
          onChange={event => selectOperator(event, filter, index)}
          />
        <Input 
          type="number"
          value={}
          // onChange={event => setTextValues()}
        />
      </div>
    ))
  
    return MainSelect
  }

  const FilterSelect = (index) => {
    return (
        <>
          <i className="ei-property-icon trashcan svg" onClick={() => removeActiveFilter(index)} />
          <Select 
          value={activeFilters[index].value}
          placeholder="Select"
          options={filters}
          // onClick={event => event.stopPropagation()}
          onChange={(event) => selectFilterType(event, index)}
          />
      </>
    )
  }

  return (
    <EditorInterface title="Filters" action={addNewFilter}>
      {activeFilters.map((activeFilter, index) => (
        (activeFilter.displayName ? (
          <EditorInterfaceItem subtitle={FilterSelect(index)} key={index}>
            <FilterEditorItem filter={activeFilter} index={index}/>
          </EditorInterfaceItem>
          ) : (
          <EditorInterfaceItem subtitle={FilterSelect(index)} key={index} />
          )
        )   
      ))}
    </EditorInterface>
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
