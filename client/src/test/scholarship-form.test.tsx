import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ScholarshipFormDialog } from '@/components/admin/ScholarshipManager'

describe('scholarship admin form', () => {
  it('renders supported scholarship fields and submit action', () => {
    render(<ScholarshipFormDialog editing="new" value={{ name: '', amount: 0, minimum_gpa: null, minimum_test_score: null, eligibility_description: null, is_active: true }} saving={false} setValue={vi.fn()} onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByText('Amount')).toBeInTheDocument()
    expect(screen.getByText('Minimum GPA')).toBeInTheDocument()
    expect(screen.getByText('Minimum test score')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save scholarship' })).toBeInTheDocument()
  })
})
