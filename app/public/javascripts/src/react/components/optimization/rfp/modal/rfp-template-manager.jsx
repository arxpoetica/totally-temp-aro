/* globals FileReader */
import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { Grid, TextInput, Select, FileInput, Button, Table } from '@mantine/core'
import { IconTrash, IconUpload } from '@tabler/icons'
import RfpStatusActions from '../status/actions'

const _RfpTemplateManager = props => {

  const {
    loadRfpTemplates,
    templates,
    addRfpTemplate,
    deleteRfpTemplate,
  } = props

  useEffect(() => { loadRfpTemplates() }, [])

  const [templateName, setTemplateName] = useState('New Template')
  const [file, setFile] = useState()

  function uploadTemplate() {
    const reader = new FileReader()
    reader.onload = event => {
      const template = event.target.result
      addRfpTemplate(templateName, template)
    }
    reader.readAsText(file)
  }

  return <>
    <h4>Existing templates</h4>
    <Table striped highlightOnHover withBorder withColumnBorders>
      <thead>
        <tr>
          <th>Name</th>
          <th>Value</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {templates.map(template => (
          <tr key={template.id}>
            <td>{template.name}</td>
            <td>
              <pre>
                {JSON.stringify(template.value, null, 2)}
              </pre>
            </td>
            <td>
              <Button
                leftIcon={<IconTrash size={20} stroke={2}/>}
                onClick={() => deleteRfpTemplate(template.id)}
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
    <Grid>
      <Grid.Col lg={4} md={12}>Template name</Grid.Col>
      <Grid.Col lg={8} md={12}>
        <TextInput
          value={templateName}
          onChange={event => setTemplateName(event.currentTarget.value)}
        />
      </Grid.Col>

      <Grid.Col lg={4} md={12}>RFP Type</Grid.Col>
      <Grid.Col lg={8} md={12}>
        <Select
          label=""
          value={'ad-hoc'}
          data={[
            { value: 'ad-hoc', label: 'Ad Hoc' },
            { value: 'service-area', label: 'Service Area' },
          ]}
          onChange={value => console.log(value)}
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
          onClick={uploadTemplate}
        >
          Upload
        </Button>
      </Grid.Col>
    </Grid>

  </>

}

const mapStateToProps = state => ({
  templates: state.optimization.rfp.templates
})

const mapDispatchToProps = dispatch => ({
  addRfpTemplate: (name, template) => dispatch(RfpStatusActions.addRfpTemplate(name, template)),
  deleteRfpTemplate: templateId => dispatch(RfpStatusActions.deleteRfpTemplate(templateId)),
  loadRfpTemplates: () => dispatch(RfpStatusActions.loadRfpTemplates())
})

export const RfpTemplateManager = connect(mapStateToProps, mapDispatchToProps)(_RfpTemplateManager)
