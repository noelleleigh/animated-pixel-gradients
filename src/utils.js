/* eslint-env browser */

/**
 * Return an `HTMLCanvasElement` and a `CanvasRenderingContext2D` associated with it.
 * @param {Number} width - Width of the canvas
 * @param {Number} height - Height of the canvas
 */
const create2dContext = (width, height) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return {
    canvas: canvas,
    ctx: canvas.getContext('2d')
  }
}

/**
 * Replace `oldElement` contained within `parent` with `newElement`.
 * @param {HTMLElement} parent
 * @param {HTMLElement} oldElement
 * @param {HTMLElement} newElement
 */
const replaceElement = (parent, oldElement, newElement) => {
  if (!document.body.contains(oldElement)) {
    parent.appendChild(newElement)
    return
  }
  oldElement.remove()
  parent.appendChild(newElement)
  return newElement
}

/**
 * Return the state of `stateGenerator(stateOptions)`, the function from `updateGenerator(state)`,
 * and the function from `drawGenerator(state)`.
 * @param {Function} stateGenerator
 * @param {Function} updateGenerator
 * @param {Function} drawGenerator
 * @param {Object} stateOptions
 */
const setupAnimationState = (stateGenerator, updateGenerator, drawGenerator, stateOptions) => {
  const state = stateGenerator(stateOptions)
  const update = updateGenerator(state)
  const draw = drawGenerator(state)

  return {
    initState: state,
    updateFunc: update,
    drawFunc: draw
  }
}

/**
 * Convert a hex string representation of a color to a 3-Array of ints for RGB.
 * Source: https://stackoverflow.com/a/5624139/9165387
 * @param {String} hex
 */
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (result) {
    return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
  } else {
    throw new Error(`String "${hex}" is not a valid hexidecimal color`)
  }
}

/**
 * Convert R, G, and B ints to a hex representation.
 * Source: https://stackoverflow.com/a/5624139/9165387
 * @param {Number} r
 * @param {Number} g
 * @param {Number} b
 */
const rgbToHex = (r, g, b) => {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

// Return the values of a form DOM object as a JS object
/**
 * Return the values of a `HTMLFormElement` as an object keyed by name.
 * @param {HTMLFormElement} form
 */
const formToJson = function formToJson (form) {
  const result = {}
  Array.from(form.elements)
    .filter(elem => elem.tagName === 'INPUT' && elem.name !== '')
    .forEach((elem) => {
      if (elem.type === 'checkbox') {
        result[elem.name] = elem.checked
      } else if (elem.type === 'range' || elem.type === 'number') {
        result[elem.name] = parseInt(elem.value, 10)
      } else if (elem.type === 'radio') {
        if (elem.checked) {
          result[elem.name] = elem.value
        }
      } else {
        result[elem.name] = elem.value // eslint-disable-line prefer-destructuring
      }
    })

  return result
}

/**
 * Given an `index` of an `array`, return the next valid index, wrapping to `0` at the end.
 * @param {Number} index
 * @param {Array} array
 */
const getNextIndex = (index, array) => {
  if (index >= array.length - 1) {
    return 0
  } else {
    return index + 1
  }
}

export {
  create2dContext,
  replaceElement,
  setupAnimationState,
  hexToRgb,
  rgbToHex,
  formToJson,
  getNextIndex
}
