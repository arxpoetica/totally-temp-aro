import React, { useContext } from 'react'
import { Table, Button } from '@mantine/core'
import { connect } from 'react-redux'
import { RfpContext } from './rfp-modal.jsx'
import PlanActions from '../../../plan/plan-actions'
import RfpActions from '../rfp-actions'

const _RfpPlans = ({ rfp, loadPlan, clearRfpState, closeModal }) => {

  const { rfpReportDefinitions } = useContext(RfpContext)

  return <div className="rfp-plans">
    <Table striped highlightOnHover withBorder withColumnBorders>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          {/* <th>Created by</th> */}
          {/* <th>Reports</th> */}
        </tr>
      </thead>
      <tbody>
        {rfp.planIds.map((planId, index) =>
          <tr key={planId}>
            <td>{planId}</td>
            <td>
              <div className="plan">
                {rfp.request.rfpId} {index + 1}
                <Button
                  variant="outline"
                  color="dark"
                  onClick={() => {
                    loadPlan(planId)
                    clearRfpState()
                    closeModal()
                  }}
                >
                  Load Plan
                </Button>
              </div>
            </td>
            {/* <td>Created by</td> */}
            {/* <td>Reports</td> */}
          </tr>
        )}
      </tbody>
    </Table>
    <style jsx>{`
      .plan {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
      }
    `}</style>
  </div>
}

const mapStateToProps = state => ({})
const mapDispatchToProps = dispatch => ({
  loadPlan: (planId) => dispatch(PlanActions.loadPlan(planId)),
  clearRfpState: () => dispatch(RfpActions.clearRfpState()),
  closeModal: () => dispatch(RfpActions.showOrHideFullScreenContainer(false)),
})

export const RfpPlans = connect(mapStateToProps, mapDispatchToProps)(_RfpPlans)
