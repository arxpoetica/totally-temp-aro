import React from 'react'
import { Grid, Radio } from '@mantine/core'
import { RFP_VERSIONS } from './rfp-modal-shared'

export const RfpVersionRadioGroup = ({ value, onChange }) => <>
  <Grid.Col lg={4} md={12}>RFP Type</Grid.Col>
  <Grid.Col lg={8} md={12}>
    <Radio.Group value={value} onChange={onChange}>
      {Object.values(RFP_VERSIONS).map(({ value, label }) =>
        <Radio key={value} value={value} label={label} />
      )}
    </Radio.Group>
  </Grid.Col>
</>
