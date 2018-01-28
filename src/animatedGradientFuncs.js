/* eslint-env browser */
import './font-face.css'
import {DIRECTION} from './constants'
import {create2dContext} from './utils'
import {drawNoisyGradient, scaleImageData, fillImageData} from './drawFuncs'

/**
 * Return an object with the following properties:
 *
 *   - `canvas`: HTMLCanvasElement(width, height)
 *
 *   - `ctx`: CanvasRenderingContext2D from canvas
 *
 *   - `scalingFactor`: The magnitude by which the scaledImageData should be shrunk
 *
 *   - `fullSizeImageData`: ImageData(width, height)
 *
 *   - `scaledImageData`: ImageData(width / scalingFactor, height / scalingFactor), filled with second color
 *
 *   - `progress`: 0.0
 *
 *   - `gradientColors`: Array of Number[3], one for each RGB color the gradient should take
 *
 *   - `gradientColorIndex`: 0
 *
 *   - `gradientDirection`: DIRECTION[gradientDirection]
 *
 *   - `gradientWidth`: 0.5
 *
 *   - `text`: text

 * @param {Object} Options to populate the state
 */
const createState = ({width, height, scalingFactor, colors, gradientDirection, text}) => {
  const {canvas, ctx} = create2dContext(width, height)
  const scaledImageData = new ImageData(width / scalingFactor, height / scalingFactor)
  // Fill imageData with second color if available
  fillImageData(scaledImageData, colors[colors.length > 1 ? 1 : 0])
  return {
    canvas: canvas,
    ctx: ctx,
    scalingFactor: scalingFactor,
    fullSizeImageData: new ImageData(width, height),
    scaledImageData: scaledImageData,
    progress: 0.0,
    gradientColors: colors,
    gradientColorIndex: 0,
    gradientDirection: DIRECTION[gradientDirection],
    gradientWidth: 0.5,
    text: text
  }
}

/**
 * Return a function that takes a single float argument `delta` and modifies `stateTarget`
 * in a number of ways:
 *   - Increment `stateTarget.progress` such that it takes `stateTarget.gradientColors.length * 2000 ms`
 * to reach 1.0, then loop back to 0.0 if it passes 1.0.
 *   - Update `stateTarget.gradientColorIndex` to regularly move through the colors, completing a
 * full cycle by the time `stateTarget.progress` reaches 1.0.
 * @param {Object} state object that will be modified by update()
 */
const updateGenerator = (stateTarget) => {
  const update = (delta) => {
    // Update progress variable
    const newProgress = stateTarget.progress + (delta / (stateTarget.gradientColors.length * 2000))
    if (newProgress > 1.0) {
      stateTarget.progress = 0.0
    } else {
      stateTarget.progress = newProgress
    }
    // Update color index
    stateTarget.gradientColorIndex = Math.floor(stateTarget.progress * stateTarget.gradientColors.length)
  }

  return update
}

/**
 * Return a function that takes no arguments and draws a pixelated gradient with some text on top.
 * @param {Object} state that will be used to determine what is drawn and where.
 */
const drawGenerator = (stateTarget) => {
  const draw = () => {
    const ctx = stateTarget.ctx
    const progressXColors = stateTarget.progress * stateTarget.gradientColors.length
    const colorProgress = progressXColors - Math.floor(progressXColors)
    drawNoisyGradient(
      stateTarget.scaledImageData,
      stateTarget.gradientColors[stateTarget.gradientColorIndex],
      stateTarget.gradientWidth,
      (colorProgress * (1 + stateTarget.gradientWidth)) - stateTarget.gradientWidth,
      stateTarget.gradientDirection
    )
    if (stateTarget.scalingFactor === 1) {
      ctx.putImageData(stateTarget.scaledImageData, 0, 0)
    } else {
      scaleImageData(
        stateTarget.scaledImageData,
        stateTarget.fullSizeImageData,
        stateTarget.scalingFactor
      )
      ctx.putImageData(stateTarget.fullSizeImageData, 0, 0)
    }

    const oldCompOp = ctx.globalCompositeOperation
    ctx.globalCompositeOperation = 'difference'
    ctx.fillStyle = '#fff'
    ctx.font = '32px "Visitor"'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(stateTarget.text, ctx.canvas.width / 2, ctx.canvas.height / 2)
    ctx.globalCompositeOperation = oldCompOp
  }

  return draw
}

export {
  createState,
  updateGenerator,
  drawGenerator
}
