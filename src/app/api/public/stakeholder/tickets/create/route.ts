import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/public/stakeholder/tickets/create
 * 
 * Creates a new ticket from the public page after verifying stakeholder access.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      stakeholderId, 
      accessCode, 
      title, 
      description, 
      priority, 
      category_id, 
      subcategory_id 
    } = body

    if (!stakeholderId || !accessCode || !title || !priority) {
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

    // Verify the stakeholder access code and get company_id
    const { data: stakeholder, error: stakeholderError } = await supabase
      .from('stakeholders')
      .select(`
        id, 
        company_id, 
        name,
        kam_id,
        kam:employees!kam_id(id, first_name, last_name, email)
      `)
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

    // Create the ticket
    const { data: ticket, error: insertError } = await supabase
      .from('stakeholder_issues')
      .insert([
        {
          stakeholder_id: stakeholderId,
          title,
          description: description || null,
          status: 'Pending',
          priority,
          category_id: category_id || null,
          subcategory_id: subcategory_id || null,
          company_id: stakeholder.company_id,
          created_from_public_page: true,
          attachments: [],
        },
      ])
      .select()
      .single()

    if (insertError) {
      console.error('Ticket creation error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create ticket' },
        { status: 500 }
      )
    }

    // Create notification for KAM if assigned
    if (stakeholder.kam_id) {
      try {
        await supabase
          .from('notifications')
          .insert([
            {
              employee_id: stakeholder.kam_id,
              title: 'New Public Ticket',
              message: `${stakeholder.name} created a new ticket: ${title}`,
              type: 'stakeholder_issue',
              reference_id: ticket.id,
              action_url: `/stakeholder-issues/${ticket.id}`,
              company_id: stakeholder.company_id,
            },
          ])
      } catch (notificationError) {
        // Log but don't fail the ticket creation
        console.error('Failed to create notification:', notificationError)
      }
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('Ticket creation error:', error)
    return NextResponse.json(
      { error: 'An error occurred while creating ticket' },
      { status: 500 }
    )
  }
}
