import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, userEvent } from '@testing-library/react-native'
import { Button } from './Button'

afterEach(() => {
  vi.useRealTimers()
})

describe('Button', () => {
  it('renders the title', async () => {
    await render(<Button title="Ingresar" onPress={() => {}} />)
    expect(screen.getByText('Ingresar')).toBeOnTheScreen()
  })

  it('calls onPress when pressed', async () => {
    const onPress = vi.fn()
    await render(<Button title="Ingresar" onPress={onPress} />)
    const user = userEvent.setup()
    const button = screen.getByRole('button')
    await user.press(button)
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does not call onPress when disabled', async () => {
    const onPress = vi.fn()
    await render(<Button title="Ingresar" onPress={onPress} disabled />)
    const user = userEvent.setup()
    const button = screen.getByRole('button', { name: 'Ingresar' })
    await user.press(button)
    expect(onPress).not.toHaveBeenCalled()
  })

  it('shows loading indicator instead of title when loading', async () => {
    await render(<Button title="Ingresar" onPress={() => {}} loading />)
    expect(screen.queryByText('Ingresar')).not.toBeOnTheScreen()
  })
})
