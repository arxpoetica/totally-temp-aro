/* global test expect jest */
import React from 'react'
import { shallow, mount } from 'enzyme'
import { NetworkAnalysisOutput } from '../network-analysis-output'

const reportMetaData = { id: 10 }
const reportDefinition = {
  uiDefinition: [
    {
      chartDefinition: {
        name: 'irr',
        displayName: 'IRR',
        type: 'scatter',
        data: {
          datasets: [
            {
              label: 'IRR',
              backgroundColor: 'rgb(121, 127, 121)',
              data: [],
              fill: false,
              propertyName: 'irr'
            }
          ]
        },
        options: {
          legend: {
            display: false
          },
          elements: {
            line: {
              fill: false,
              tension: 0
            }
          },
          showLines: true,
          responsive: true,
          title: {
            display: false
          },
          scales: {
            xAxes: [
              {
                display: true,
                labelString: 'CAPEX',
                ticks: {}
              }
            ],
            yAxes: [
              {
                display: true,
                ticks: {
                  beginAtZero: false
                }
              }
            ]
          },
          tooltips: {
            callbacks: {}
          }
        }
      },
      dataModifiers: {
        sortBy: 'index',
        sortOrder: 'ascending',
        labelProperty: 'capex',
        irr: {
          tickFormat: {
            prefix: '',
            suffix: '%',
            multiplier: 100.0
          }
        },
        capex: {
          tickFormat: {
            suffix: '$'
          }
        }
      }
    }
  ]
}
const report = [
  { coverage: 193.0, capex: 25373.196882982724, npv: 299981.76532897586, irr: 0.6926999999999963, index: 1 },
  { coverage: 215.0, capex: 28469.416882982725, npv: 333972.6394671266, irr: 0.6891999999999996, index: 2 },
  { coverage: 11262.0, capex: 1573704.1506588343, npv: 1.2906500787648655E7, irr: 0.5504000000000019, index: 5 },
  { coverage: 13812.0, capex: 1950232.128700931, npv: 1.5683535295389896E7, irr: 0.5437000000000013, index: 6 },
  { coverage: 1647.0, capex: 221904.55623732723, npv: 2102823.3532786667, irr: 0.6023000000000015, index: 3 },
  { coverage: 3580.0, capex: 482498.3552715056, npv: 4402880.713705363, irr: 0.5882000000000004, index: 4 },
  { coverage: 15168.0, capex: 2158455.9218533617, npv: 1.7140295621583264E7, irr: 0.5395000000000001, index: 7 },
  { coverage: 15294.0, capex: 2178230.5915344288, npv: 1.727392685564108E7, irr: 0.5390000000000001, index: 8 }
]

// -----------------------------------------------------------------------------
test('When report and report definition are empty', () => {
  const mockLoadReport = jest.fn()
  const component = shallow(
    <NetworkAnalysisOutput planId={100}
      loadReport={mockLoadReport}
    />
  )
  expect(mockLoadReport).toHaveBeenCalledWith(100)
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('When report is empty', () => {
  const component = shallow(
    <NetworkAnalysisOutput planId={100}
      loadReport={() => {}}
      reportDefinition={reportDefinition}
      reportMetaData={reportMetaData}
    />
  )
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('When report definition is empty', () => {
  const component = shallow(
    <NetworkAnalysisOutput planId={100}
      loadReport={() => {}}
      report={report}
      reportMetaData={reportMetaData}
    />
  )
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('When report and report definition are given', () => {
  const component = mount(
    <NetworkAnalysisOutput planId={100}
      isTesting
      loadReport={() => {}}
      report={report}
      reportDefinition={reportDefinition}
      reportMetaData={reportMetaData}
    />
  )
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('When component is unmounted', () => {
  const mockLoadReport = jest.fn()
  const mockClearOutput = jest.fn()
  const component = shallow(
    <NetworkAnalysisOutput planId={100}
      loadReport={mockLoadReport}
      clearOutput={mockClearOutput}
    />
  )
  expect(mockLoadReport).toHaveBeenCalledWith(100)
  component.unmount()
  expect(mockClearOutput).toHaveBeenCalled()
})
