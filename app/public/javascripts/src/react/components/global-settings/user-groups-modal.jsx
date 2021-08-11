import React, { useState, useEffect } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'
import { logoutApp } from '../../common/view-utils'

export const UserGroupsModal = (props) => {

  const [state, setState] = useState({
    isUserGroupsModalOpen: false,
  })

  const { isUserGroupsModalOpen } = state
  const { userGroupsMsg, isReportMode } = props

  useEffect(() => {
    if (Object.keys(userGroupsMsg).length && !isReportMode) {
      setState((state) => ({ ...state, isUserGroupsModalOpen: true }))
    }
  }, [userGroupsMsg])

  const toggleUserGroupsModal = () => {
    setState((state) => ({ ...state, isUserGroupsModalOpen: !isUserGroupsModalOpen }))
    if (userGroupsMsg.logoutApp) { logoutApp() }
  }

  return (
    <Modal isOpen={isUserGroupsModalOpen} size="md" toggle={toggleUserGroupsModal}>
      <ModalHeader toggle={toggleUserGroupsModal}>{userGroupsMsg.title}</ModalHeader>
      <ModalBody>
        {/* https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml */}
        <div dangerouslySetInnerHTML={{ __html: userGroupsMsg.description }} />
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => toggleUserGroupsModal()}
        >
          Close
        </button>
      </ModalFooter>
    </Modal>
  )
}

const mapStateToProps = (state) => ({
  userGroupsMsg: state.globalSettings.userGroupsMsg,
  isReportMode: state.mapReports.isReportMode,
})

export default wrapComponentWithProvider(reduxStore, UserGroupsModal, mapStateToProps, null)
