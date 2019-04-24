/* global test expect jest */
import React from 'react'
import { shallow } from 'enzyme'
import { ReportModuleEditor } from '../report-module-editor'

const sampleReport = {
  id: 1,
  reportType: 'GENERAL',
  moduleDefinition: {
    definition: {
      name: 'plan_report',
      displayName: 'plan_report',
      queryType: 'KML_REPORT',
      // eslint-disable-next-line
      query: '<kml\n    xmlns="http://www.opengis.net/kml/2.2"\n    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n    <Document>\n        <name>plan-${planId}.kml</name>\n        <visibility>0</visibility>\n        <Style id="style_construction_estimated">\n            <LineStyle>\n                <color>ff0000ff</color>\n                <width>4</width>\n            </LineStyle>\n        </Style>\n        <Style id="fiber_ariel_estimated">\n            <LineStyle>\n                <color>50000000</color>\n                <width>4</width>\n            </LineStyle>\n        </Style>\n        <Style id="fiber_buried_estimated">\n            <LineStyle>\n                <color>50000000</color>\n                <width>4</width>\n            </LineStyle>\n        </Style>\n        <Style id="fiber_underground_estimated">\n            <LineStyle>\n                <color>50000000</color>\n                <width>4</width>\n            </LineStyle>\n        </Style>\n        <Style id="fiber_obstacle_estimated">\n            <LineStyle>\n                <color>50000000</color>\n                <width>4</width>\n            </LineStyle>\n        </Style>\n        <Style id="fiber_conduit_estimated">\n            <LineStyle>\n                <color>501400FA</color>\n                <width>4</width>\n            </LineStyle>\n        </Style>\n        <Style id="fiber_planned_conduit_estimated">\n            <LineStyle>\n                <color>501400FA</color>\n                <width>4</width>\n            </LineStyle>\n        </Style>\n        <Style id="fiber_undersea_estimated">\n            <LineStyle>\n                <color>ffb40014</color>\n                <width>4</width>\n            </LineStyle>\n        </Style>\n\n        <Style id="equip_central_office">\n            <IconStyle>\n                <color>ffffff00</color>\n                <scale>1</scale>\n                <Icon>\n                    <href>http://maps.google.com/mapfiles/kml/pushpin/red-pushpin.png</href>\n                </Icon>\n            </IconStyle>\n        </Style>\n        <Style id="equip_splice_point">\n            <IconStyle>\n                <color>ffffff00</color>\n                <scale>1</scale>\n                <Icon>\n                    <href>http://maps.google.com/mapfiles/kml/pushpin/blue-pushpin.png</href>\n                </Icon>\n            </IconStyle>\n        </Style>\n        <Style id="equip_fiber_distribution_hub">\n            <IconStyle>\n                <color>ffffff00</color>\n                <scale>1</scale>\n                <Icon>\n                    <href>http://maps.google.com/mapfiles/kml/pushpin/itblu-pushpin.png</href>\n                </Icon>\n            </IconStyle>\n        </Style>\n        <Style id="equip_fiber_distribution_terminal">\n            <IconStyle>\n                <color>ffffff00</color>\n                <scale>1</scale>\n                <Icon>\n                    <href>http://maps.google.com/mapfiles/kml/pushpin/pink-pushpin.png</href>\n                </Icon>\n            </IconStyle>\n        </Style>\n        <Style id="equip_bulk_distribution_terminal">\n            <IconStyle>\n                <color>ffffff00</color>\n                <scale>1</scale>\n                <Icon>\n                    <href>http://maps.google.com/mapfiles/kml/pushpin/purple-pushpin.png</href>\n                </Icon>\n            </IconStyle>\n        </Style>\n        <Style id="equip_cell_5g">\n            <IconStyle>\n                <color>ffffff00</color>\n                <scale>1</scale>\n                <Icon>\n                    <href>http://maps.google.com/mapfiles/kml/pushpin/red-pushpin.png</href>\n                </Icon>\n            </IconStyle>\n        </Style>\n        <Style id="equip_junction_splitter">\n            <IconStyle>\n                <color>ffffff00</color>\n                <scale>1</scale>\n                <Icon>\n                    <href>http://maps.google.com/mapfiles/kml/pushpin/wht-pushpin.png</href>\n                </Icon>\n            </IconStyle>\n        </Style>\n        <Style id="equip_dslam">\n            <IconStyle>\n                <color>ffffff00</color>\n                <scale>1</scale>\n                <Icon>\n                    <href>http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png</href>\n                </Icon>\n            </IconStyle>\n        </Style>\n        <Style id="equip_loop_extender">\n            <IconStyle>\n                <color>ffffff00</color>\n                <scale>1</scale>\n                <Icon>\n                    <href>http://maps.google.com/mapfiles/kml/pushpin/pink-pushpin.png</href>\n                </Icon>\n            </IconStyle>\n        </Style>\n        <Style id="equip_network_anchor">\n            <IconStyle>\n                <color>ffffff00</color>\n                <scale>1</scale>\n                <Icon>\n                    <href>http://maps.google.com/mapfiles/kml/pushpin/wht-pushpin.png</href>\n                </Icon>\n            </IconStyle>\n        </Style>\n        <Folder>\n            <name>Fiber</name>\n            <visibility>0</visibility>\n            <Folder>\n                <name>Planned Fiber</name>\n                <visibility>0</visibility>\n                <#list planned_fibers as fiber>\n                    <Placemark>\n                        <name>${fiber.type_name}</name>\n                        <visibility>0</visibility>\n                        <styleUrl>#fiber_${fiber.type_code}</styleUrl>\n                        ${fiber.kml_element}\n                    </Placemark>\n                </#list>\n            </Folder>\n         </Folder>   \n        <Folder>\n            <name>Equipment</name>\n            <visibility>0</visibility>\n            <Folder>\n                <#list planned_equipment as equipment>\n                    <Placemark>\n                        <name>${equipment.object_id}</name>\n                        <visibility>0</visibility>\n                        <styleUrl>#equip_${equipment.equipment_type}</styleUrl>\n                        ${equipment.kml_element}\n                    </Placemark>\n                </#list>\n           </Folder>\n        </Folder>\n    </Document>\n\n</kml>'
    },
    subDefinitions: [
      {
        name: 'planned_fibers',
        displayName: 'Planned Fiber Elements',
        queryType: 'SQL_REPORT',
        // eslint-disable-next-line
        query: 'SELECT\n    c.construction_type,\n    ct.name as type_code,\n    ct.description as type_name,\n    s.length_meters AS length_meters,\n    ST_AsKml(ST_Line_Substring(ST_LineMerge(s.geom),\n        LEAST(ST_LineLocatePoint(ST_LineMerge(s.geom),c.point1),\nST_LineLocatePoint(ST_LineMerge(s.geom),c.point2)),\n        GREATEST(ST_LineLocatePoint(ST_LineMerge(s.geom),c.point1),\nST_LineLocatePoint(ST_LineMerge(s.geom),c.point2))\n    )) AS kml_element\nFROM client.versioned_plan_subnet vpn\nJOIN client.subnet_link s\n    ON vpn.id = s.plan_subnet_id\n    AND s.length_meters > 0\nJOIN client.plan_conduit c \n    ON s.id = c.subnet_link_id\nJOIN client.cable_construction_type ct \n    ON c.construction_type = ct.id\nWHERE root_plan_id = ${planId}\nAND NOT(is_deleted)'
      },
      {
        name: 'planned_equipment',
        displayName: 'Planned Equipment Elements',
        queryType: 'SQL_REPORT',
        // eslint-disable-next-line
        query: 'SELECT \n\te.object_id,\n\tST_AsKml(geom) as kml_element,\n\tnt.name AS equipment_type,\n\te.deployment_type\nFROM  client.network_equipment e\nJOIN client.network_node_types nt\n\tON nt.id = e.node_type_id\nWHERE root_plan_id = ${planId}\nAND node_type_id != 8\nAND e.is_branch_data\nAND NOT(e.is_deleted)\n'
      }
    ]
  }
}
const reportTypes = [
  { id: 1, name: 'GENERAL', description: 'General' },
  { id: 2, name: 'COVERAGE', description: 'Coverage' },
  { id: 3, name: 'FORM477', description: 'Form477' },
  { id: 4, name: 'PARAM_QUERY', description: 'Param Query' }
]
const dummyFormValues = { name: 'Dummy Name', displayName: 'Dummy display name', queryType: 'SQL_REPORT', query: 'Dummy query' }
const successValidation = { validated: true, sampleReport: '<kml></kml>', errorMessage: '' }
const errorValidation = { validated: false, sampleReport: '', errorMessage: 'Syntax error at SELECTA' }
const PLAN_ID = 1

// -----------------------------------------------------------------------------
test('With only report id', () => {
  const mockPopulateEditingReportDefinition = jest.fn()
  const mockPopulateReportTypes = jest.fn()
  const component = shallow(
    <ReportModuleEditor planId={PLAN_ID}
      reportBeingEdited={{ id: sampleReport.id }}
      reportTypes={reportTypes}
      populateEditingReportDefinition={mockPopulateEditingReportDefinition}
      populateReportTypes={mockPopulateReportTypes} />
  )
  expect(mockPopulateEditingReportDefinition.mock.calls.length).toBe(1)
  expect(mockPopulateEditingReportDefinition.mock.calls[0][0]).toBe(sampleReport.id)
  expect(mockPopulateReportTypes.mock.calls.length).toBe(1)
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('With populated report', () => {
  const component = shallow(
    <ReportModuleEditor planId={PLAN_ID}
      reportBeingEdited={sampleReport}
      reportTypes={reportTypes}
      populateEditingReportDefinition={() => {}}
      populateReportTypes={() => {}} />
  )
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('Click primary and subdefinitions to edit', () => {
  const component = shallow(
    <ReportModuleEditor planId={PLAN_ID}
      reportBeingEdited={sampleReport}
      reportTypes={reportTypes}
      populateEditingReportDefinition={() => {}}
      populateReportTypes={() => {}} />
  )
  expect(component).toMatchSnapshot()

  // Click sub definitions
  component.find('#lnkEditSubDefinition0').simulate('click')
  expect(component).toMatchSnapshot()
  component.find('#lnkEditSubDefinition1').simulate('click')
  expect(component).toMatchSnapshot()

  // Click primary definition
  component.find('#lnkEditPrimaryDefinition').simulate('click')
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('With validation success message', () => {
  const component = shallow(
    <ReportModuleEditor planId={PLAN_ID}
      reportBeingEdited={sampleReport}
      reportTypes={reportTypes}
      reportValidation={successValidation}
      populateEditingReportDefinition={() => {}}
      populateReportTypes={() => {}} />
  )
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('With validation error message', () => {
  const component = shallow(
    <ReportModuleEditor planId={PLAN_ID}
      reportBeingEdited={sampleReport}
      reportTypes={reportTypes}
      reportValidation={errorValidation}
      populateEditingReportDefinition={() => {}}
      populateReportTypes={() => {}} />
  )
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('Call when component unmounts', () => {
  const mockClearEditingReportDefinition = jest.fn()
  const mockClearReportTypes = jest.fn()
  const component = shallow(
    <ReportModuleEditor reportBeingEdited={{ id: sampleReport.id }}
      reportTypes={reportTypes}
      clearEditingReportDefinition={mockClearEditingReportDefinition}
      clearReportTypes={mockClearReportTypes}
      populateEditingReportDefinition={() => {}}
      populateReportTypes={() => {}} />
  )
  component.unmount()
  expect(mockClearEditingReportDefinition.mock.calls.length).toBe(1)
  expect(mockClearReportTypes.mock.calls.length).toBe(1)
})

// -----------------------------------------------------------------------------
test('Call to save primary definition', () => {
  const mockSaveEditingReportPrimaryDefinition = jest.fn()
  const mockValidateReport = jest.fn()
  const component = shallow(
    <ReportModuleEditor reportBeingEdited={sampleReport}
      planId={PLAN_ID}
      reportTypes={reportTypes}
      reportDefinitionEditorValues={dummyFormValues}
      saveEditingReportPrimaryDefinition={mockSaveEditingReportPrimaryDefinition}
      validateReport={mockValidateReport}
      populateEditingReportDefinition={() => {}}
      populateReportTypes={() => {}} />
  )
  // Click 'save definition'
  component.find('#btnSaveCurrentDefinition').simulate('click')
  expect(mockSaveEditingReportPrimaryDefinition.mock.calls.length).toBe(1)
  expect(mockSaveEditingReportPrimaryDefinition.mock.calls[0][0]).toBe(dummyFormValues)
  expect(mockValidateReport.mock.calls.length).toBe(1)
  expect(mockValidateReport.mock.calls[0][0]).toBe(PLAN_ID)
})

// -----------------------------------------------------------------------------
test('Call to save sub definition', () => {
  const mockSaveEditingReportSubDefinition = jest.fn()
  const mockValidateReport = jest.fn()
  const component = shallow(
    <ReportModuleEditor reportBeingEdited={sampleReport}
      planId={PLAN_ID}
      reportTypes={reportTypes}
      reportDefinitionEditorValues={dummyFormValues}
      saveEditingReportPrimaryDefinition={() => {}}
      saveEditingReportSubDefinition={mockSaveEditingReportSubDefinition}
      validateReport={mockValidateReport}
      populateEditingReportDefinition={() => {}}
      populateReportTypes={() => {}} />
  )
  // Click 'save definition'
  component.find('#lnkEditSubDefinition0').simulate('click')
  component.find('#btnSaveCurrentDefinition').simulate('click')
  expect(mockSaveEditingReportSubDefinition.mock.calls.length).toBe(1)
  expect(mockSaveEditingReportSubDefinition.mock.calls[0][0]).toBe(dummyFormValues)
  expect(mockSaveEditingReportSubDefinition.mock.calls[0][1]).toBe(0)
  expect(mockValidateReport.mock.calls.length).toBe(1)
  expect(mockValidateReport.mock.calls[0][0]).toBe(PLAN_ID)
})

// -----------------------------------------------------------------------------
test('Call to save report to server', () => {
  const mockSaveCurrentReportToServer = jest.fn()
  const mockValidateReport = jest.fn()
  const component = shallow(
    <ReportModuleEditor reportBeingEdited={sampleReport}
      planId={PLAN_ID}
      reportTypes={reportTypes}
      reportDefinitionEditorValues={dummyFormValues}
      saveEditingReportPrimaryDefinition={() => {}}
      saveCurrentReportToServer={mockSaveCurrentReportToServer}
      validateReport={mockValidateReport}
      populateEditingReportDefinition={() => {}}
      populateReportTypes={() => {}} />
  )
  // Click 'save definition'
  component.find('#btnSaveReportToServer').simulate('click')
  expect(mockSaveCurrentReportToServer.mock.calls.length).toBe(1)
})
