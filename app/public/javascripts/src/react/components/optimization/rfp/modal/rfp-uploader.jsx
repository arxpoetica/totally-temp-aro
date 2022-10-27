import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Grid, Radio, TextInput, Select, FileInput, Button, Alert } from '@mantine/core'
import { IconUpload } from '@tabler/icons'
import RfpModalActions from './rfp-modal-actions'
import RfpFileImporterUtils from '../rfp-file-importer-utils'
import { Notifier } from '../../../../common/notifications'
import { klona } from 'klona'

const RFP_TYPES = {
  SERVICE_AREA: {
    value: 'service-area',
    label: 'Service Area',
  },
  NO_SERVICE_AREA: {
    value: 'no-service-area',
    label: 'No Service Area',
  },
}

const _RfpUploader = props => {

  const {
    loadRfpTemplates,
    templates,
    selectedTemplateId,
    submitRfpReport,
    userId,
    isSubmittingRfp,
    setSelectedTemplateId,
    submitResult,
  } = props

  useEffect(() => { loadRfpTemplates() }, [])

  const [rfpType, setRfpType] = useState(RFP_TYPES.SERVICE_AREA.value)
  const [rfpId, setRfpId] = useState('New RFP Plan')
  const [file, setFile] = useState()

  async function submitRfp() {
    try {
      const selectedTemplate = templates.filter(template => template.id === selectedTemplateId)[0]
      const targets = await RfpFileImporterUtils.loadPointsFromFile(file)
      const requestBody = klona(selectedTemplate.value)
      requestBody.rfpId = rfpId
      requestBody.targets = targets.map(target => {
        const { id, lat, lng, props } = target
        return { id: id, point: { type: 'Point', coordinates: [lng, lat] }, props }
      })
      submitRfpReport(userId, requestBody)
    } catch (error) {
      Notifier.error(error)
    }
  }

  return <>

    {isSubmittingRfp

      ? <div className='row p-5 text-center' style={{ height: '300px', width: '100%' }}>
          <div style={{ width: '100%' }}>
            <div className='fa fa-5x fa-spin fa-spinner mb-4' />
            <h4>Submitting RFP...</h4>
          </div>
        </div>

      : <>

        <div className="radio-group">
          <h2 className="subtitle h5">RFP Type</h2>
          <Radio.Group
            value={rfpType}
            onChange={setRfpType}
          >
            {Object.values(RFP_TYPES).map(({ value, label }) =>
               <Radio key={value} value={value} label={label} />
            )}
          </Radio.Group>
        </div>

        <Grid>
          <Grid.Col lg={4} md={12}>RFP plan name</Grid.Col>
          <Grid.Col lg={8} md={12}>
            <TextInput
              value={rfpId}
              placeholder="Type a plan name..."
              onChange={event => setRfpId(event.currentTarget.value)}
            />
          </Grid.Col>

          <Grid.Col lg={4} md={12}>RFP Template</Grid.Col>
          <Grid.Col lg={8} md={12}>
            <Select
              value={selectedTemplateId || ''}
              data={templates.map(template => {
                return { value: template.id, label: template.name }
              })}
              onChange={value => setSelectedTemplateId(+value)}
            />
          </Grid.Col>

          <Grid.Col lg={4} md={12}>Network Type</Grid.Col>
          <Grid.Col lg={8} md={12}>
              <Select
                value={'P2P'}
                data={[
                  { value: 'P2P', label: 'Point-to-Point' },
                  { value: 'full-network', label: 'Full Network' },
                ]}
                onChange={value => console.log(value)}
              />
          </Grid.Col>

          <Grid.Col lg={4} md={12}>CSV with locations</Grid.Col>
          <Grid.Col lg={8} md={12}>
            <FileInput
              value={file}
              icon={<IconUpload size={14}/>}
              placeholder="Choose a file"
              onChange={setFile}
              accept="text/csv"
            />
          </Grid.Col>

          <Grid.Col span={12}>
            <Button onClick={submitRfp}>Submit RFP</Button>
          </Grid.Col>
        </Grid>
      </>

    }
    {submitResult &&
      <div className="message">
        <Alert title="Results" color={submitResult.type === 'success' ? 'green' : 'red'}>
          {submitResult.message}
        </Alert>
      </div>
    }

    <style jsx>{`
      .radio-group {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        margin: 0 0 20px;
      }
      .subtitle {
        margin: 0;
      }
      .message {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
    `}</style>
  </>
}

const mapStateToProps = state => ({
  isSubmittingRfp: state.optimization.rfp.isSubmittingRfp,
  submitResult: state.optimization.rfp.submitResult,
  selectedTemplateId: state.optimization.rfp.selectedTemplateId,
  templates: state.optimization.rfp.templates,
  userId: state.user.loggedInUser.id
})

const mapDispatchToProps = dispatch => ({
  submitRfpReport: (userId, requestBody) => dispatch(RfpModalActions.submitRfpReport(userId, requestBody)),
  setSelectedTemplateId: selectedTemplateId => dispatch(RfpModalActions.setSelectedTemplateId(selectedTemplateId)),
  loadRfpTemplates: () => dispatch(RfpModalActions.loadRfpTemplates())
})

export const RfpUploader = connect(mapStateToProps, mapDispatchToProps)(_RfpUploader)
