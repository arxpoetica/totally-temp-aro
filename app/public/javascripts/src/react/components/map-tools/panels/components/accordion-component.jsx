import React from 'react'
import { connect } from 'react-redux'
import { Accordion as MantineAccordion } from '@mantine/core';
import { IconMinus } from '@tabler/icons';
import AccordionCheckboxComponent from './accordion-checkbox-component.jsx';
import AccordionThresholdComponent from './accordion-threshold-component.jsx';
import AccordionRadioComponent from './accordion-radio-component.jsx';
import AccordionMultiInputComponent from './accordion-multi-input-component.jsx'

const compDictonary = {
  threshold: AccordionThresholdComponent,
  rangeThreshold: AccordionThresholdComponent,
  multiSelect: AccordionCheckboxComponent,
  singleSelect: AccordionRadioComponent,
  multiInput: AccordionMultiInputComponent
}

const Accordion = (props) => {
  const {
    filter,
    isExpanded,
    layer
  } = props

  const Component = compDictonary[filter.type]

  return (
    <MantineAccordion.Item value={filter.attributeKey}>
      <MantineAccordion.Control
        chevron={ isExpanded && <IconMinus size={16} /> }
      >
        {filter.label}
      </MantineAccordion.Control>
      <MantineAccordion.Panel>
        <Component layer={layer} filter={filter} values={filter.values} />
      </MantineAccordion.Panel>
    </MantineAccordion.Item>
  )
}

const mapStateToProps = () => {return {}}

const AccordionComponent = connect(mapStateToProps, {})(Accordion)
export default AccordionComponent
