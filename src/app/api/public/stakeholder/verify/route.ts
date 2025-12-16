import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/public/stakeholder/verify
 * 
 * Verifies stakeholder access using company identifier, stakeholder name, and access code.
 * Returns stakeholder data if verification is successful.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyIdentifier, stakeholderName, accessCode } = body

    if (!companyIdentifier || !stakeholderName || !accessCode) {
      return NextResponse.json(
        { valid: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    let supabase;
    try {
      supabase = createAdminClient()
    } catch (err) {
      console.error('Admin client creation failed:', err)
      return NextResponse.json(
        { valid: false, error: 'Server configuration error. Please contact support.' },
        { status: 500 }
      )
    }

    // Find the company by name or code
    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .select('id, name, code')
      .or(`name.ilike.%${companyIdentifier}%,code.ilike.%${companyIdentifier}%`)
      .limit(1)

    if (companyError) {
      console.error('Company lookup error:', companyError)
      return NextResponse.json(
        { valid: false, error: 'Failed to verify company' },
        { status: 500 }
      )
    }

    if (!companies || companies.length === 0) {
      return NextResponse.json(
        { valid: false, error: 'Company not found. Please check the company name.' },
        { status: 404 }
      )
    }

    const company = companies[0]

    // Verify stakeholder with access code
    const { data: stakeholder, error: stakeholderError } = await supabase
      .from('stakeholders')
      .select(`
        *,
        stakeholder_type:stakeholder_types(id, name),
        kam:employees!kam_id(id, first_name, last_name, email)
      `)
      .eq('company_id', company.id)
      .ilike('name', `%${stakeholderName}%`)
      .eq('access_code', accessCode.toUpperCase())
      .eq('is_active', true)
      .single()

    if (stakeholderError) {
      if (stakeholderError.code === 'PGRST116') {
        return NextResponse.json(
          { valid: false, error: 'Invalid stakeholder name or access code. Please check and try again.' },
          { status: 401 }
        )
      }
      console.error('Stakeholder lookup error:', stakeholderError)
      return NextResponse.json(
        { valid: false, error: 'Failed to verify stakeholder' },
        { status: 500 }
      )
    }

    // Transform KAM data
    const transformedStakeholder = {
      ...stakeholder,
      kam: stakeholder.kam ? {
        id: stakeholder.kam.id,
        name: `${stakeholder.kam.first_name} ${stakeholder.kam.last_name}`,
        email: stakeholder.kam.email,
      } : undefined,
    }

    return NextResponse.json({
      valid: true,
      stakeholder: transformedStakeholder,
    })
  } catch (error) {
    console.error('Stakeholder verification error:', error)
    return NextResponse.json(
      { valid: false, error: 'An error occurred while verifying access' },
      { status: 500 }
    )
  }
}
