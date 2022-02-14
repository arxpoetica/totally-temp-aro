import React from 'react'
import PlanEditor from './plan-editor.jsx'
import { Card, CardHeader, CardBody } from 'reactstrap'

const PlanEditorContainer = () => {
  return (
    <div className="edit-plan-container">
      <Card className="card-collapse card-scroll">
        <CardHeader className="card-header-dark">Edit Plan</CardHeader>
        <CardBody className="card-body-space">
          <PlanEditor />
        </CardBody>
      </Card>
    </div>
  )
}

export default PlanEditorContainer
