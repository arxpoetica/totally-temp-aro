import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { Grid, TextInput, FileInput, Button, Table } from '@mantine/core'
import { IconTrash, IconUpload } from '@tabler/icons'
import { RfpVersionRadioGroup } from './rfp-version-radio-group.jsx'
import RfpModalActions from './rfp-modal-actions'
import AroHttp from '../../../../common/aro-http'
import { RFP_VERSIONS } from './rfp-modal-shared'
import { Notifier } from '../../../../common/notifications'

const uploadTemplate = async (file, templateName, rfpVersion) => {
  try {
    const reader = new FileReader()
    const template = await new Promise((resolve, reject) => {
      reader.onload = event => resolve(event.target.result)
      reader.onerror = () => reject(new Error('Failed to read JSON template file.'))
      reader.readAsText(file)
    })
    // FIXME: this should be a service endpoint
    await AroHttp.post('/ui/rfp_template', { templateName, template, rfpVersion })
  } catch (error) {
    Notifier.error(error)
  }
}

const deleteTemplate = async templateId => {
  try {
    // FIXME: this should be a service endpoint
    await AroHttp.delete(`/ui/rfp_template/${templateId}`)
  } catch (error) {
    Notifier.error(error)
  }
}

const _RfpTemplateManager = props => {

  const { templates, loadRfpTemplates } = props

  useEffect(() => { loadRfpTemplates() }, [])

  const [rfpVersion, setRfpVersion] = useState(RFP_VERSIONS.SERVICE_AREA.value)
  const [templateName, setTemplateName] = useState('')
  const [file, setFile] = useState('')

  return <>
    <h4>Existing templates</h4>
    <Table striped highlightOnHover withBorder withColumnBorders>
      <thead>
        <tr>
          <th>Version</th>
          <th>Name</th>
          <th>Value</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {templates.map(template => (
          <tr key={template.id}>
            <td>{template.version}</td>
            <td>{template.name}</td>
            <td>
              <pre>
                {JSON.stringify(template.value, null, 2)}
              </pre>
            </td>
            <td>
              <Button
                leftIcon={<IconTrash size={20} stroke={2}/>}
                onClick={async() => {
                  await deleteTemplate(template.id)
                  loadRfpTemplates()
                }}
                color="red"
              >
                Delete
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>

    <hr />

    <h4>Upload new template</h4>
    <Grid align="center">
      <RfpVersionRadioGroup
        value={rfpVersion}
        onChange={value => setRfpVersion(+value)}
      />

      <Grid.Col lg={4} md={12}>Template name</Grid.Col>
      <Grid.Col lg={8} md={12}>
        <TextInput
          value={templateName}
          onChange={event => setTemplateName(event.currentTarget.value)}
        />
      </Grid.Col>

      <Grid.Col lg={4} md={12}>Select JSON file to upload</Grid.Col>
      <Grid.Col lg={8} md={12}>
        <FileInput
          value={file}
          icon={<IconUpload size={14}/>}
          placeholder="Choose a file"
          onChange={setFile}
          accept="application/json"
        />
      </Grid.Col>

      <Grid.Col span={12}>
        <Button
          leftIcon={<IconUpload size={20} stroke={2}/>}
          onClick={async() => {
            await uploadTemplate(file, templateName, rfpVersion)
            setTemplateName('')
            setFile('')
            loadRfpTemplates()
          }}
          disabled={!templateName || !file}
        >
          Upload
        </Button>
      </Grid.Col>
    </Grid>

  </>

}

const mapStateToProps = state => ({
  templates: state.optimization.rfp.templates,
})

const mapDispatchToProps = dispatch => ({
  loadRfpTemplates: () => dispatch(RfpModalActions.loadRfpTemplates()),
})

export const RfpTemplateManager = connect(mapStateToProps, mapDispatchToProps)(_RfpTemplateManager)
