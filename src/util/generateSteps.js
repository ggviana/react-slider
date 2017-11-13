/**
 * Spreads `count` values equally between `min` and `max`.
 */
export default function generateSteps (min, max, count) {
  var range = (max - min) / (count - 1)
  var res = []

  for (var i = 0; i < count; i++) {
    res.push(min + range * i)
  }

  return res
}
