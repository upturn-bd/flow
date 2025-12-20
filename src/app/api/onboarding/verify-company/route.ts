import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/onboarding/verify-company
 * 
 * Verifies a company code during onboarding.
 * Uses admin client to bypass RLS since new users don't have employee records yet.
 * Returns company ID and name if verification is successful.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { isValid: false, error: 'Company code is required' },
        { status: 400 }
      )
    }

    let supabase;
    try {
      supabase = createAdminClient()
    } catch (err) {
      console.error('Admin client creation failed:', err)
      return NextResponse.json(
        { isValid: false, error: 'Server configuration error. Please contact support.' },
        { status: 500 }
      )
    }

    // Find the company by code
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('code', code)
      .single()

    if (companyError && companyError.code !== 'PGRST116') {
      console.error('Company lookup error:', companyError)
      return NextResponse.json(
        { isValid: false, error: 'Failed to verify company code' },
        { status: 500 }
      )
    }

    if (!company) {
      return NextResponse.json(
        { isValid: false, id: null, name: null, error: 'Invalid company code' },
        { status: 200 }
      )
    }

    return NextResponse.json({
      isValid: true,
      id: company.id,
      name: company.name,
    })
  } catch (error) {
    console.error('Error verifying company code:', error)
    return NextResponse.json(
      { isValid: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
