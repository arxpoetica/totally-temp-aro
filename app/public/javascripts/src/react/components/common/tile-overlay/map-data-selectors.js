import { createSelector } from 'reselect'

const getLocationGroups = state => state.planEditor.draftLocations.groups

const getUnselectedLocationGroups = createSelector(
  [getLocationGroups], 
  (locationGroups) => {
    let unselectedLocationGroups = {}
    for (const [id, location] of Object.entries(locationGroups)) {
      if ('selected' in location && !location.selected) {
        unselectedLocationGroups[id] = true
      }
    }
    return unselectedLocationGroups
  }
)

const MapDataSelectors = Object.freeze({
  getUnselectedLocationGroups,
})

export default MapDataSelectors
