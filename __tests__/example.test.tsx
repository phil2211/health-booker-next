import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

describe('Home Page', () => {
  it('renders the heading', () => {
    render(<Home />)
    const heading = screen.getByText(/Health Worker Booking System/i)
    expect(heading).toBeInTheDocument()
  })

  it('renders the book appointment link', () => {
    render(<Home />)
    const link = screen.getByText(/Book Appointment/i)
    expect(link).toBeInTheDocument()
  })
})

