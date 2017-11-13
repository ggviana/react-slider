/**
 * To prevent text selection while dragging.
 * http://stackoverflow.com/questions/5429827/how-can-i-prevent-text-element-selection-with-cursor-drag
 */
export default function pauseEvent (event) {
  if (event.stopPropagation)
    event.stopPropagation()
  if (event.preventDefault)
    event.preventDefault()
  return false
}
