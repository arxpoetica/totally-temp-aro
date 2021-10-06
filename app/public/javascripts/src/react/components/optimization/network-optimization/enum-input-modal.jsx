import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { TextArea } from '../../common/forms/TextArea.jsx'
import { FileInput } from '../../common/forms/FileInput.jsx'
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'
import NetworkOptimizationActions from './network-optimization-actions.js'

export const EnumInputModal = ({startingText, filterIndex, isOpen, closeModal, setActiveFilters, activeFilters}) => {
  const [text, setText] = useState('')

  useEffect(()=> {
    setText(startingText)
    return () => {
      setText('')
    }
  },[startingText])

  const saveText = () => {
    // on save, set text in redux and close modal
    activeFilters[filterIndex].value1 = text
    setActiveFilters([...activeFilters])
    closeModal()
  }


  const handleClose = () => {
    // On cancel reset text, don't save
    setText('')
    closeModal()
  }

  const fileUpload = (event) => {
    // create file reader
    const reader = new FileReader()
    //read the csv as text
    reader.readAsText(event.target.files[0])
    //TODO: Parse CSV file to maintain format
    //set text as value of CSV
    reader.onload = () => {
      setText(reader.result)
    };
  }

  return (
    <Modal isOpen={isOpen} size='lg'>
      <ModalHeader >Add {activeFilters[filterIndex] && activeFilters[filterIndex].displayName } Data</ModalHeader>
      <ModalBody>
        <h3>Copy &#38; Paste <span className='enum-input-subtitle'>(separate by comma's ie 02066,02067,02068)</span></h3>
        <TextArea value={text} onChange={(event) => setText(event.target.value)}/>
        <h3>Or Upload a File:</h3>
        <FileInput accept='.csv' onChange={(event) => fileUpload(event)}/>
      </ModalBody>
      <ModalFooter>
        <Button color="primary" onClick={() => saveText()}>Save</Button>
        <Button color="secondary" onClick={() => handleClose()}>Cancel</Button>
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