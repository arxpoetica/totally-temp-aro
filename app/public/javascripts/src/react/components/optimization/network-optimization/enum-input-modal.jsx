import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { TextArea } from '../../common/forms/TextArea.jsx'
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'
import NetworkOptimizationActions from './network-optimization-actions.js'

export const EnumInputModal = ({startingText, filterIndex, closeModal, setActiveFilters, activeFilters}) => {
  const [text, setText] = useState('')

  useEffect(()=> {
    setText(startingText)
    console.log('ran1')
    return () => {
      setText('')
      console.log('ran')
    }
  },[startingText])

  const saveText = () => {
    activeFilters[filterIndex].value1 = text
    console.log(activeFilters[filterIndex])
    console.log(filterIndex)
    console.log(text)
    setActiveFilters([...activeFilters])
    closeModal(-1)
  }
  return (
    <Modal isOpen={filterIndex > -1} size='lg'>
      <ModalHeader >Modal title</ModalHeader>
      <ModalBody>
        <TextArea value={text} onChange={(event) => setText(event.target.value)}/>
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