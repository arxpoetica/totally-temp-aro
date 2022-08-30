/*
good ol' linked list! 
object structure:
linkedList: {
  _head: UUID,
  _tail: UUID,
  ${UUID}: {
    prev: UUID,
    next: UUID,
    data: UUID,
  },
}
*/

let LinkedListMutator = {}

LinkedListMutator.getNewLinkedList = () => {
  return {
    _head: null,
    _tail: null,
    _count: 0,
  }
}

// ------- //

// private function
let getNewLink = (prev = null, next = null, data = null) => {
  return {
    prev,
    next,
    data,
  }
}

// all the ifs could be avoided if we had variable-variables 

// private function, depends on remove, insert, shift to handle values and count
// id MUST already be added to linkedList
let removeLinkage = (linkedList, id) => {
  // do NOT check if linkedList[id] exists! 
  //  other functions change count and depend on linkedList[id] existing
  //  so if it doesn't we want errors in the console
  if (linkedList[id].prev) {
    linkedList[ linkedList[id].prev ].next = linkedList[id].next // could be null if it's the tail, we're fine with that
  } else {
    // it's the head
    linkedList._head = linkedList[id].next
  }

  if (linkedList[id].next) {
    linkedList[ linkedList[id].next ].prev = linkedList[id].prev // could be null if it's the head, we're fine with that
  } else {
    // it's the tail
    linkedList._tail = linkedList[id].prev // could be null if it's the onlt one, we're fine with that
  }
  return linkedList
}

// private function, depends on remove, insert, shift to handle values and count
// id MUST already be added to linkedList
let insertLinkage = (linkedList, atId, id) => {
  // do NOT check if linkedList[id] exists! 
  //  other functions change count and depend on linkedList[id] existing
  //  so if it doesn't we want errors in the console
  if (!atId) {
    // adding to the end
    if (linkedList._tail) {
      linkedList[id].prev = linkedList._tail
      linkedList[ linkedList._tail ].next = id
    } else {
      // only element
      linkedList[id].prev = null
      linkedList._head = id
    }
    linkedList[id].next = null
    linkedList._tail = id
  } else {
    // inserting to the head or body
    if (linkedList[atId].prev) {
      // body
      linkedList[id].prev = linkedList[atId].prev
      linkedList[ linkedList[atId].prev ].next = id
    } else {
      // head
      linkedList[id].prev = null
      linkedList._head = id
    }
    linkedList[atId].prev = id
  }
  return linkedList
}

// ------- //

LinkedListMutator.getCount = (linkedList) => {
  return linkedList._count
}

LinkedListMutator.remove = (linkedList, id) => {
  if (linkedList[id]) {
    linkedList = LinkedListMutator.removeLinkage(linkedList, id)
    delete linkedList[id]
    linkedList._count --
  }
  return linkedList
}

LinkedListMutator.insertAt = (linkedList, atId, insertId, insertData) => {
  if (linkedList[insertId]) {
    // we already have this entry, update the value then shift it
    linkedList[insertId].data = insertData
    return LinkedListMutator.shiftTo(linkedList, atId, insertId)
  }
  // new entry
  if (!atId || linkedList[atId]) atId = null // if blank or invalid atId: add to end
  linkedList[insertId] = getNewLink(null, null, insertData)
  linkedList = insertLinkage(linkedList, atId, insertId)
  linkedList._count++
  return linkedList
}

LinkedListMutator.shiftTo = (linkedList, atId, id) => {
  if (!linkedList[id] || !linkedList[atId]) return linkedList
  linkedList = removeLinkage(linkedList, id)
  linkedList = insertLinkage(linkedList, atId, id)
  return linkedList
}

LinkedListMutator.insertAfter = (linkedList, afterId, insertId, insertData) => {
  let atId = null
  if (afterId && linkedList[afterId]) {
    atId = linkedList[afterId].next // could be null, we're fine with that
  } // else insert at the end
  return LinkedListMutator.insertAt(linkedList, atId, insertId, insertData)
}

LinkedListMutator.insertAtHead = (linkedList, insertId, insertData) => {
  return LinkedListMutator.insertAt(linkedList, linkedList._head, insertId, insertData)
}

LinkedListMutator.insertAtTail = (linkedList, insertId, insertData) => {
  return LinkedListMutator.insertAfter(linkedList, null, insertId, insertData)
}

LinkedListMutator.removeHead = (linkedList) => {
  return LinkedListMutator.remove(linkedList, linkedList._head)
}

LinkedListMutator.removeTail = (linkedList) => {
  return LinkedListMutator.remove(linkedList, linkedList._tail)
}

LinkedListMutator.shiftToHead = (linkedList, id) => {
  return LinkedListMutator.shiftTo(linkedList, linkedList._head, id)
}

LinkedListMutator.shiftToTail = (linkedList, id) => {
  return LinkedListMutator.shiftTo(linkedList, null, id)
}

LinkedListMutator.getAt = (linkedList, id) => {
  let data = null
  if (linkedList[id]) data = linkedList[id].data
  return {key: id, value: data}
}

LinkedListMutator.getHead = (linkedList) => {
  return LinkedListMutator.getAt(linkedList, linkedList._head)
}

LinkedListMutator.getTail = (linkedList) => {
  return LinkedListMutator.getAt(linkedList, linkedList._tail)
}

LinkedListMutator.getPrevOf = (linkedList, id) => {
  return LinkedListMutator.getAt(linkedList, linkedList[id].prev)
}

LinkedListMutator.getNextOf = (linkedList, id) => {
  return LinkedListMutator.getAt(linkedList, linkedList[id].next)
}

Object.freeze(LinkedListMutator)
export {LinkedListMutator}
