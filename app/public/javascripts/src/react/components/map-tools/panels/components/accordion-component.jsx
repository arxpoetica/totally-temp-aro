import React from 'react'
import { connect } from 'react-redux'
import { Accordion } from '@mantine/core';
import { IconMinus } from '@tabler/icons';
import AccordionCheckboxComponent from './accordion-checkbox-component.jsx';
import AccordionThresholdComponent from './accordion-threshold-component.jsx';
import AccordionRadioComponent from './accordion-radio-component.jsx';
import AccordionMultiInputComponent from './accordion-multi-input-component.jsx'

const compDictonary = {
  threshold: AccordionThresholdComponent,
  range_threshold: AccordionThresholdComponent,
  multiSelect: AccordionCheckboxComponent,
  singleSelect: AccordionRadioComponent,
  multiInput: AccordionMultiInputComponent
}

const PanelAccordion = (props) => {
  const {
    filter,
    isExpanded,
  } = props

  const Component = compDictonary[filter.type]

  return (
    <Accordion.Item value={filter.attributeKey}>
      <Accordion.Control
        chevron={ isExpanded && <IconMinus size={16} /> }
      >
        {filter.label}
      </Accordion.Control>
      <Accordion.Panel>
        <Component filter={filter} values={filter.values} />
      </Accordion.Panel>
    </Accordion.Item>
  )
}

const mapStateToProps = () => {return {}}

const PanelAccordionComponent = connect(mapStateToProps, {})(PanelAccordion)
export default PanelAccordionComponent
