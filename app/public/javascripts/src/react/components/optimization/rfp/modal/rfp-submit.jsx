import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Grid, Radio, TextInput, Select, FileInput, Button, Alert } from '@mantine/core'
import { IconUpload } from '@tabler/icons'
import RfpModalActions from './rfp-modal-actions'
import RfpFileImporterUtils from '../rfp-file-importer-utils'
import { Notifier } from '../../../../common/notifications'
import { klona } from 'klona'

export const RFP_VERSIONS = {
  SERVICE_AREA: {
    value: 2,
    label: 'Service Area',
  },
  NO_SERVICE_AREA: {
    value: 1,
    label: 'No Service Area',
  },
}

const NETWORK_TYPES = {
  DIRECT_ROUTING: { value: 'DIRECT_ROUTING', label: 'Direct Routing' },
  P2P: { value: 'P2P', label: 'Point-to-Point' },
}

const _RfpSubmit = props => {

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

  const [rfpVersion, setRfpVersion] = useState(RFP_VERSIONS.SERVICE_AREA.value)
  const [rfpId, setRfpId] = useState('New RFP Plan')
  const [networkType, setNetworkType] = useState(NETWORK_TYPES.DIRECT_ROUTING.value)
  const [file, setFile] = useState()

  async function submitRfp() {
    try {
      const selectedTemplate = templates.filter(template => template.id === selectedTemplateId)[0]
      const targets = await RfpFileImporterUtils.loadPointsFromFile(file)
      const requestBody = klona(selectedTemplate.value)
      requestBody.rfpId = rfpId

      requestBody.targets = targets.map(target => {
        const { id, lat, lng, props } = target
        if (rfpVersion === RFP_VERSIONS.NO_SERVICE_AREA.value) {
          return { id: id, point: { type: 'Point', coordinates: [lng, lat] }, props }
        }

        if (rfpVersion === RFP_VERSIONS.SERVICE_AREA.value) {
          return {id: id, latitude: lat, longitude: lng}
        }
      })

      if (rfpVersion === RFP_VERSIONS.SERVICE_AREA.value) {
        requestBody.routingMode = networkType
      }

      submitRfpReport(userId, rfpVersion, requestBody)
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

      : <Grid align="center">

          <Grid.Col lg={4} md={12}>RFP Type</Grid.Col>
          <Grid.Col lg={8} md={12}>
            <Radio.Group
              value={rfpVersion}
              onChange={value => setRfpVersion(+value)}
            >
              {Object.values(RFP_VERSIONS).map(({ value, label }) =>
                <Radio key={value} value={value} label={label} />
              )}
            </Radio.Group>
          </Grid.Col>

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
              data={templates
                .filter(({ version }) => {
                  return rfpVersion === version
                })
                .map(template => ({ value: template.id, label: template.name }))
              }
              onChange={value => setSelectedTemplateId(+value)}
            />
          </Grid.Col>

          {rfpVersion === RFP_VERSIONS.SERVICE_AREA.value && <>
            <Grid.Col lg={4} md={12}>Network Type</Grid.Col>
            <Grid.Col lg={8} md={12}>
              <Select
                value={networkType}
                data={Object.values(NETWORK_TYPES)}
                onChange={setNetworkType}
              />
            </Grid.Col>
          </>}

          <Grid.Col lg={4} md={12}>CSV with Locations</Grid.Col>
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

    }
    {submitResult &&
      <div className="message">
        <Alert title="Results" color={submitResult.type === 'success' ? 'green' : 'red'}>
          {submitResult.message}
        </Alert>
      </div>
    }

    <style jsx>{`
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
  submitRfpReport: (userId, rfpVersion, requestBody) => dispatch(RfpModalActions.submitRfpReport(userId, rfpVersion, requestBody)),
  setSelectedTemplateId: selectedTemplateId => dispatch(RfpModalActions.setSelectedTemplateId(selectedTemplateId)),
  loadRfpTemplates: () => dispatch(RfpModalActions.loadRfpTemplates())
})

export const RfpSubmit = connect(mapStateToProps, mapDispatchToProps)(_RfpSubmit)
