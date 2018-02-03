/* eslint-env browser */
/** @module colorPicker */
import $ from 'jquery'
import 'spectrum-colorpicker'
import 'spectrum-colorpicker/spectrum.css'

/**
 * Assign a jQuery Spectrum color picker to the provided input element with
 * the given options.
 * For options, see: https://bgrins.github.io/spectrum/#options
 * @param {HTMLInputElement} element - The element that jQuery will attach the color picker to
 * @param {Object} options - Options passed to Spectrum constructor
 * @returns {$} jQuery context
 */
const makeColorPicker = (element, options) => {
  const ammendedOptions = Object.assign({preferredFormat: 'hex'}, options)
  return $(element)
    .spectrum(ammendedOptions)
    .show()
}

export {
  makeColorPicker
}
