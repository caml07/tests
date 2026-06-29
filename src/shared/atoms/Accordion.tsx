import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'

interface AccordionProps {
  expanded: boolean
  duration?: number
  children: React.ReactNode
}

export function Accordion({ expanded, duration = 200, children }: AccordionProps) {
  return (
    <Animated.View layout={LinearTransition.duration(duration)}>
      {expanded && (
        <Animated.View entering={FadeIn.duration(duration)} exiting={FadeOut.duration(duration)}>
          {children}
        </Animated.View>
      )}
    </Animated.View>
  )
}
