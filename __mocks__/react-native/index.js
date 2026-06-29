const React = require('react')

const View = ({ children, style, ...props }) => React.createElement('View', null, children)
const Text = ({ children, style, ...props }) => React.createElement('Text', null, children)
const TextInput = ({ children, style, ...props }) => React.createElement('TextInput', { ...props })
const Pressable = ({ children, style, ...props }) => React.createElement('Pressable', { ...props, onClick: props.onPress }, children)
const ScrollView = ({ children, style, ...props }) => React.createElement('ScrollView', null, children)
const FlatList = ({ data, renderItem, style, ...props }) => React.createElement('FlatList', null, data ? data.map((item, i) => React.createElement(React.Fragment, null, renderItem({ item, index: i }))) : null)
const Image = ({ source, style, ...props }) => React.createElement('Image', { ...props, src: source?.uri || source })
const ActivityIndicator = ({ color, size, ...props }) => React.createElement('ActivityIndicator', { ...props })
const KeyboardAvoidingView = ({ children, style, ...props }) => React.createElement('KeyboardAvoidingView', null, children)
const Modal = ({ children, visible, ...props }) => visible ? React.createElement('Modal', null, children) : null
const Switch = ({ value, onValueChange, ...props }) => React.createElement('Switch', { ...props, checked: value, onChange: (e) => onValueChange?.(e.target.checked) })
const Alert = { alert: (title, msg) => {} }
const Platform = { OS: 'web', select: (obj) => obj.web ?? obj.default }

const StyleSheet = {
  create: (styles) => {
    const result = {}
    for (const key in styles) {
      result[key] = {}
      for (const prop in styles[key]) {
        const val = styles[key][prop]
        result[key][prop] = typeof val === 'number' ? val : val
      }
    }
    return result
  },
  flatten: (style) => {
    if (!style) return {}
    if (Array.isArray(style)) return Object.assign({}, ...style.map(s => StyleSheet.flatten(s)))
    if (typeof style === 'object') return { ...style }
    return {}
  },
  hairlineWidth: 0.5,
  absoluteFill: {},
}

module.exports = {
  View, Text, TextInput, Pressable, ScrollView, FlatList, Image,
  ActivityIndicator, KeyboardAvoidingView, Modal, Switch, Alert,
  Platform, StyleSheet,
  Animated: { View, Text, createAnimatedComponent: (comp) => comp },
  Dimensions: { get: () => ({ width: 375, height: 812 }) },
  useWindowDimensions: () => ({ width: 375, height: 812 }),
  Appearance: { getColorScheme: () => 'light' },
  StatusBar: { currentHeight: 0 },
  PixelRatio: { get: () => 2 },
  TouchableOpacity: Pressable,
  RefreshControl: View,
  SectionList: FlatList,
  VirtualizedList: FlatList,
}
