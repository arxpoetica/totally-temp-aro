export const getPlanCreatorName = (createdBy, systemActors) => {
  const creator = systemActors[createdBy]
  return creator && ((creator.type === 'group') ? creator.name : `${creator.firstName} ${creator.lastName}`)
}

export const getTagCategories = (currentPlanTags, listOfTags) => {
  return listOfTags.filter(tag => currentPlanTags.includes(tag.id))
}

export const getSATagCategories = (currentPlanTags, listOfServiceAreaTags) => {
  return listOfServiceAreaTags.filter(tag => currentPlanTags.includes(tag.id))
}
