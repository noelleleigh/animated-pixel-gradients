/* eslint-env browser */
import './canvas-shadow.css'
import './client.css'
import visitorFont from './assets/visitor1.ttf'
import * as opentype from 'opentype.js'
import MainLoop from 'mainloop.js'
import makeGif from './makeGif.js'
import {
  setupAnimationState, replaceElement,
  hexToRgb, formToJson, storageAvailable,
  testInputColorSupport} from './utils.js'
import {createState, updateGenerator, drawGenerator} from './animatedGradientFuncs.js'
import {makeColorPicker} from './colorPicker'

/**
 * Take the contents of an HTMLFormElement and return a object suitable for use as options for
 * `createState`.
 *
 * Expects form children with at least the following names:
 *   - `canvasWidth`
 *   - `canvasHeight`
 *   - `scalingFactor`
 *   - `gradientColor1`
 *   - `gradientColor2`
 *   - `gradientDirection`
 *   - `canvasText`
 * @param {HTMLFormElement} form
 */
const transformFormToStateOptions = (form) => {
  const formResults = formToJson(form)
  return {
    width: formResults.canvasWidth,
    height: formResults.canvasHeight,
    scalingFactor: formResults.scalingFactor,
    colors: [formResults.gradientColor1, formResults.gradientColor2].map(hexToRgb),
    gradientDirection: formResults.gradientDirection,
    text: formResults.canvasText,
    fontSize: formResults.canvasFontSize
  }
}

/**
 * Convenience function to take the contents of an HTMLFormElement and use them to configure
 * a canvas animation that is appended as a child of `containerElement` and started.
 * @param {HTMLFormElement} form - Source of the configuration data for the animation
 * @param {HTMLElement} containerElement - Container element for the canvas
 */
const createPreviewAnimation = (form, font, containerElement) => {
  const stateOptions = transformFormToStateOptions(form)
  stateOptions.font = font
  const {
    initState,
    updateFunc,
    drawFunc
  } = setupAnimationState(createState, updateGenerator, drawGenerator, stateOptions)
  replaceElement(containerElement, containerElement.children[0], initState.canvasFinal)

  MainLoop.setUpdate(updateFunc).setDraw(drawFunc).start()
}

/**
 * Save the contents of `form` to `sessionStorage` in name:value pairs
 * @param {HTMLFormElement} form
 */
const saveFormContents = (form) => {
  const formData = formToJson(form)
  for (let pair of Object.entries(formData)) {
    const [name, value] = pair
    sessionStorage.setItem(name, value)
  }
}

/**
 * Populate the values of inputs in `form` by name from sessionStorage
 * @param {HTMLFormElement} form
 */
const loadFormContents = (form) => {
  const inputNames = Array.from(Object.keys(formToJson(form)))
  inputNames.forEach((name) => {
    const value = sessionStorage.getItem(name)
    if (value) {
      const element = form.querySelector(`[name="${name}"]`)
      if (element.type === 'radio') {
        form.querySelector(`[name="${name}"][value="${value}"]`).checked = true
      } else {
        element.value = value
      }
    }
  })
}

/**
 * Add Spectrum color pickers to all the `<input type="color">` elements
 * within a form.
 * @param {HTMLFormElement} form
 */
const setupColorPickers = (form) => {
  Array.from(form.querySelectorAll('input[type="color"]'))
    .forEach((element) => {
      makeColorPicker(element, {
        showInput: true,
        change: (color) => {
          element.value = color.toHexString()
        }
      })
    })
}

// EXECUTION
// Get our DOM elements
const container = document.getElementById('canvas-container')
const form = document.getElementById('form')
const buttonRenderGif = document.getElementById('button-gif-render')
const gifContainer = document.getElementById('gif-container')
const labelGifRender = document.getElementById('gif-render-progress')
const gifLinkContainer = document.getElementById('gif-link-container')

// Setup event listeners

// Allow tapping on inputs to focus them
Array.from(document.querySelectorAll('form input[type="number"], form input[type="text"], form input[type="color"]'))
  .forEach((element) => {
    element.addEventListener('touchend', (event) => {
      event.target.focus()
      event.target.select()
    })
  })

// Create preview animation
form.addEventListener('submit', (event) => {
  event.preventDefault()
  if (storageAvailable('sessionStorage')) {
    saveFormContents(event.target)
  }
  opentype.load(visitorFont, (err, font) => {
    if (err) {
      console.error(`Font "${visitorFont}" unable to be loaded: ${err}`)
    } else {
      createPreviewAnimation(event.target, font, container)
    }
  })
})

// Render GIF file and add a download link
buttonRenderGif.addEventListener('click', (event) => {
  event.preventDefault()
  const stateOptions = transformFormToStateOptions(form)
  const {
    initState,
    updateFunc,
    drawFunc
  } = setupAnimationState(createState, updateGenerator, drawGenerator, stateOptions)

  // Display the percentage progress
  const progressHandler = (progress) => {
    labelGifRender.textContent = `Combining frames: ${Math.floor(progress * 100)}%`
  }

  // Create a download link to the GIF
  const finishedHandler = (blob) => {
    const downloadLink = document.createElement('a')
    downloadLink.href = URL.createObjectURL(blob)
    // Make filename safe
    const filename = document.getElementById('input-canvas-text').value.replace(/[\\/:*?<>| ]/g, '')
    downloadLink.download = filename
    const sizeMB = Number.parseFloat(blob.size / 1024 / 1024)
    downloadLink.textContent = `Click to download GIF (${sizeMB.toPrecision(3)} MB)`
    gifLinkContainer.appendChild(downloadLink)
  }

  // Update GIF rendering message then create the GIF
  requestAnimationFrame(() => {
    gifContainer.style.display = 'block'
    gifLinkContainer.innerHTML = ''
    labelGifRender.textContent = 'Gathering frames...'
    requestAnimationFrame(() => {
      makeGif(
        initState, updateFunc, drawFunc, 1000 / 60,
        progressHandler,
        finishedHandler
      )
    })
  })
})

// Pause the preview animation when clicked
container.addEventListener('click', (event) => {
  MainLoop.isRunning() ? MainLoop.stop() : MainLoop.start()
})

// Run on page load

// Hide the GIF container at the start
gifContainer.style.display = 'none'

// Load form contents from sessionStorage if available
if (storageAvailable('sessionStorage')) {
  loadFormContents(form)
}
if (!testInputColorSupport()) {
  setupColorPickers(form)
}

// Start the preview animation
form.querySelector('[type="submit"]').click()
