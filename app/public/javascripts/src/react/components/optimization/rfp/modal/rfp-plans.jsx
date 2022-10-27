import React from 'react'
import { Table, Anchor } from '@mantine/core'
import { connect } from 'react-redux'
import { RfpReportDownload } from './rfp-report-download.jsx'
import PlanActions from '../../../plan/plan-actions'
import RfpActions from '../rfp-actions'

const _RfpPlans = props => {

  const {
    rfp,
    definitionsByVersion,
    loadPlan,
    clearRfpState,
    closeModal,
  } = props

  const definitions = definitionsByVersion[rfp.protocolVersion]

  return <div className="rfp-plans">
    <Table striped withBorder withColumnBorders>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Reports</th>
        </tr>
      </thead>
      <tbody>
        {rfp.planIds.map((planId, index) =>
          <tr key={planId}>
            <td>{planId}</td>
            <td>
              <Anchor
                component="button"
                type="button"
                onClick={() => {
                  loadPlan(planId)
                  clearRfpState()
                  closeModal()
                }}
              >
                {rfp.rfpId} ({index + 1})
              </Anchor>
            </td>
            <td>
              {definitions &&
                <RfpReportDownload planId={rfp.id} reportDefinitions={definitions}/>
              }
            </td>
          </tr>
        )}
      </tbody>
    </Table>
    {/* <style jsx>{``}</style> */}
  </div>
}

const mapStateToProps = state => ({})

const mapDispatchToProps = dispatch => ({
  loadPlan: (planId) => dispatch(PlanActions.loadPlan(planId)),
  clearRfpState: () => dispatch(RfpActions.clearRfpState()),
  closeModal: () => dispatch(RfpActions.showOrHideFullScreenContainer(false)),
})

export const RfpPlans = connect(mapStateToProps, mapDispatchToProps)(_RfpPlans)
