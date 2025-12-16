import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/public/stakeholder/tickets
 * 
 * Fetches tickets for a stakeholder after verifying access.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { stakeholderId, accessCode } = body

    if (!stakeholderId || !accessCode) {
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

    // Verify the stakeholder access code
    const { data: stakeholder, error: stakeholderError } = await supabase
      .from('stakeholders')
      .select('id, company_id')
      .eq('id', stakeholderId)
      .eq('access_code', accessCode.toUpperCase())
      .eq('is_active', true)
      .single()

    if (stakeholderError || !stakeholder) {
      return NextResponse.json(
        { error: 'Invalid access' },
        { status: 401 }
      )
    }

    // Fetch tickets for this stakeholder
    const { data: tickets, error: fetchError } = await supabase
      .from('stakeholder_issues')
      .select(`
        *,
        category:stakeholder_issue_categories(id, name, color),
        subcategory:stakeholder_issue_subcategories(id, name)
      `)
      .eq('stakeholder_id', stakeholderId)
      .eq('created_from_public_page', true)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Tickets fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch tickets' },
        { status: 500 }
      )
    }

    return NextResponse.json({ tickets: tickets || [] })
  } catch (error) {
    console.error('Tickets fetch error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching tickets' },
      { status: 500 }
    )
  }
}
