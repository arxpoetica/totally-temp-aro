import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import PanelComponent from './components/panel-component.jsx';
import AroHttp from '../../../common/aro-http'

const NearNet = ({ PCM, pcmDefinitionNearNet }) => {
  const [showNearNet, setShowNearNet] = useState(false)
  useEffect(() => {
    // If a pcmDefinition is not already in the store grab it and check the
    // generateNearNetAnalysis flag
    if (!pcmDefinitionNearNet && PCM && PCM.selectedManager) {
      AroHttp.get(`service/v2/resource-manager/${PCM.selectedManager.id}/planning_constraints_manager`)
        .then((response) => {
          if (response.data && 'generateNearNetAnalysis' in response.data) {
            setShowNearNet(response.data.generateNearNetAnalysis)
          }
        })
    // If a pcmDefinition is in the store and it has changed
    // Ensure this check is up to date with that
    } else if (pcmDefinitionNearNet) {
      setShowNearNet(pcmDefinitionNearNet)
    }
  }, [PCM, pcmDefinitionNearNet])

  return (
    <>
      {showNearNet &&
        <PanelComponent
          panelKey='near_net'
          panelLabel='Near Net'
        />
      }
    </>
  )
}

const mapStateToProps = (state) => {
  const PCM = state.plan.resourceItems.planning_constraints_manager
  const definition = state.resourceManager.managers[PCM && PCM.id] && state.resourceManager.managers[PCM.id].definition
  return {
    PCM,
    pcmDefinitionNearNet: !!definition && definition.generateNearNetAnalysis
  }
}

const mapDispatchToProps = () => ({})

const NearNetComponent = connect(mapStateToProps, mapDispatchToProps)(NearNet)
export default NearNetComponent