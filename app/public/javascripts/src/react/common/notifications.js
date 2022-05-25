import { showNotification } from '@mantine/notifications'

export function handleError(error, props = {}) {

  console.error(error)

  const text = error.data && error.data.text
  const code = error.data && error.data.code

  let message
  if (text && code) {
    message = `Error from service: "${text}" (with code "${code}") - please contact support to resolve.`
  } else if (text) {
    message = `Error from service: "${text}" - please contact support to resolve.`
  } else if (error.message) {
    message = `Error from service with message: "${error.message}" - please contact support to resolve.`
  } else {
    message = 'Unknown error from service. Please contact support to resolve.'
  }

  showNotification({
    title: `${error.status} Error`,
    message,
    color: 'red',
    autoClose: false,
    ...props,
  })

}