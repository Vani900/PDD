import React from 'react'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, it, expect } from '@jest/globals'
import { Navbar } from '../components/layout/Navbar'
import { Providers } from '../components/layout/Providers'

describe('Navbar Component', () => {
  it('renders CharityAI brand logo', () => {
    const { getByText } = render(
      <Providers>
        <Navbar />
      </Providers>
    )
    expect(getByText('CharityAI')).toBeDefined()
  })
})
