import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { TextArea } from '../../common/forms/TextArea.jsx'
import { FileInput } from '../../common/forms/FileInput.jsx'
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'
import NetworkOptimizationActions from './network-optimization-actions.js'

export const EnumInputModal = ({startingText, filterIndex, closeModal, setActiveFilters, activeFilters}) => {
  const [text, setText] = useState('')

  useEffect(()=> {
    setText(startingText)
    return () => {
      setText('')
    }
  },[startingText])

  const saveText = () => {
    activeFilters[filterIndex].value1 = text
    setActiveFilters([...activeFilters])
    closeModal(-1)
  }

  const fileUpload = (event) => {
    const reader = new FileReader()

    reader.readAsText(event.target.files[0])

    reader.onload = () => {
      setText(reader.result)
    };
  }
  return (
    <Modal isOpen={filterIndex > -1} size='lg'>
      <ModalHeader >Modal title</ModalHeader>
      <ModalBody>
        <TextArea value={text} onChange={(event) => setText(event.target.value)}/>
        <FileInput accept='.csv' onChange={(event) => fileUpload(event)}/>
      </ModalBody>
      <ModalFooter>
        <Button color="primary" onClick={() => saveText()}>Save</Button>{' '}
        <Button color="secondary" onClick={() => closeModal(-1)}>Cancel</Button>
      </ModalFooter>
    </Modal>
  )
}

const mapStateToProps = (state) => ({
  activeFilters: state.optimization.networkOptimization.activeFilters,
})

const mapDispatchToProps = dispatch => ({
  setActiveFilters: (filters) => dispatch(NetworkOptimizationActions.setActiveFilters(filters)),
})

export default connect(mapStateToProps, mapDispatchToProps)(EnumInputModal)