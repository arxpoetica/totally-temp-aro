import React, { useState, useEffect } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import { Collapse, Card, CardHeader, CardBody } from 'reactstrap'
import './sidebar.css'
import RingButton from '../ring-edit/ring-button.jsx'
import RingEdit from '../ring-edit/ring-edit.jsx'
import NetWorkBuildOutput from './analysis/network-build/network-build-output.jsx'
import RingEditActions from '../ring-edit/ring-edit-actions'
import { useModals } from '@mantine/modals'

const editRingsPanels = Object.freeze({
  EDIT_RINGS: 'EDIT_RINGS',
  OUTPUT: 'OUTPUT',
})

export function RingEditor (props) {
  const [activeEditRingsPanel, setActiveEditRingsPanel] = useState(editRingsPanels.EDIT_RINGS)
  const modals = useModals()

  useEffect(() => {
    props.setIsEditingRing(
      activeEditRingsPanel === editRingsPanels.EDIT_RINGS
    )
  }, [])

  function onModifyOptimization() {
    modals.openContextModal('OptimizationModal', {
      title: props.transactionId
        ? 'This plan has uncommitted changes.'
        : 'Overwrite the existing plan.',
      size: 'lg',
    })
  }

  function handleToggleAccordion(eventArg) {
    const { event } = eventArg.target.dataset
    const newActiveEditRingsPanel = activeEditRingsPanel === event ? editRingsPanels.EDIT_RINGS : event // I am not sure why this is the way it is or even if it's correct. Shouldn't it just be newActiveEditRingsPanel = event
    setActiveEditRingsPanel(newActiveEditRingsPanel)
    props.setIsEditingRing(editRingsPanels.EDIT_RINGS === newActiveEditRingsPanel)
  }

  return (
    <div className="edit-ring-container">
      <div className="analysis-type">
        <h4 style={{ textAlign: 'center', marginTop: '20px' }}>Ring Edit</h4>
        <RingButton onModify={() => onModifyOptimization()} />
      </div>

      {/* Edit Rings Accordion */}
      <Card
        className={`card-collapse ${activeEditRingsPanel === editRingsPanels.EDIT_RINGS ? 'collapse-show' : ''}`}
      >
        <CardHeader
          data-event={editRingsPanels.EDIT_RINGS} onClick={(event) => handleToggleAccordion(event)}
          className={`card-header-dark ${activeEditRingsPanel === editRingsPanels.EDIT_RINGS ? 'card-fixed' : ''}`}
        >
          Input
        </CardHeader>
        <Collapse isOpen={activeEditRingsPanel === editRingsPanels.EDIT_RINGS}>
          <CardBody style={{ padding: '0px' }}>
            {activeEditRingsPanel === editRingsPanels.EDIT_RINGS &&
              <RingEdit />
            }
            {(props.planState === 'COMPLETED' || props.planState === 'CANCELED' || props.planState === 'FAILED') &&
              <div className='disable-sibling-controls' />
            }
          </CardBody>
        </Collapse>
      </Card>

      {/* Output Accordion */}
      <Card
        className={`card-collapse ${activeEditRingsPanel === editRingsPanels.OUTPUT ? 'collapse-show' : ''}`}
      >
        <CardHeader
          data-event={editRingsPanels.OUTPUT} onClick={(event) => handleToggleAccordion(event)}
          className={`card-header-dark ${activeEditRingsPanel === editRingsPanels.OUTPUT ? 'card-fixed' : ''}`}
        >
          Output
        </CardHeader>
        <Collapse isOpen={activeEditRingsPanel === editRingsPanels.OUTPUT}>
          <CardBody style={{ padding: '0px', paddingBottom: "15%" }}>
            {activeEditRingsPanel === editRingsPanels.OUTPUT &&
              <NetWorkBuildOutput reportTypes="['RING']" />
            }
          </CardBody>
        </Collapse>
      </Card>
    </div>
  )
}

const mapStateToProps = (state) => ({
  planState: state.plan.activePlan.planState,
  transactionId: state.planEditor.transaction && state.planEditor.transaction.id,
})

const mapDispatchToProps = (dispatch) => ({
  setIsEditingRing: (isEditingRing) => dispatch(RingEditActions.setIsEditingRing(isEditingRing)),
})

const RingEditorComponent = wrapComponentWithProvider(
  reduxStore, RingEditor, mapStateToProps, mapDispatchToProps
)
export default RingEditorComponent
