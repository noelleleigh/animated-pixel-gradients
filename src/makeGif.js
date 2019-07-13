/* eslint-env browser */
/** @module makeGif */
import GIF from 'gif.js'
import 'gif.js/dist/gif.worker'

/**
 * Using an inital `state` containing a `ctx` property pointing to a `CanvasRenderingContext2D`,
 * an `updateFunc` that modifies that state, and a `drawFunc` that draws a frame to `state.ctx`,
 * render out a GIF image file whose `Blob` is passed to the `callback` function.
 * @param {Object} state - Initial state of the animation. Contains a `ctx` property where the frames retrieved from
 * @param {Function} updateFunc - Function that takes a `frameDelay` in ms and updates the state for the next frame
 * @param {Function} drawFunc - Function that draws a frame to `state.ctx`
 * @param {Number} frameDelay - The delay between the frames of the GIF and the delay passed to `updateFunc`
 * @param {Function} progressHandler - Function that takes a `progress` float (0.0-1.0) to report the progress of the GIF rendering
 * @param {Function} callback - Function that takes a `Blob` to handle the GIF after rendering
 */
const makeGif = (state, updateFunc, drawFunc, frameDelay, progressHandler, callback) => {
  const gif = new GIF({
    repeat: 0,
    width: state.canvasFinal.width,
    height: state.canvasFinal.height,
    workers: 4
  })
  gif.on('progress', progressHandler)
  gif.on('finished', callback)

  // Keep adding frames until state.progress loops back to 0 (one full cycle)
  let previousProgress = state.progress
  while (previousProgress <= state.progress) {
    previousProgress = state.progress
    updateFunc(frameDelay)
    drawFunc()
    gif.addFrame(state.ctxFinal, { copy: true, delay: frameDelay })
  }
  gif.render()
}

export default makeGif
