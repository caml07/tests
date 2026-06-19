import { describe, it, expect } from 'vitest'
import { loginSchema } from '@/src/utils/validation'

describe('loginSchema', () => {
  it('valida usuario y password correctos', () => {
    const result = loginSchema.safeParse({ usuario: 'andrea', password: '1234' })
    expect(result.success).toBe(true)
  })

  it('rechaza usuario vacío', () => {
    const result = loginSchema.safeParse({ usuario: '', password: '1234' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('usuario')
    }
  })

  it('rechaza password vacío', () => {
    const result = loginSchema.safeParse({ usuario: 'andrea', password: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('password')
    }
  })

  it('rechaza ambos vacíos', () => {
    const result = loginSchema.safeParse({ usuario: '', password: '' })
    expect(result.success).toBe(false)
  })
})
