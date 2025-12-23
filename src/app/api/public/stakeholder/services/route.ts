import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/public/stakeholder/services
 * 
 * Fetches services for a stakeholder after verifying access code.
 * Returns active services that the stakeholder can view.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { stakeholderId, accessCode } = body

    // Validate input
    if (!stakeholderId || !accessCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (typeof stakeholderId !== 'number' || !Number.isInteger(stakeholderId) || stakeholderId <= 0) {
      return NextResponse.json(
        { error: 'Invalid stakeholder ID format' },
        { status: 400 }
      )
    }

    if (typeof accessCode !== 'string' || accessCode.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid access code format' },
        { status: 400 }
      )
    }

    let supabase;
    try {
      supabase = createAdminClient()
    } catch (err) {
      console.error('Admin client creation failed:', err)
      return NextResponse.json(
        { error: 'Server configuration error. Please contact support.' },
        { status: 500 }
      )
    }

    // Verify stakeholder with access code
    const { data: stakeholder, error: stakeholderError } = await supabase
      .from('stakeholders')
      .select('id, company_id, has_public_access')
      .eq('id', stakeholderId)
      .eq('access_code', accessCode.toUpperCase())
      .eq('is_active', true)
      .single()

    if (stakeholderError || !stakeholder) {
      return NextResponse.json(
        { error: 'Invalid access code or stakeholder not found' },
        { status: 401 }
      )
    }

    // Fetch services for this stakeholder
    // Only select fields that should be visible to stakeholders
    const { data: services, error: servicesError } = await supabase
      .from('stakeholder_services')
      .select(`
        id,
        service_name,
        description,
        direction,
        service_type,
        currency,
        status,
        start_date,
        end_date,
        billing_cycle_type,
        next_billing_date,
        line_items:stakeholder_service_line_items(
          id,
          description,
          quantity,
          unit_price,
          amount
        )
      `)
      .eq('stakeholder_id', stakeholderId)
      .in('status', ['active', 'paused']) // Only show active/paused services
      .order('created_at', { ascending: false })

    if (servicesError) {
      console.error('Services fetch error:', servicesError)
      return NextResponse.json(
        { error: 'Failed to fetch services' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      services: services || [],
    })
  } catch (error) {
    console.error('Fetch services error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching services' },
      { status: 500 }
    )
  }
}
