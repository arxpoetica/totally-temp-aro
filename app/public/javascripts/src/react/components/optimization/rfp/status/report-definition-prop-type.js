import { PropTypes } from 'prop-types'

export default PropTypes.arrayOf(PropTypes.shape({
  reportData: PropTypes.shape({
    id: PropTypes.number,
    reportType: PropTypes.string,
    name: PropTypes.string,
    displayName: PropTypes.string,
    media_types: PropTypes.arrayOf(PropTypes.string)
  }),
  href: PropTypes.string
}))
