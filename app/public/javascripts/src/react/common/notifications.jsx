import React from 'react'
import { showNotification, updateNotification, hideNotification } from '@mantine/notifications'
import { IconCheck } from '@tabler/icons'

export class Notifier {

  static error(error, props = {}) {

    let message = 'Unknown error from service. Please contact support to resolve.'

    if (typeof error === 'string') {
      message = error
      console.error(message)
    } else if (error) {
      console.error(error)
      const text = error.data && error.data.text
      const code = error.data && error.data.code
      if (text && code) {
        message = `Error from service: "${text}" (with code "${code}") - please contact support to resolve.`
      } else if (text) {
        message = `Error from service: "${text}" - please contact support to resolve.`
      } else if (error.message) {
        message = `Error from service with message: "${error.message}" - please contact support to resolve.`
      }
    }

    const id = Date.now().toString()
    showNotification({
      id,
      title: `${error.status} Error`,
      message,
      color: 'red',
      autoClose: false,
      ...props,
    })
    return id
  }

  static warning(message, props = {}) {
    console.warn(message)
    const id = Date.now().toString()
    showNotification({
      id,
      title: `Warning`,
      message,
      color: 'yellow',
      autoClose: false,
      ...props,
    })
    return id
  }

  static done(id, props = {}) {
    if (id) {
      updateNotification({
        id,
        title: 'Done!',
        message: 'The task has finished.',
        color: 'green',
        icon: <IconCheck size={16}/>,
        autoClose: false,
        ...props,
      })
    }
  }

  static close(id) {
    if (id) hideNotification(id)
  }

}
