import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import SelectionActions from '../selection/selection-actions'
import SelectionModes from '../selection/selection-modes'

export class PlanTargetList extends Component {
  render () {
    var geometries = []
    var geometryKey = null
    var descriptionKey = null
    if (this.props.activeSelectionModeId === SelectionModes.SELECTED_LOCATIONS) {
      geometryKey = 'locations'
      descriptionKey = 'address'
      geometries = this.props.planTargets[geometryKey]
    } else if (this.props.activeSelectionModeId === SelectionModes.SELECTED_AREAS) {
      geometryKey = 'serviceAreas'
      descriptionKey = 'code'
      geometries = this.props.planTargets[geometryKey]
    } else if (this.props.activeSelectionModeId === SelectionModes.SELECTED_ANALYSIS_AREAS) {
      geometryKey = 'analysisAreas'
      descriptionKey = 'code'
      geometries = this.props.planTargets[geometryKey]
    }

    if (geometries.size === 0) {
      return <div>(no items selected)</div>
    } else {
      return <div>
        <div style={{ backgroundColor: '#e0e0e0', paddingLeft: '10px' }}>
          <span>{geometries.size} items selected</span>
          <button className='btn btn-outline-danger btn-sm float-right'
            style={{ marginTop: '3px' }}
            onClick={() => this.props.removePlanTargets(this.props.planId, { [geometryKey]: this.props.planTargets[geometryKey] })}
          >
            <i className='far fa-trash-alt' />
          </button>
        </div>
        <ul style={{ listStyleType: 'none', paddingLeft: '0px', maxHeight: '200px', overflowY: 'auto', marginBottom: '0px' }}>
          {
            [...geometries].map(item => {
              const description = this.props.planTargetDescriptions[geometryKey][item]
                ? this.props.planTargetDescriptions[geometryKey][item][descriptionKey]
                : 'loading...'
              return <li key={item}>
                <button className='btn btn-thin btn-outline-danger'
                  style={{ border: 'none' }}
                  onClick={() => this.props.removePlanTargets(this.props.planId, { [geometryKey]: new Set([item]) })}
                >
                  <i className='far fa-trash-alt' />
                </button>
                <span style={{ verticalAlign: 'middle' }}>{description}</span>
              </li>
            })
          }
        </ul>
      </div>
    }
  }
}

PlanTargetList.propTypes = {
  planId: PropTypes.number,
  activeSelectionModeId: PropTypes.string,
  planTargets: PropTypes.object,
  planTargetDescriptions: PropTypes.object
}

const mapStateToProps = (state) => ({
  planId: state.plan.activePlan && state.plan.activePlan.id,
  activeSelectionModeId: state.selection.activeSelectionMode.id,
  planTargets: state.selection.planTargets,
  planTargetDescriptions: state.selection.planTargetDescriptions
})

const mapDispatchToProps = (dispatch, ownProps) => ({
  removePlanTargets: (planId, planTargets) => dispatch(SelectionActions.removePlanTargets(planId, planTargets))
})

const PlanTargetListComponent = wrapComponentWithProvider(reduxStore, PlanTargetList, mapStateToProps, mapDispatchToProps)
export default PlanTargetListComponent