/* global test expect */
import React from 'react'
import { shallow } from 'enzyme'
import RfpStatusRow from '../rfp-status-row.jsx'

const plan = {
  id: 42,
  name: 'RFP plan',
  createdBy: 4
}
const allPlanStates = [
  'UNDEFINED', 'START_STATE', 'INITIALIZED', 'STARTED', 'COMPLETED', 'CANCELED', 'FAILED'
]

const systemActors = {
  3: { id: 3, name: 'Public', description: 'Public users have read access to library items created during ETL', deleted: false, type: 'group' },
  4: { id: 4, firstName: 'Admin', lastName: 'User', type: 'user' }
}

// -----------------------------------------------------------------------------
test('When system actors are not loaded', () => {
  const component = shallow(
    <RfpStatusRow
      planId={plan.id}
      name={plan.name}
      createdById={plan.createdBy}
      status={'START_STATE'}
      reportDefinitions={[]}
      systemActors={{}}
      userId={42}
    />
  )
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('When system actors are loaded', () => {
  const component = shallow(
    <RfpStatusRow
      planId={plan.id}
      name={plan.name}
      createdById={plan.createdBy}
      status={'START_STATE'}
      reportDefinitions={[]}
      systemActors={systemActors}
      userId={42}
    />
  )
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('All plan states', () => {
  const component = shallow(
    <RfpStatusRow
      planId={plan.id}
      name={plan.name}
      createdById={plan.createdBy}
      status={'START_STATE'}
      reportDefinitions={[]}
      systemActors={systemActors}
      userId={42}
    />
  )
  allPlanStates.forEach(planState => {
    component.setProps({ status: planState })
    expect(component).toMatchSnapshot()
  })
})
