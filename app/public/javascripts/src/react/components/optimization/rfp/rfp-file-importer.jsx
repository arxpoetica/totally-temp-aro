import React from 'react'
import { connect } from 'react-redux'
import RfpActions from './rfp-actions'
import RfpPointImporterUtils from './rfp-file-importer-utils'
import { Notifier } from '../../../common/notifications'

const connector = connect(
  state => ({}),
  dispatch => ({
    addTargets: targets => dispatch(RfpActions.addTargets(targets))
  }),
)

export const RfpFileImporter = connector(({ addTargets, displayOnly }) => {

  async function loadPointsFromFile(event) {
    try {
      const file = event.target.files[0]
      const targets = await RfpPointImporterUtils.loadPointsFromFile(file)
      addTargets(targets)
    } catch (error) {
      Notifier.error(error)
    }
  }

  return <>
    <span style={{ display: 'inline-block' }}>
      <label
        htmlFor="inpRfpFileImport"
        disabled={displayOnly}
        className="rfp-file-import-label btn btn-sm btn-light"
      >
        <i className="fas fa-file-import"/> Import csv...
      </label>
      <input
        id="inpRfpFileImport"
        className="rfp-file-import-input"
        type="file"
        disabled={displayOnly}
        onChange={event => loadPointsFromFile(event)}
      />
    </span>
    <style jsx>{`
      .rfp-file-import-input {
        display: none;
      }
      .rfp-file-import-label {
        display: inline-block;
        cursor: pointer;
        margin: 0px;
      }
    `}</style>
  </>
})
