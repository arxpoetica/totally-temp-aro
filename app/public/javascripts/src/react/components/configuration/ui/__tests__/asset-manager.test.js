/* global test expect jest */
import React from 'react'
import { shallow } from 'enzyme'
import { AssetManager } from '../asset-manager'

const assetKeys = ['sample1.png', 'sample2.png']

// -----------------------------------------------------------------------------
test('Default component render and constructor call', () => {
  const mockGetAssetKeys = jest.fn()
  const component = shallow(
    <AssetManager assetKeys={assetKeys}
      getAssetKeys={mockGetAssetKeys} />
  )
  // Initial state - show warning, hide form
  expect(mockGetAssetKeys.mock.calls.length).toBe(1)
  expect(component).toMatchSnapshot()
})
