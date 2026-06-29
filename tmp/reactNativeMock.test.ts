import { View } from 'react-native'

test('react-native mock', () => {
  console.log('View type:', typeof View)
  expect(typeof View).toBe('function')
})
