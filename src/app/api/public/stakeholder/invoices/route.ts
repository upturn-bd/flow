import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/public/stakeholder/invoices
 * 
 * Fetches invoices for a stakeholder after verifying access code.
 * Returns invoices with line items for outgoing services.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { stakeholderId, accessCode, serviceId } = body

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

    // Build invoice query
    let query = supabase
      .from('stakeholder_service_invoices')
      .select(`
        id,
        invoice_number,
        billing_period_start,
        billing_period_end,
        currency,
        subtotal,
        tax_rate,
        tax_amount,
        total_amount,
        invoice_date,
        due_date,
        status,
        paid_amount,
        paid_date,
        notes,
        pdf_url,
        service:stakeholder_services(
          id,
          service_name,
          direction
        ),
        line_items:stakeholder_invoice_line_items(
          id,
          description,
          quantity,
          unit_price,
          amount
        )
      `)
      .eq('stakeholder_id', stakeholderId)
      .not('status', 'eq', 'draft') // Don't show draft invoices to stakeholders
      .order('invoice_date', { ascending: false })

    // Optional: filter by service
    if (serviceId && typeof serviceId === 'number') {
      query = query.eq('service_id', serviceId)
    }

    const { data: invoices, error: invoicesError } = await query

    if (invoicesError) {
      console.error('Invoices fetch error:', invoicesError)
      return NextResponse.json(
        { error: 'Failed to fetch invoices' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      invoices: invoices || [],
    })
  } catch (error) {
    console.error('Fetch invoices error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching invoices' },
      { status: 500 }
    )
  }
}
