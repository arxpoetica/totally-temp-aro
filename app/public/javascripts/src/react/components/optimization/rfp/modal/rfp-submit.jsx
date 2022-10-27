import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Grid, TextInput, Select, FileInput, Button, Alert } from '@mantine/core'
import { IconUpload } from '@tabler/icons'
import { RfpVersionRadioGroup } from './rfp-version-radio-group.jsx'
import RfpModalActions from './rfp-modal-actions'
import { RFP_VERSIONS, NETWORK_TYPES } from './rfp-modal-shared'
import RfpFileImporterUtils from '../rfp-file-importer-utils'
import { Notifier } from '../../../../common/notifications'
import { klona } from 'klona'

const _RfpSubmit = props => {

  const {
    loadRfpTemplates,
    templates,
    submitRfpReport,
    isSubmittingRfp,
    submitResult,
  } = props

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const templates = await loadRfpTemplates(true)
    const { id } = templates.find(({ version }) => version === RFP_VERSIONS.SERVICE_AREA.value)
    setSelectedTemplateId(+id)
  }

  const [rfpVersion, setRfpVersion] = useState(RFP_VERSIONS.SERVICE_AREA.value)
  const [rfpId, setRfpId] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
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

      submitRfpReport(rfpVersion, requestBody)
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

          <RfpVersionRadioGroup
            value={rfpVersion}
            onChange={value => {
              const { id } = templates.find(({ version }) => (+value) === version)
              setSelectedTemplateId(+id)
              setRfpVersion(+value)
            }}
          />

          <Grid.Col lg={4} md={12}>RFP plan name</Grid.Col>
          <Grid.Col lg={8} md={12}>
            <TextInput
              label="Required"
              value={rfpId}
              placeholder="RFP plan name"
              onChange={event => setRfpId(event.currentTarget.value)}
              withAsterisk
            />
          </Grid.Col>

          {setSelectedTemplateId && <>
            <Grid.Col lg={4} md={12}>RFP Template</Grid.Col>
            <Grid.Col lg={8} md={12}>
              <Select
                value={selectedTemplateId}
                data={templates
                  .filter(({ version }) => rfpVersion === version)
                  .map(template => ({ value: template.id, label: template.name }))
                }
                onChange={value => setSelectedTemplateId(+value)}
              />
            </Grid.Col>
          </>}

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
            <Button onClick={submitRfp} disabled={!rfpId || !selectedTemplateId}>
              Submit RFP
            </Button>
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
  templates: state.optimization.rfp.templates,
})

const mapDispatchToProps = dispatch => ({
  submitRfpReport: (rfpVersion, requestBody) => dispatch(RfpModalActions.submitRfpReport(rfpVersion, requestBody)),
  loadRfpTemplates: initial => dispatch(RfpModalActions.loadRfpTemplates(initial))
})

export const RfpSubmit = connect(mapStateToProps, mapDispatchToProps)(_RfpSubmit)
