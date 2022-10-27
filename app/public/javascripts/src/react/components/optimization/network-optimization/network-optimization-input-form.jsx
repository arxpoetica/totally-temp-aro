import React, { Component } from 'react'
import { connect } from 'react-redux'
// import { PropTypes } from 'prop-types'
import { Field, reduxForm, getFormValues, change } from 'redux-form'
import Constants from '../../../common/constants'
import NetworkOptimizationActions from './network-optimization-actions'
import { EditorInterface, EditorInterfaceItem } from './editor-interface.jsx'
import FilterEditor from './filter-editor.jsx'
// import NetworkOptimizationInputFormMeta from './network-optimization-input-form-meta'
import { FieldComponents } from '../../common/editor-interface/object-editor.jsx'
import DropdownList from 'react-widgets/lib/DropdownList'
import { set } from '../../../../shared-utils/utilities'
export class NetworkOptimizationInputFormProto extends Component {
  constructor (props) {
    super(props)
    // this.meta = NetworkOptimizationInputFormMeta

    this.AnalysisTypes = [
      { label: 'Near-net Analysis', value: 'UNDEFINED' }, // different endpoint
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
      { label: 'Direct Routing', value: 'DIRECT_ROUTING' },
      { label: 'Hub-only Split', value: 'ODN_1' },
      { label: 'Point-to-Point', value: 'P2P' },
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

    this.AlgorithmComposites = [
      { id: 'UNCONSTRAINED', algorithm: 'UNCONSTRAINED', label: 'Full Coverage',
        excludedFields: [
          'optimization.preIrrThreshold',
          'optimization.threshold',
          'optimization.budget'
        ]
      },
      /*
      { id: 'MAX_IRR', algorithm: 'IRR', label: 'Maximum IRR',
        excludedFields: [
          'optimization.preIrrThreshold',
          'optimization.threshold',
          'optimization.budget'
        ]
      },
      */
      { id: 'BUDGET', algorithm: 'IRR', label: 'Budget',
        excludedFields: [
          'optimization.preIrrThreshold',
          'optimization.threshold'
        ]
      },
      { id: 'IRR_TARGET', algorithm: 'IRR', label: 'Plan IRR Floor',
        excludedFields: [
          'optimization.preIrrThreshold'
        ]
      },
      { id: 'IRR_THRESH', algorithm: 'IRR', label: 'Segment IRR Floor',
        excludedFields: [
          'optimization.threshold',
          'optimization.budget'
        ]
      },
      /*
      // Verizon-specific
      { id: 'TABC', algorithm: 'CUSTOM', label: 'ABCD analysis',
        excludedFields: [
          'optimization.preIrrThreshold',
          'optimization.threshold',
          'optimization.budget'
        ]
      },
      */
      { id: 'COVERAGE', algorithm: 'COVERAGE', label: 'Coverage Target',
        excludedFields: [
          'optimization.preIrrThreshold',
          'optimization.budget'
        ]
      }
    ]
    /*
    this.NetworkTypes = [ // swap out for grouped list
      'Fiber', // Fiber
      'FiveG', // 5G
      'Copper' // DSL
    ]
    */

    this.state = {
      algorithmComposite: this.getAlgorithmComposite(this.props.initialValues)
    }
  }

  render () {
    if (!this.props.values) return ''
    return <div>
      <form className='d-flex flex-column rfp-options'
        style={{ height: '100%' }}
        onSubmit={event => event.preventDefault()}>
        {/*
        <ObjectEditor metaData={this.meta} title={''}
          handleChange={(val, newVal, prevVal, propChain) => this.handleChange(newVal, prevVal, propChain)}
          leftIndent={11} displayOnly={this.props.displayOnly} />
        */}
        {this.renderManualForm()}
      </form>
    </div>
  }

  renderManualForm () {
    let networkTypes = this.props.initialValues.networkTypes
    if (this.props.values && this.props.values.networkTypes) networkTypes = this.props.values.networkTypes

    return (
      <>
        <EditorInterface
          title="Settings"
          footer={this.renderOptimizationOptions()}
        >
          <EditorInterfaceItem subtitle="Endpoint Technology">
            <button className={'btn btn-sm ' + (networkTypes.includes('Fiber') ? 'btn-primary' : 'btn-light')}
              onClick={() => this.toggleNetworkType('Fiber')}
              disabled={this.props.displayOnly}>
              Fiber
            </button>

            <div className='btn-group btn-group-sm' style={{ marginLeft: '5px' }}>
              <button className={'btn btn-sm ' + (networkTypes.includes('FiveG') ? 'btn-primary' : 'btn-light')}
                onClick={() => this.toggleNetworkType('FiveG')}
                disabled={this.props.displayOnly}>
                5G
              </button>

              <button className={'btn btn-sm ' + (networkTypes.includes('Copper') ? 'btn-primary' : 'btn-light')}
                onClick={() => this.toggleNetworkType('Copper')}
                disabled={this.props.displayOnly}>
                DSL
              </button>
            </div>
          </EditorInterfaceItem>
          <EditorInterfaceItem subtitle="Network Construction">
            <Field
              onChange={(val, newVal, prevVal, propChain) => this.handleChange(newVal, prevVal, propChain)}
              name={'routingMode'}
              component={this.filterComponent(FieldComponents.renderDropdownList)}
              valueField='value'
              textField='label'
              data={this.RoutingModes}
            />
          </EditorInterfaceItem>
        </EditorInterface>
        <FilterEditor displayOnly={this.props.displayOnly} />
      </>
    )
  }

  renderOptimizationOptions () {
    // possibly make this its own component
    return this.props.networkAnalysisTypeId === 'NETWORK_PLAN' && this.state.algorithmComposite ? (
      <>
        <div className='ei-header ei-no-pointer'>Optimization</div>
        <div className='ei-gen-level ei-internal-level' style={{ paddingLeft: '11px' }}>
          <div className='ei-items-contain'>

            <div className='ei-property-item'>
              <div className='ei-property-label'>Optimization Type</div>
              <div className='ei-property-value'>
                <DropdownList
                  data={this.AlgorithmComposites}
                  valueField='id'
                  textField='label'
                  value={this.state.algorithmComposite}
                  readOnly={this.props.displayOnly}
                  onChange={(val, event) => this.onAlgorithmChange(val, event)}
                />
              </div>
            </div>
            {!this.state.algorithmComposite.excludedFields.includes('optimization.preIrrThreshold') // algorithm === 'IRR' // IRR_THRESH
              ? (
                <div className='ei-property-item'>
                  <div className='ei-property-label'>Segment IRR Floor</div>
                  <div className='ei-property-value' style={{ flex: 'inherit' }}>
                    <Field
                      className='text-right'
                      min='0.0'
                      max='100.0'
                      step='1.0'
                      onChange={(val, newVal, prevVal, propChain) => this.handleChange(newVal, prevVal, propChain)}
                      name={'optimization.preIrrThreshold'}
                      component={this.filterComponent('input')}
                      type='number'
                      format={this.formatPercent}
                      normalize={this.normalizePercent}
                    />%
                    {!this.props.displayOnly
                      ? (
                        <div>
                          <Field
                            min='0.0'
                            max='1.0'
                            step='0.01'
                            name={'optimization.preIrrThreshold'}
                            onChange={(val, newVal, prevVal, propChain) => this.handleChange(newVal, prevVal, propChain)}
                            style={{ marginTop: '10px', width: '100%' }}
                            component={this.filterComponent('input')}
                            type='range'
                          />
                        </div>
                      ) : ''
                    }
                  </div>
                </div>
              ) : ''
            }
            {!this.state.algorithmComposite.excludedFields.includes('optimization.threshold') // algorithm === 'IRR' || algorithm === 'COVERAGE' // IRR_TARGET || COVERAGE
              ? (
                <div className='ei-property-item'>
                  <div className='ei-property-label'>
                    {this.state.algorithmComposite.id === 'IRR_TARGET' ? 'Plan IRR Floor' : ''}
                    {this.state.algorithmComposite.id === 'COVERAGE' ? 'Coverage Target' : ''}
                  </div>
                  <div className='ei-property-value' style={{ flex: 'inherit' }}>
                    <Field
                      className='text-right'
                      min='0.0'
                      max='100.0'
                      step='1.0'
                      onChange={(val, newVal, prevVal, propChain) => this.handleChange(newVal, prevVal, propChain)}
                      name={'optimization.threshold'}
                      component={this.filterComponent('input')}
                      type='number'
                      format={this.formatPercent}
                      normalize={this.normalizePercent}
                    />%
                    {!this.props.displayOnly
                      ? (
                        <div>
                          <Field
                            min='0'
                            max='1'
                            step='0.01'
                            name={'optimization.threshold'}
                            onChange={(val, newVal, prevVal, propChain) => this.handleChange(newVal, prevVal, propChain)}
                            style={{ marginTop: '10px', width: '100%' }}
                            component={this.filterComponent('input')}
                            type='range'
                          />
                        </div>
                      ) : ''
                    }
                  </div>
                </div>
              ) : ''
            }
            {!this.state.algorithmComposite.excludedFields.includes('optimization.budget') // algorithm === 'IRR' // BUDGET || IRR_TARGET
              ? (
                <div className='ei-property-item'>
                  <div className='ei-property-label'>Target Capital (thousands)</div>
                  <div className='ei-property-value' style={{ flex: 'inherit' }}>
                    <Field
                      className='text-right'
                      onChange={(val, newVal, prevVal, propChain) => this.handleChange(newVal, prevVal, propChain)}
                      name={'optimization.budget'}
                      component={this.filterComponent('input')}
                      type='number'
                      format={this.formatThousands}
                      normalize={this.normalizeThousands}
                    />K
                  </div>
                </div>
              ) : ''
            }

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

          </div>
        </div>
      </>
    ) : null
  }

  toggleNetworkType (networkType) {
    if (this.props.displayOnly) return
    var networkTypes = JSON.parse(JSON.stringify(this.props.values.networkTypes))
    if (networkTypes.includes(networkType)) {
      networkTypes.splice(networkTypes.indexOf(networkType), 1)
      networkTypes = this.removeByVal(networkTypes, networkType)
    } else {
      networkTypes.push(networkType)
      if (networkType === 'FiveG') networkTypes = this.removeByVal(networkTypes, 'Copper')
      if (networkType === 'Copper') networkTypes = this.removeByVal(networkTypes, 'FiveG')
    }
    this.props.values.networkTypes = networkTypes
    this.props.dispatch(change(Constants.NETWORK_OPTIMIZATION_INPUT_FORM, 'networkTypes', networkTypes))
    this.props.setOptimizationInputs(this.props.values)
  }

  removeByVal (arr, val) {
    arr = JSON.parse(JSON.stringify(arr))
    if (arr.includes(val)) {
      arr.splice(arr.indexOf(val), 1)
    }
    return arr
  }

  filterComponent (component) {
    if (this.props.displayOnly) {
      return FieldComponents.renderDisplayOnly
    } else {
      return component
    }
  }

  handleChange (newVal, prevVal, propChain) {
    const newObj = this.props.values
    set(newObj, propChain, newVal)
    this.props.setOptimizationInputs(newObj)
  }

  getAlgorithmComposite (vals) {
    if (!vals) return this.AlgorithmComposites[0]
    // ToDo: get rid of this polymorphism and composite settings
    var algorithm = vals.optimization.algorithm
    if (algorithm === 'IRR') {
      /*
      if (!vals.optimization.preIrrThreshold && !vals.optimization.threshold && !Number.isFinite(+vals.optimization.budget)) {
        algorithm = 'MAX_IRR'
      } else */
      if (vals.optimization.preIrrThreshold === null && vals.optimization.threshold === null) {
        algorithm = 'BUDGET'
      } else if (vals.optimization.preIrrThreshold === null) {
        algorithm = 'IRR_TARGET'
      } else {
        algorithm = 'IRR_THRESH'
      }
    }

    return this.AlgorithmComposites.find(item => item.id === algorithm)
  }

  onAlgorithmChange (newVal, event) {
    this.setState({ algorithmComposite: newVal })
    this.props.values.optimization.algorithm = newVal.algorithm
    this.props.dispatch(change(Constants.NETWORK_OPTIMIZATION_INPUT_FORM, 'optimization.algorithm', newVal.algorithm))
    this.props.setOptimizationInputs(this.props.values)
    if (newVal.id !== 'IRR_THRESH') {
      this.props.values.optimization.preIrrThreshold = null
    }
    newVal.excludedFields.forEach(fieldName => {
      this.props.dispatch(change(Constants.NETWORK_OPTIMIZATION_INPUT_FORM, fieldName, null))
    })
  }

  formatPercent (val, prevVal) { // store -> UI
    return parseFloat(val * 100.0).toFixed(0)
  }

  normalizePercent (val, prevVal) { // UI -> store
    var newVal = parseFloat(val * 0.01).toFixed(2)
    if (newVal < 0.0) newVal = 0.00
    if (newVal > 1.0) newVal = 1.00
    return newVal
  }

  formatThousands (val, prevVal) { // store -> UI
    return parseFloat(val * 0.001).toFixed(0)
  }

  normalizeThousands (val, prevVal) { // UI -> store
    return parseFloat(val * 1000.0).toFixed(0)
  }
}

NetworkOptimizationInputFormProto.defaultProps = {
  handleChange: (...args) => {}
}

const mapStateToProps = (state) => ({
  values: getFormValues(Constants.NETWORK_OPTIMIZATION_INPUT_FORM)(state)
})

const mapDispatchToProps = dispatch => ({
  setOptimizationInputs: networkTypeInput => dispatch(NetworkOptimizationActions.setOptimizationInputs(networkTypeInput))
})
let NetworkOptimizationInputForm = reduxForm({
  form: Constants.NETWORK_OPTIMIZATION_INPUT_FORM
})(
  connect(mapStateToProps, mapDispatchToProps)(NetworkOptimizationInputFormProto)
)

export default NetworkOptimizationInputForm
