import { getPosition } from '../src/drawFuncs.js'
import { DIRECTION } from '../src/constants.js'

const testEq = (received, wanted, name) => {
  console.assert(received === wanted, `Test: ${name} \nWanted: ${wanted} \nReceived: ${received}`)
}

// Test drawFuncs.getPosition
testEq(getPosition(4, 3, 33, DIRECTION.DOWN), 2, 'getPosition DOWN')
testEq(getPosition(4, 3, 33, DIRECTION.UP), 1, 'getPosition UP')
testEq(getPosition(4, 3, 33, DIRECTION.RIGHT), 0, 'getPosition RIGHT')
testEq(getPosition(4, 3, 0, DIRECTION.LEFT), 3, 'getPosition LEFT i=0')
testEq(getPosition(4, 3, 4, DIRECTION.LEFT), 2, 'getPosition LEFT i=4')
testEq(getPosition(4, 3, 8, DIRECTION.LEFT), 1, 'getPosition LEFT i=8')
testEq(getPosition(4, 3, 12, DIRECTION.LEFT), 0, 'getPosition LEFT i=12')
testEq(getPosition(4, 3, 33, DIRECTION.LEFT), 3, 'getPosition LEFT i=33')
