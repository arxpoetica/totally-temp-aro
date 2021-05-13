import React, { useState, useRef, useEffect } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import UiActions from '../configuration/ui/ui-actions'
import GlobalsettingsActions from '../global-settings/globalsettings-action'
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'
import { setBroadcastExpiry, checkBroadcastExpiry, removeLocalStorage } from '../../common/view-utils.js'
import Constants from '../../common/constants.js'
import { dequal } from 'dequal'

export const NotifyBroadcastModal = (props) => {

  const [state, setState] = useState({
    isBroadcastModalOpen: false,
    broadcastChecked: false,
  })

  const { isBroadcastModalOpen, broadcastChecked } = state

  const { notifyBroadcast, loadConfigurationFromServer, broadcastData, validateBroadcast } = props

  useEffect(() => {
    // Enable modal when broadcast is active.
    if (notifyBroadcast && notifyBroadcast.isEnableBroadcastModal
      && checkBroadcastExpiry(Constants.BROADCAST_LOCAL_STORAGE)) {
      setState((state) => ({ ...state, isBroadcastModalOpen: true }))
    }
  }, [notifyBroadcast])

  useEffect(() => {
    // intialize the setInterval and check ui.settings for every 4 hours
    setInterval(() => loadConfigurationFromServer(), Constants.BROADCAST_INTERVAL_TIME)
  }, [])

  // https://reactjs.org/docs/hooks-faq.html#how-to-get-the-previous-props-or-state
  function usePrevious(value) {
    if (value) delete value.loggedInUserID
    const ref = useRef()
    useEffect(() => { ref.current = value })
    return ref.current
  }

  const prevBroadcastData = usePrevious(broadcastData)

  useEffect(() => {
    // compare the prevBroadcastData with broadcastData and validate it.
    if (prevBroadcastData && !dequal(prevBroadcastData, broadcastData)) {
      // if the broadcast data is modified, check the expiry time in localStorage, if it is valid time then remove
      // the localStorage and broadcast the message.
      if (!checkBroadcastExpiry(Constants.BROADCAST_LOCAL_STORAGE)) {
        setState((state) => ({ ...state, broadcastChecked: false }))
        removeLocalStorage(Constants.BROADCAST_LOCAL_STORAGE)
        validateBroadcast(broadcastData)
      } else {
        validateBroadcast(broadcastData)
      }
    } else {
      setState((state) => ({ ...state, broadcastChecked: false }))
      broadcastData && validateBroadcast(broadcastData)
    }
  }, [broadcastData])

  const toggleBroadcastModal = () => {
    setState((state) => ({ ...state, isBroadcastModalOpen: !isBroadcastModalOpen }))
  }

  const toggleMessageShow = () => {
    !broadcastChecked
      ? setBroadcastExpiry(Constants.BROADCAST_LOCAL_STORAGE, false)
      : removeLocalStorage(Constants.BROADCAST_LOCAL_STORAGE)
    setState((state) => ({ ...state, broadcastChecked: !broadcastChecked }))
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
        <label>
          <input type="checkbox" checked={broadcastChecked} onChange={() => toggleMessageShow()} />
          &nbsp;Don&apos;t show this message again
        </label>
        &nbsp;
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
  broadcastData: state.configuration.ui.items.broadcast,
})

const mapDispatchToProps = (dispatch) => ({
  loadConfigurationFromServer: () => dispatch(UiActions.loadConfigurationFromServer()),
  validateBroadcast: (message) => dispatch(GlobalsettingsActions.validateBroadcast(message)),
})

export default wrapComponentWithProvider(reduxStore, NotifyBroadcastModal, mapStateToProps, mapDispatchToProps)
