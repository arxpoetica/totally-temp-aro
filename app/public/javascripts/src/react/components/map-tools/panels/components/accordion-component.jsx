import React, { useState } from 'react'
import { connect } from 'react-redux'
import { Accordion as MantineAccordion } from '@mantine/core';
import { IconPlus, IconMinus } from '@tabler/icons';

const Accordion = (props) => {
  const {
    data,
    defaultValues = []
  } = props

  const [expandedAccords, setExpandedAccords] = useState(defaultValues)

  return (
    <MantineAccordion
      multiple
      value={expandedAccords}
      onChange={setExpandedAccords}
      chevron={<IconPlus size={16} />}
      styles={{
        control: {
          backgroundColor: "#dddddd",
          padding: '8px 8px',
          ':hover': {
            backgroundColor: "#dddddd"
          }
        },
        chevron: {
          backgroundColor: "white",
          height: "1.5em",
          width: "1.5em",
          borderRadius: "5px",
        },
        content: {
          paddingTop: '16px'
        }
      }}
    >
      {data.map(dataItem => {
        return (
          <div key={dataItem.attributeKey} style={{ paddingBottom: '1px' }}>
            <MantineAccordion.Item value={dataItem.attributeKey}>
              <MantineAccordion.Control
                chevron={expandedAccords.includes(dataItem.attributeKey) && <IconMinus size={16} /> }
              >
                {dataItem.label}
              </MantineAccordion.Control>
              <MantineAccordion.Panel>
                {dataItem.body}
              </MantineAccordion.Panel>
            </MantineAccordion.Item>
          </div>
        )
      })}
    </MantineAccordion>
  )
}

const mapStateToProps = () => {return {}}

const AccordionComponent = connect(mapStateToProps, {})(Accordion)
export default AccordionComponent
