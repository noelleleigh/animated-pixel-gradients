/* eslint-env browser */
/** @module utils */

/**
 * @typedef {Object} CanvasAndContext
 * @property {HTMLCanvasElement} canvas
 * @property {CanvasRenderingContext2D} ctx - The '2d' context for `canvas`
 */

/**
 * Return an `HTMLCanvasElement` and a `CanvasRenderingContext2D` associated with it.
 * @param {Number} width - Width of the canvas
 * @param {Number} height - Height of the canvas
 * @returns {CanvasAndContext}
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
 * @param {Node} parent - The DOM node that will contain `newElement`
 * @param {Node} oldElement - The DOM node that will be replaced by `newElement`
 * @param {Node} newElement - The DOM node that will be placed in `parent`
 * @returns {Node} newElement
 */
const replaceElement = (parent, oldElement, newElement) => {
  if (!parent.contains(oldElement)) {
    parent.appendChild(newElement)
    return
  }
  oldElement.remove()
  parent.appendChild(newElement)
  return newElement
}

/**
 * @typedef {Object} AnimationParts
 * @property {State} initState - Animation State with starting values
 * @property {Function} updateFunc - Function that takes a single argument `delta` and updates the state
 * @property {Function} drawFunc - Function that takes no arguments and draws using the state information
 */

/**
 * Return:
 *   - The state of `stateFactory(stateOptions)`
 *   - The function from `updateFactory(state)`
 *   - The function from `drawFactory(state)`
 * @param {Function} stateFactory - A function that returns a State object
 * @param {Function} updateFactory - A function that returns an update function
 * @param {Function} drawFactory - A function that returns a draw function
 * @param {Object} stateOptions - An object that `stateFactory` is called with
 * @returns {AnimationParts} Object containing the results from the three factories
 */
const setupAnimationState = (stateFactory, updateFactory, drawFactory, stateOptions) => {
  const state = stateFactory(stateOptions)
  const update = updateFactory(state)
  const draw = drawFactory(state)

  return {
    initState: state,
    updateFunc: update,
    drawFunc: draw
  }
}

/**
 * Convert a hex string representation of a color to a 3-Array of ints for RGB.
 *
 * Source: https://stackoverflow.com/a/5624139/9165387
 * @example
 * // Returns [155, 255, 79]
 * hexToRgb('#9bff4f')
 * @param {String} hex - A color in hex format (e.g. "#9bff4f")
 * @returns {Number[]} 3-array of integers representing `[R, G, B]`
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
 *
 * Source: https://stackoverflow.com/a/5624139/9165387
 * @example
 * // Returns '#9bff4f'
 * rgbToHex(155, 255, 79)
 * @param {Number} r - Red channel
 * @param {Number} g - Blue channel
 * @param {Number} b - Red channel
 * @returns {string} Hex color string
 */
const rgbToHex = (r, g, b) => {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

/**
 * Return the values of a `HTMLFormElement` as an object keyed by the `name` attributes of the
 * `<input>` elements within it.
 * @param {HTMLFormElement} form - The form to have its values extracted
 * @returns {Object}
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
 * @example
 * // Returns 1
 * getNextIndex(0, [1, 2, 3])
 * // Returns 0
 * getNextIndex(2, [1, 2, 3])
 * @param {Number} index - The current index of the array
 * @param {Array} array - The array to retrieve the next valid index from
 * @returns {Number}
 */
const getNextIndex = (index, array) => {
  if (index >= array.length - 1) {
    return 0
  } else {
    return index + 1
  }
}

/**
 * Feature detection for the Web Storage API.
 *
 * Source: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API#Feature-detecting_localStorage
 * @param {String} type - The type of storage you want to check: 'localStorage' or 'sessionStorage'
 * @returns {boolean}
 */
const storageAvailable = (type) => {
  let storage = null
  try {
    storage = window[type]
    const x = '__storage_test__'
    storage.setItem(x, x)
    storage.removeItem(x)
    return true
  } catch (e) {
    return e instanceof DOMException && (
      // everything except Firefox
      e.code === 22 ||
      // Firefox
      e.code === 1014 ||
      // test name field too, because code might not be present
      // everything except Firefox
      e.name === 'QuotaExceededError' ||
      // Firefox
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
      // acknowledge QuotaExceededError only if there's something already stored
      storage.length !== 0
  }
}

export {
  create2dContext,
  replaceElement,
  setupAnimationState,
  hexToRgb,
  rgbToHex,
  formToJson,
  getNextIndex,
  storageAvailable
}
