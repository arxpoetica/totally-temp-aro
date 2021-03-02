import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import { Collapse, Card, CardHeader, CardBody } from 'reactstrap'
import './sidebar.css'
import RingButton from '../ring-edit/ring-button.jsx'
import RingEdit from '../ring-edit/ring-edit.jsx'
import NetWorkBuildOutput from './analysis/network-build/network-build-output.jsx'
import NetworkOptimizationActions from '../optimization/network-optimization/network-optimization-actions'

export class RingEditor extends Component {
  constructor(props) {
    super(props)

    this.editRingsPanels = Object.freeze({
      EDIT_RINGS: 'EDIT_RINGS',
      OUTPUT: 'OUTPUT',
    })

    this.state = {
      activeEditRingsPanel: this.editRingsPanels.EDIT_RINGS,
    }
  }

  onModifyOptimization() {
    this.props.modifyOptimization(this.props.activePlan)
  }

  handleToggleAccordion(eventArg) {
    const { event } = eventArg.target.dataset
    const { activeEditRingsPanel } = this.state
    this.setState({ activeEditRingsPanel: activeEditRingsPanel === event ? this.editRingsPanels.EDIT_RINGS : event })
  }

  render() {
    const { activeEditRingsPanel } = this.state
    const { planState } = this.props
    return (
      <div className="edit-ring-container">
        <div className="analysis-type">
          <h4 style={{ textAlign: 'center', marginTop: '20px' }}>Ring Edit</h4>
          <RingButton onModify={() => this.onModifyOptimization()} />
        </div>

        {/* Edit Rings Accordion */}
        <Card
          className={`card-collapse ${activeEditRingsPanel === this.editRingsPanels.EDIT_RINGS ? 'collapse-show' : ''}`}
        >
          <CardHeader
            data-event={this.editRingsPanels.EDIT_RINGS} onClick={(event) => this.handleToggleAccordion(event)}
            className={`card-header-dark ${activeEditRingsPanel === this.editRingsPanels.EDIT_RINGS ? 'card-fixed' : ''}`}
          >
            Input
          </CardHeader>
          <Collapse isOpen={activeEditRingsPanel === this.editRingsPanels.EDIT_RINGS}>
            <CardBody style={{ padding: '0px' }}>
              {activeEditRingsPanel === this.editRingsPanels.EDIT_RINGS &&
                <RingEdit />
              }
              {(planState === 'COMPLETED' || planState === 'CANCELED' || planState === 'FAILED') &&
                <div className='disable-sibling-controls' />
              }
            </CardBody>
          </Collapse>
        </Card>

        {/* Output Accordion */}
        <Card
          className={`card-collapse ${activeEditRingsPanel === this.editRingsPanels.OUTPUT ? 'collapse-show' : ''}`}
        >
          <CardHeader
            data-event={this.editRingsPanels.OUTPUT} onClick={(event) => this.handleToggleAccordion(event)}
            className={`card-header-dark ${activeEditRingsPanel === this.editRingsPanels.OUTPUT ? 'card-fixed' : ''}`}
          >
            Output
          </CardHeader>
          <Collapse isOpen={activeEditRingsPanel === this.editRingsPanels.OUTPUT}>
            <CardBody style={{ padding: '0px' }}>
              {activeEditRingsPanel === this.editRingsPanels.OUTPUT &&
                <NetWorkBuildOutput reportTypes="['RING']" />
              }
            </CardBody>
          </Collapse>
        </Card>
      </div>
    )
  }
}

const mapStateToProps = (state) => ({
  planState: state.plan.activePlan.planState,
  activePlan: state.plan.activePlan,
})

const mapDispatchToProps = (dispatch) => ({
  modifyOptimization: (activePlan) => dispatch(NetworkOptimizationActions.modifyOptimization(activePlan)),
})

const RingEditorComponent = wrapComponentWithProvider(
  reduxStore, RingEditor, mapStateToProps, mapDispatchToProps
)
export default RingEditorComponent
