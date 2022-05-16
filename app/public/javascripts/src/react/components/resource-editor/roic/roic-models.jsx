import React from "react";

function ROICModels(props) {
  const {
    roicManagerConfiguration,
    selectRoicModel,
    selectedRoicModelIndex,
    showSpeedCategoryHelp,
    handleModelsChange,
    hideSpeedCategoryHelp,
    speedCategoryHelp
  } = props

  return (
    <div className="row">
      {/* On the left, show a list of ROIC models that the user can edit */}
      <div className="col-md-4">
        <ul className="nav nav-pills flex-column" style={{ maxHeight: '380px', overflowY: 'auto' }}>
        {roicManagerConfiguration.inputs.map((roicModel, roicKey) =>
          <li role="presentation" className="nav-item" key={roicKey}
            onClick={(event) => selectRoicModel(roicKey)}
          >
            {/* Show the entity type and speed category */}
            <div
              className={`nav-link pill-parent
              ${selectedRoicModelIndex === roicKey ? 'active' : 'true'}`}
              style={{ cursor: 'pointer' }}
            >
              {roicModel.id.entityType} / {roicModel.id.speedCategory}
              <span
                className="badge badge-light float-right"
                onClick={(event) => showSpeedCategoryHelp(roicModel.id.speedCategory)}
                style={{ marginTop: '2px', cursor: 'pointer' }}
              >
                <i className="fa fa-question"></i>
              </span>
            </div>
          </li>
        )}
        </ul>
      </div>

      {/* On the right, show the details of the currently selected ROIC model */}
      <div className="col-md-8">
        {/* We will create a flexbox that will show the speed category help only if it is displayed */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ flex: '1 1 auto', overflowY: 'auto' }}>
            <table id="tblRoicModel" className="table table-sm table-striped">
              <tbody>
                {Object.entries(roicManagerConfiguration.inputs[selectedRoicModelIndex])
                  .map(([itemKey, itemValue], itemIndex) => {
                    if (itemKey !== 'id' && itemKey !== 'penetrationEnd' && itemKey !== 'churnRateDecrease') {
                      return (
                        <tr key={itemIndex}>
                          <td>{itemKey}</td>
                          <td>
                            <input
                              className="form-control"
                              name={itemKey}
                              value={roicManagerConfiguration.inputs[selectedRoicModelIndex][itemKey]}
                              onChange={e => {handleModelsChange(e, selectedRoicModelIndex)}}
                            />
                          </td>
                        </tr>
                      )
                    }
                  }
                )}
              </tbody>
            </table>
          </div>
          <div style={{ flex: '0 0 auto', paddingTop: '10px' }}>
            {speedCategoryHelp &&
              <div className="alert alert-info alert-dismissible fade show" role="alert">
                {speedCategoryHelp}
                <button
                  type="button"
                  className="close"
                  aria-label="Close"
                  onClick={() => hideSpeedCategoryHelp()}
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
export default ROICModels;