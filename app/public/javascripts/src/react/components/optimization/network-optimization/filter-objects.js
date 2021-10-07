export const boolOptions = [
  { value: 'True', label: 'Yes' },
  { value: 'False', label: 'No' },
]

export const numberOptions = [
  { value: 'EQ', label: 'Equal' },
  { value: 'NEQ', label: 'Not Equal' },
  { value: 'GT', label: 'Greater Than' },
  { value: 'GTE', label: 'Greater Than or Equal' },
  { value: 'LT', label: 'Less Than' },
  { value: 'LTE', label: 'Less Than or Equal' },
  { value: 'RANGE', label: 'Between' },
]

export const dateOptions = [
  { value: 'EQ', label: 'Equal' },
  { value: 'NEQ', label: 'Not Equal' },
  { value: 'GT', label: 'After' },
  { value: 'GTE', label: 'After or On' },
  { value: 'LT', label: 'Before' },
  { value: 'LTE', label: 'Before or On' },
  { value: 'RANGE', label: 'Between' },
]

export const enumOptions = [
  { value: 'IN', label: 'In' },
  { value: 'NIN', label: 'Not In' },
]

export const stringOptions = [
  { value: 'EQ', label: 'Equal' },
  { value: 'NEQ', label: 'Not Equal' },
]

export const newFilter = {
  displayName: null,
  enumType: 'NONE',
  format: null,
  maxvalue: '',
  minValue: '',
  name: null,
  propertyType: null,
  value: '',
  label: '',
  operator: '',
  value1: '',
  value2: '',
}
