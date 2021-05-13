import React, { useState, useEffect } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'

export const NotifyBroadcastModal = (props) => {

  const [state, setState] = useState({
    isBroadcastModalOpen: false,
  })

  const { isBroadcastModalOpen } = state

  const { notifyBroadcast } = props

  useEffect(() => {
    // Enable modal when broadcast is active.
    if (notifyBroadcast && notifyBroadcast.isEnableBroadcastModal) {
      setState((state) => ({ ...state, isBroadcastModalOpen: true }))
    }
  }, [notifyBroadcast])

  const toggleBroadcastModal = () => {
    setState((state) => ({ ...state, isBroadcastModalOpen: !isBroadcastModalOpen }))
  }

  return (
    <Modal isOpen={isBroadcastModalOpen} size="md" toggle={toggleBroadcastModal} backdrop={false}>
      <ModalHeader toggle={toggleBroadcastModal}>BROADCAST</ModalHeader>
      <ModalBody>
        <span className="font-weight-bold">
          {notifyBroadcast.subject}:
        </span>
        <div style={{ marginTop: '15px' }}>
          {notifyBroadcast.message}
        </div>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => toggleBroadcastModal()}
        >
          Okay
        </button>
      </ModalFooter>
    </Modal>
  )
}

const mapStateToProps = (state) => ({
  notifyBroadcast: state.globalSettings.notifyBroadcast,
})

export default wrapComponentWithProvider(reduxStore, NotifyBroadcastModal, mapStateToProps, null)
