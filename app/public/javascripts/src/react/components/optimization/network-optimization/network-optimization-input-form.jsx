import React, { Component } from 'react'
import { connect } from 'react-redux'
// import { PropTypes } from 'prop-types'
import { Field, reduxForm } from 'redux-form'
import Constants from '../../../common/constants'
import NetworkOptimizationInputFormMeta from './network-optimization-input-form-meta'
import { ObjectEditor, FieldComponents } from '../../common/editor-interface/object-editor.jsx'


export class NetworkOptimizationInputFormProto extends Component {
  constructor (props) {
    super(props)
    this.meta = NetworkOptimizationInputFormMeta

    this.AnalysisTypes = [
      { label: 'Near-net Analysis', value: 'UNDEFINED' },
      { label: 'Network Build', value: 'NETWORK_PLAN' },
      { label: 'Network Analysis', value: 'NETWORK_ANALYSIS' },
      { label: 'Coverage Analysis', value: 'COVERAGE' },
      { label: 'Manual', value: 'MANUAL' },
      { label: 'point to point', value: 'POINT_TO_POINT' },
      { label: 'Location ROIC', value: 'LOCATION_ROIC' },
      { label: 'RFP', value: 'RFP' },
      { label: 'Ring', value: 'RING' }
    ]
    /*
    { label: '', value: 
    { id: 'NETWORK_PLAN', label: 'Network Build', type: 'NETWORK_PLAN' },
    { id: 'NETWORK_ANALYSIS', label: 'Network Analysis', type: 'NETWORK_ANALYSIS' },
    { id: 'COVERAGE_ANALYSIS', label: 'Coverage Analysis', type: 'COVERAGE' },
    { id: 'RFP', label: 'RFP Analyzer', type: 'RFP' },
    { id: 'NEARNET_ANALYSIS', label: 'Near-net Analysis', type: 'UNDEFINED' },
    { id: 'EXPERT_MODE', label: 'Expert Mode', type: 'Expert' }
    */

    this.RoutingModes = [// Network Construction
      { label: 'Undefined', value: 'UNDEFINED' },
      { label: 'Default', value: 'DEFAULT' },
      { label: 'Direct Routing', value: 'DIRECT_ROUTING' },
      { label: 'Hub-only split', value: 'ODN_1' },
      { label: 'Hub-distribution split', value: 'ODN_2' },
      { label: 'Hybrid split', value: 'ODN_3' }
    ]

    this.OptimizationModes = [// Pruning Strategy
      { label: 'Inter Service Area', value: 'INTER_WIRECENTER' },
      { label: 'Intra Service Area', value: 'INTRA_WIRECENTER' }
    ]
/*
    this.AnalysisSelectionModes = [
      'UNDEFINED',
      'SELECTED_LOCATIONS',
      'SELECTED_AREAS',
      'SELECTED_ANALYSIS_AREAS',
      'ALL_SERVICE_AREAS',
      'ALL_PLAN_AREAS'
    ]
*/
    this.AlgorithmNames = [
      { label: 'Full Coverage', value: 'UNCONSTRAINED' },
      { label: 'Super Layer Routing', value: 'SUPER_LAYER_ROUTING' },
      { label: 'CAPEX', value: 'CAPEX' },
      { label: 'Coverage Target', value: 'COVERAGE' },
      { label: 'IRR', value: 'IRR' },
      { label: 'NPV', value: 'NPV' },
      { label: 'Custom', value: 'CUSTOM' }
    ]
/*
{
      UNCONSTRAINED: { id: 'UNCONSTRAINED', algorithm: 'UNCONSTRAINED', label: 'Full Coverage' },
      MAX_IRR: { id: 'MAX_IRR', algorithm: 'IRR', label: 'Maximum IRR' },
      BUDGET: { id: 'BUDGET', algorithm: 'IRR', label: 'Budget' },
      IRR_TARGET: { id: 'IRR_TARGET', algorithm: 'IRR', label: 'Plan IRR Floor' },
      IRR_THRESH: { id: 'IRR_THRESH', algorithm: 'IRR', label: 'Segment IRR Floor' },
      TABC: { id: 'TABC', algorithm: 'CUSTOM', label: 'ABCD analysis' }, // Verizon-specific
      COVERAGE: { id: 'COVERAGE', algorithm: 'COVERAGE', label: 'Coverage Target' }
    }
*/
    this.NetworkTypes = [ // swap out for grouped list
      'Fiber', // Fiber
      'FiveG', // 5G
      'Copper' // DSL
    ]
  }

  render () {
    return <div>
      <form className='d-flex flex-column rfp-options'
        style={{ height: '100%' }}
        onSubmit={event => event.preventDefault()}>
        <ObjectEditor metaData={this.meta} title={''}
          handleChange={(val, newVal, prevVal, propChain) => this.handleChange(newVal, prevVal, propChain)}
          leftIndent={11} displayOnly={this.props.displayOnly} />
        {this.renderManualForm()}
      </form>
    </div>
  }

  renderManualForm () {
    console.log(this)
    // console.log(this.props.initialValues.optimization.algorithm)
    return (
      <div className='ei-items-contain object-editor'>
        <div className='ei-header ei-no-pointer'>Settings</div>
        <div className='ei-gen-level ei-internal-level' style={{ paddingLeft: '11px' }}>
          <div className='ei-items-contain'>

            <div className='ei-property-item'>
              <div className='ei-property-label'>Analysis Type</div>
              <div className='ei-property-value'>
                <Field
                  onChange={(val, newVal, prevVal, propChain) => this.handleChange(newVal, prevVal, propChain)}
                  name={'analysis_type'}
                  component={this.filterComponent(FieldComponents.renderDropdownList)}
                  valueField='value'
                  textField='label'
                  data={this.AnalysisTypes}
                />
              </div>
            </div>

            <div className='ei-property-item'>
              <div className='ei-property-label'>Pruning Strategy</div>
              <div className='ei-property-value'>
                <Field
                  onChange={(val, newVal, prevVal, propChain) => this.handleChange(newVal, prevVal, propChain)}
                  name={'fronthaulOptimization.optimizationMode'}
                  component={this.filterComponent(FieldComponents.renderDropdownList)}
                  valueField='value'
                  textField='label'
                  data={this.OptimizationModes}
                />
              </div>
            </div>

            <div className='ei-property-item'>
              <div className='ei-property-label'>Endpoint Technology</div>
              <div className='ei-property-value'>
                networkTypes
              </div>
            </div>

            <div className='ei-property-item'>
              <div className='ei-property-label'>Network Construction</div>
              <div className='ei-property-value'>
                <Field
                  onChange={(val, newVal, prevVal, propChain) => this.handleChange(newVal, prevVal, propChain)}
                  name={'routingMode'}
                  component={this.filterComponent(FieldComponents.renderDropdownList)}
                  valueField='value'
                  textField='label'
                  data={this.RoutingModes}
                />
              </div>
            </div>
          </div>
        </div>

        <div className='ei-header ei-no-pointer'>Optimization</div>
        <div className='ei-gen-level ei-internal-level' style={{ paddingLeft: '11px' }}>
          <div className='ei-items-contain'>

            <div className='ei-property-item'>
              <div className='ei-property-label'>Optimization Type</div>
              <div className='ei-property-value'>
                <Field
                  onChange={(val, newVal, prevVal, propChain) => this.handleChange(newVal, prevVal, propChain)}
                  name={'optimization.algorithm'}
                  component={this.filterComponent(FieldComponents.renderDropdownList)}
                  valueField='value'
                  textField='label'
                  data={this.AlgorithmNames}
                />
              </div>
            </div>
            {this.props.initialValues.optimization.algorithm === 'IRR'
              ? (
                <div className='ei-property-item'>
                  <div className='ei-property-label'>Target Capital</div>
                  <div className='ei-property-value'>
                    <Field
                      onChange={(val, newVal, prevVal, propChain) => this.handleChange(newVal, prevVal, propChain)}
                      name={'optimization.budget'}
                      component={this.filterComponent('input')}
                      type='number'
                    />
                  </div>
                </div>
              )
              : ''
            }
            <div className='ei-property-item'>
              <div className='ei-property-label'>Segment IRR Floor</div>
              <div className='ei-property-value'>
                <Field
                  onChange={(val, newVal, prevVal, propChain) => this.handleChange(newVal, prevVal, propChain)}
                  name={'optimization.preIrrThreshold'}
                  component={this.filterComponent('input')}
                  type='number'
                />
              </div>
            </div>

            <div className='ei-property-item'>
              <div className='ei-property-label'>Plan IRR Floor / Coverage Target</div>
              <div className='ei-property-value'>
                <Field
                  onChange={(val, newVal, prevVal, propChain) => this.handleChange(newVal, prevVal, propChain)}
                  name={'optimization.threshold'}
                  component={this.filterComponent('input')}
                  type='number'
                />
              </div>
            </div>

            

            
          </div>
        </div>
      </div>
    )
  }

  filterComponent (component) {
    if (this.props.displayOnly) {
      return FieldComponents.renderDisplayOnly
    } else {
      return component
    }
  }
/*
  renderDropdownList ({ input, ...rest }) {
    return <DropdownList {...input} onBlur={() => input.onBlur()} {...rest} />
  }
*/
  handleChange (newVal, prevVal, propChain) {
    console.log({ newVal, prevVal, propChain })
    switch (propChain) {
      case 'optimization.algorithm':
        this.onAlgorithmChange(newVal, prevVal, propChain)
        break
      case 'analysis_type':
        this.onAnalysisTypeChange(newVal, prevVal, propChain)
        break
    }

    this.props.handleChange(newVal, prevVal, propChain)
    /*
    var filterVal = newVal
    if (typeof filterVal === 'object' && filterVal.hasOwnProperty('value')) filterVal = filterVal.value
    return filterVal
    */
  }

  onAlgorithmChange (newVal, prevVal, propChain) {
    console.log('change optimization.algorithm')
  }

  onAnalysisTypeChange (newVal, prevVal, propChain) {
    console.log('change onAnalysisTypeChange')
  }

}

NetworkOptimizationInputFormProto.defaultProps = {
  handleChange: (...args) => {}
}

let NetworkOptimizationInputForm = reduxForm({
  form: Constants.NETWORK_OPTIMIZATION_INPUT_FORM
})(NetworkOptimizationInputFormProto)

export default NetworkOptimizationInputForm
