/* eslint-env browser */
/** @module drawFuncs */
import { DIRECTION } from './constants.js'

// Get the position along a direction of an index of (width * height * 4)
/**
 * Given an `ImageData(width, height)` and an index `i` on its `data`, get the index of the column
 * or row in the ImageData `i` belongs to when moving in a given `direction`.
 * @example
 * // Returns 2
 * getPosition(4, 3, 33, DIRECTION.DOWN)
 * // Returns 1
 * getPosition(4, 3, 33, DIRECTION.UP)
 * // Returns 0
 * getPosition(4, 3, 33, DIRECTION.RIGHT)
 * // Returns 3
 * getPosition(4, 3, 33, DIRECTION.LEFT)
 * @param {Number} width - `width` property of the ImageData
 * @param {Number} height - `height` property of the ImageData
 * @param {Number} i - Index within the `data` property of the ImageData
 * @param {Number} direction - One of the four properties of `DIRECTION`
 * @returns {Number}
 */
const getPosition = (width, height, i, direction) => {
  if (direction === DIRECTION.DOWN) {
    return Math.floor((i / 4) / width)
  } else if (direction === DIRECTION.UP) {
    return height - Math.floor((i / 4) / width)
  } else if (direction === DIRECTION.RIGHT) {
    return Math.floor(i / 4) % width
  } else if (direction === DIRECTION.LEFT) {
    return (width - 1) - Math.floor((i / 4) % width)
  } else {
    throw new Error(`Direction "${direction}" not recognized`)
  }
}

/**
 * Return the dimension length from an ImageData `width` or `height` based on the `direction`.
 *
 * @example
 * // Returns 3
 * getLengthFromDirection(4, 3, DIRECTION.UP)
 * // Returns 3
 * getLengthFromDirection(4, 3, DIRECTION.DOWN)
 * // Returns 4
 * getLengthFromDirection(4, 3, DIRECTION.RIGHT)
 * // Returns 4
 * getLengthFromDirection(4, 3, DIRECTION.LEFT)
 * @param {Number} width - `width` property of the ImageData
 * @param {Number} height - `height` property of the ImageData
 * @param {Number} direction - One of the properties of `DIRECTION`
 * @returns {Number}
 */
const getLengthFromDirection = (width, height, direction) => {
  if (direction === DIRECTION.DOWN || direction === DIRECTION.UP) {
    return height
  } else if (direction === DIRECTION.RIGHT || direction === DIRECTION.LEFT) {
    return width
  } else {
    throw new Error(`Direction "${direction}" not recognized`)
  }
}

/**
 * Assign the four channels of a pixel in an `data` array given the index of the red
 * channel using the `color` array. If `color.length` is 3, `opacity` will set the opacity,
 * otherwise `color[3]` will.
 * @param {Uint8ClampedArray} data - The data from the `data` property of an `ImageData`
 * @param {Number} index - Index on `data`
 * @param {Number[]} color - Array of 3 or 4 integers representing an RGB(A) color
 * @param {Number} opacity - Specify the opacity separately if you want
 */
const colorPixel = (data, index, color, opacity = 255) => {
  if (color[3] !== undefined) {
    opacity = color[3]
  }
  data[index] = color[0]
  data[index + 1] = color[1]
  data[index + 2] = color[2]
  data[index + 3] = opacity
}

/**
 * Fill an ImageData array with a solid color.
 * @param {ImageData} imageData - The `ImageData` you want to fill
 * @param {Number[]} color - Array of 3 or 4 integers representing an RGB(A) color
 * @returns {ImageData} Returns the modified `ImageData`
 */
const fillImageData = (imageData, color) => {
  const imgDataData = imageData.data
  const imgDataLength = imgDataData.length
  for (let i = 0; i < imgDataLength; i += 4) {
    colorPixel(imgDataData, i, color)
  }
  return imageData
}

/**
 * Draw a noisy gradient on the ImageData provided. "Noisy" means the pixels are either colored, or
 * untouched, with no color blending attempted.
 * @param {ImageData} imageData - The ImageData on which to draw the gradient
 * @param {Number[]} color - The color the gradient will start from
 * @param {Number} transitionLength - (float 0.0 - 1.0) What proportion of the grid will the transition occupy
 * @param {Number} transitionStartPoint - (float) The relative normalized position of the start of the
 * gradient transition (e.g. 0.5 will start from the center of the grid)
 * @param {Number} direction - One of the properties of `DIRECTION` to determine the direction of fade for the gradient
 * @returns {ImageData} Returns the modified `ImageData`
 */
const drawNoisyGradient = (imageData, color, transitionLength, transitionStartPoint, direction) => {
  const imageDataWidth = imageData.width
  const imageDataHeight = imageData.height
  const data = imageData.data
  const dataLength = data.length

  for (let i = 0; i < dataLength; i += 4) {
    const gradientDirPos = getPosition(imageDataWidth, imageDataHeight, i, direction)
    const gradientDirPosNormalized = gradientDirPos / getLengthFromDirection(imageDataWidth, imageDataHeight, direction)

    if (gradientDirPosNormalized < transitionStartPoint) {
      // Before transition: draw solid color
      colorPixel(data, i, color)
    } else if (gradientDirPosNormalized >= transitionStartPoint &&
               gradientDirPosNormalized < transitionStartPoint + transitionLength) {
      // Within transition: conditionally color
      const transitionPos = Math.abs(gradientDirPosNormalized - transitionStartPoint) / transitionLength
      if (Math.random() >= transitionPos) {
        colorPixel(data, i, color)
      }
    } else {
      // Beyond gradient: do nothing
      continue
    }
  }
  return imageData
}

/**
 * Map the contents of a `sourceImageData` to a larger `destImageData` whose width and height are
 * `factor` times as large as those of `sourceImageData` using nearest-neighbor scaling.
 * @param {ImageData} sourceImageData - The source `ImageData`
 * @param {ImageData} destImageData - The destination `ImageData`
 * @param {Number} factor - The factor by which `destImageData`'s dimensions are greater than
 * `sourceImageData`'s dimensions.
 * @returns {ImageData} - The modified `destImageData`
 */
const scaleImageData = (sourceImageData, destImageData, factor) => {
  const factor_ = factor
  const sourceDataWidth = sourceImageData.width
  const widthScaled = sourceDataWidth * factor_
  const heightScaled = sourceImageData.height * factor_
  const imageDataData = sourceImageData.data
  const destWidth = destImageData.width
  const destData = destImageData.data

  let scaledPixelBaseIndex = 0
  const color = new Uint8ClampedArray(4)
  for (let y = 0; y < heightScaled; y += 1) {
    // Manually set the scaled position on a new row because the scaled WxH may not be exactly the same as destImageData
    scaledPixelBaseIndex = destWidth * y * 4
    for (let x = 0; x < widthScaled; x += 1) {
      if (x % factor_ === 0) {
        // Get corresponding pixel color from original ImageData
        const sourcePixelBaseIndex = 4 * ((sourceDataWidth * Math.floor(y / factor_)) + Math.floor(x / factor_))
        color[0] = imageDataData[sourcePixelBaseIndex]
        color[1] = imageDataData[sourcePixelBaseIndex + 1]
        color[2] = imageDataData[sourcePixelBaseIndex + 2]
        color[3] = imageDataData[sourcePixelBaseIndex + 3]
      }
      colorPixel(destData, scaledPixelBaseIndex, color)
      scaledPixelBaseIndex += 4
    }
  }
  return destImageData
}

export { scaleImageData, drawNoisyGradient, fillImageData, getPosition }
