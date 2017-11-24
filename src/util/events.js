/**
 * To prevent text selection while dragging.
 * http://stackoverflow.com/questions/5429827/how-can-i-prevent-text-element-selection-with-cursor-drag
 */
export function pauseEvent (event) {
  if (event.stopPropagation)
    event.stopPropagation()
  if (event.preventDefault)
    event.preventDefault()
  return false
}

export function addHandlers (eventMap) {
  for (let key in eventMap) {
    document.addEventListener(key, eventMap[key], false)
  }
}

export function removeHandlers (eventMap) {
  for (let key in eventMap) {
    document.removeEventListener(key, eventMap[key], false)
  }
}
