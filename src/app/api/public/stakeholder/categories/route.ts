import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/public/stakeholder/categories
 * 
 * Fetches issue categories for a company after verifying stakeholder access.
 * Requires company identifier and access code for verification.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyIdentifier, stakeholderName, accessCode } = body

    if (!companyIdentifier || !stakeholderName || !accessCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    let supabase;
    try {
      supabase = createAdminClient()
    } catch (err) {
      console.error('Admin client creation failed:', err)
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Find the company by name or code
    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .or(`name.ilike.%${companyIdentifier}%,code.ilike.%${companyIdentifier}%`)
      .limit(1)

    if (companyError || !companies || companies.length === 0) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    const companyId = companies[0].id

    // Verify the stakeholder access code before returning categories
    const { data: stakeholder, error: stakeholderError } = await supabase
      .from('stakeholders')
      .select('id')
      .eq('company_id', companyId)
      .ilike('name', `%${stakeholderName}%`)
      .eq('access_code', accessCode.toUpperCase())
      .eq('is_active', true)
      .single()

    if (stakeholderError || !stakeholder) {
      return NextResponse.json(
        { error: 'Invalid access code' },
        { status: 401 }
      )
    }

    // Fetch active categories with their subcategories
    const { data: categories, error: fetchError } = await supabase
      .from('stakeholder_issue_categories')
      .select(`
        *,
        subcategories:stakeholder_issue_subcategories(*)
      `)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('name')

    if (fetchError) {
      console.error('Categories fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      )
    }

    // Filter to only include active subcategories
    const categoriesWithActiveSubcategories = (categories || []).map(category => ({
      ...category,
      subcategories: category.subcategories?.filter((sub: any) => sub.is_active) || []
    }))

    return NextResponse.json({ categories: categoriesWithActiveSubcategories })
  } catch (error) {
    console.error('Categories fetch error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching categories' },
      { status: 500 }
    )
  }
}
