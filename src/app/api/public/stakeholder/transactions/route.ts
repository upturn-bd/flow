import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/public/stakeholder/transactions
 * 
 * Fetches transactions for a stakeholder using verified access code.
 * Returns transaction list if verification is successful.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { stakeholderId, accessCode } = body

    // Validate input types and formats
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
      .select('id, access_code')
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

    // Fetch transactions for this stakeholder
    // Only select fields that should be visible to stakeholders
    const { data: transactions, error: transactionsError } = await supabase
      .from('accounts')
      .select('id, title, transaction_date, amount, currency, status, method, from_source')
      .eq('stakeholder_id', stakeholderId)
      .order('transaction_date', { ascending: false })

    if (transactionsError) {
      console.error('Transactions fetch error:', transactionsError)
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      transactions: transactions || [],
    })
  } catch (error) {
    console.error('Fetch transactions error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching transactions' },
      { status: 500 }
    )
  }
}
