import React, { useState, useEffect } from 'react'
import AroFeatureFactory from '../../../../../service-typegen/dist/AroFeatureFactory'

export const EquipmentInterfaceValue = (props) => {

  const [state, setState] = useState({
    dateVal: new Date(),
    enumVal: '',
  })

  const { dateVal, enumVal } = state

  const { displayProps, model, isEdit, parentObj, rootMetaData } = props

  useEffect(() => { onload(); getEnumSet() }, [])

  const onload = () => {
    if (displayProps.displayDataType === 'date' || displayProps.displayDataType === 'datetime') {
      if (!model) {
        const newDateVal = new Date()
        setState((state) => ({ ...state, dateVal: newDateVal }))
      } else {
        const newDateVal = new Date(model)
        if (newDateVal.getTime() !== dateVal.getTime()) { // interesting fact: new Date(0)!== new Date(0)
          setState((state) => ({ ...state, dateVal: newDateVal }))
        }
      }
    }
  }

  const getEnumSet = () => {
    if (displayProps.displayDataType === 'enum') {
      const digestEnum = (enumSet) => {

        displayProps.enumSet = enumSet

        let isInSet = false
        for (let i = 0; i < displayProps.enumSet.length; i++) {
          if (displayProps.enumSet[i].id === model) {
            setState((state) => ({ ...state, enumVal: displayProps.enumSet[0].description }))
            isInSet = true
            break
          }
        }
        if (!isInSet && displayProps.enumSet && displayProps.enumSet.length > 0) {
          if (isEdit) {
            setState((state) => ({ ...state, enumVal: displayProps.enumSet[0].description }))
          } else {
            setState((state) => ({ ...state, enumVal: model }))
          }
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
      case 'date':
        return dateVal.toDateString()
      case 'datetime':
        return dateVal.toUTCString()
      case 'enum':
        return enumVal
      case 'html':
        return model
      default:
        return model !== undefined && model.toString()
    }
  }

  return (
    !isEdit && <div className="ei-output-text">{displayValues(displayProps)}</div>
  )
}

export default EquipmentInterfaceValue
