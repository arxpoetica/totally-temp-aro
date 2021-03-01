// SEE: https://medium.com/free-code-camp/how-to-detect-an-outside-click-with-react-and-hooks-25dbaa30abcd
import React, { useEffect } from 'react'

export const ClickOutside = ({ children, open, onClick }) => {
  const refs = React.Children.map(children, () => React.createRef())

  const handleClick = event => {
    if (open) {
      const outside = refs.every(ref => {
        const { current } = ref
        return current && !current.contains(event.target)
      })
      if (outside) {
        onClick()
      }
    }
  }

  useEffect(() => {
    document.addEventListener('click', handleClick)
    return function() {
      document.removeEventListener('click', handleClick)
    }
  })

  return React.Children.map(children, (element, idx) =>
    React.cloneElement(element, { ref: refs[idx] })
  )
}
