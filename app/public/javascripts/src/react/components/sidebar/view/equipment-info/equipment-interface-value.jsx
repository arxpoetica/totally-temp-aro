import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import AroFeatureFactory from '../../../../../service-typegen/dist/AroFeatureFactory'

export const EquipmentInterfaceValue = (props) => {

  const [state, setState] = useState({
    dateVal: new Date(),
    modelState: '',
    enumVal: '',
  })

  const { dateVal, enumVal } = state

  const { displayProps, model, isEdit, parentObj, rootMetaData } = props

  useEffect(() => {
    onload()
    getEnumSet()
  }, [])

  const onload = () => {
    if (displayProps.displayDataType == 'date' || displayProps.displayDataType == 'datetime') {
      if (typeof model === 'undefined' || isNaN(model) || model == 0) {
        const newDateVal = new Date()
        setState((state) => ({ ...state, dateVal: newDateVal }))
      } else {
        var newDateVal = new Date(model)
        if (newDateVal.getTime() != dateVal.getTime()) { // interesting fact: new Date(0) != new Date(0)
          setState((state) => ({ ...state, dateVal: newDateVal }))
        }
      }
    }
  }

  const getEnumSet = () => {
    if (displayProps.displayDataType == 'enum') {
      
      var digestEnum = (enumSet) => {
        var oldEnumText = JSON.stringify(displayProps.enumSet)
        var isEnumSame = (JSON.stringify(enumSet) == oldEnumText)

        displayProps.enumSet = enumSet
        
        var isInSet = false
        for (let i = 0; i < displayProps.enumSet.length; i++) {
          if (displayProps.enumSet[i].id == model) {
            setState((state) => ({ ...state, enumVal: displayProps.enumSet[0].description }))
            isInSet = true
            break
          }
        }
        if (!isInSet && displayProps.enumSet && displayProps.enumSet.length > 0) {
          if (isEdit) {
            setState((state) => ({ ...state, enumVal: displayProps.enumSet[0].description }))
            model = displayProps.enumSet[0].id
          } else {
            setState((state) => ({ ...state, enumVal: model }))
          }
        } else if (!isEnumSame) {
        }
      }
      
      if (displayProps.enumTypeURL) {
        AroFeatureFactory.getEnumSet(rootMetaData, parentObj, '/service/type-enum/' + displayProps.enumTypeURL)
          .then(digestEnum, (errorText) => {
            console.log(errorText)
            displayProps.enumSet = []
          })
      } else {
        digestEnum(displayProps.enumSet)
      }
        
    }
  }

  const displayValues = (displayProps) => {
    switch (displayProps.displayDataType) {
      case "date":
        return <div className="ei-output-text">{dateVal.toDateString()}</div>
      case "datetime":
        return <div className="ei-output-text">{dateVal.toUTCString()}</div>
      case "enum":
        return <div className="ei-output-text">{enumVal}</div>
      case "html":
        return <div className="ei-output-text">{model}</div>
      default:
        return <div className="ei-output-text">{model}</div>
    }
  }

  return (
    !isEdit && <div>{displayValues(displayProps)}</div>
  )
}
  
  const mapStateToProps = (state) => ({
  })
  
  const mapDispatchToProps = (dispatch) => ({
  })
  
  export default connect(mapStateToProps, mapDispatchToProps)(EquipmentInterfaceValue)