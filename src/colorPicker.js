import $ from 'jquery'
import 'spectrum-colorpicker'
import 'spectrum-colorpicker/spectrum.css'

const makeColorPicker = (element, options) => {
  const ammendedOptions = Object.assign({preferredFormat: 'hex'}, options)
  return $(element)
    .spectrum(ammendedOptions)
    .show()
}

export {
  makeColorPicker
}
