export default function stopPropagation (event) {
  if (event.stopPropagation)
    event.stopPropagation()
}
