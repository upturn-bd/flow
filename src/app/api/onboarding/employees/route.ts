import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/onboarding/employees
 * 
 * Fetches employees and departments for a company during onboarding.
 * Uses admin client to bypass RLS since new users don't have employee records yet.
 * Supports search query for filtering employees.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get('companyId')
    const search = searchParams.get('search') || ''
    const includeDepartments = searchParams.get('includeDepartments') === 'true'

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
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

    // Build query for employees
    let employeesQuery = supabase
      .from('employees')
      .select('id, first_name, last_name, email, designation')
      .eq('company_id', parseInt(companyId))
      .eq('has_approval', 'ACCEPTED')
      .order('first_name', { ascending: true })

    // Apply search filter if provided
    if (search.trim()) {
      const searchTerm = `%${search.trim()}%`
      employeesQuery = employeesQuery.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},designation.ilike.${searchTerm}`)
    }

    // Limit results for performance
    employeesQuery = employeesQuery.limit(50)

    const { data: employees, error: employeesError } = await employeesQuery

    if (employeesError) {
      console.error('Employees lookup error:', employeesError)
      return NextResponse.json(
        { error: 'Failed to fetch employees' },
        { status: 500 }
      )
    }

    // Transform to match Employee interface expected by components
    const transformedEmployees = (employees || []).map(emp => ({
      id: emp.id,
      name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
      email: emp.email,
      designation: emp.designation,
    }))

    // Optionally fetch departments
    let departments: { id: number; name: string }[] = []
    if (includeDepartments) {
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('id, name')
        .eq('company_id', parseInt(companyId))
        .order('name', { ascending: true })

      if (deptError) {
        console.error('Departments lookup error:', deptError)
        // Don't fail the whole request, just return empty departments
      } else {
        departments = deptData || []
      }
    }

    return NextResponse.json({
      employees: transformedEmployees,
      ...(includeDepartments && { departments }),
    })
  } catch (error) {
    console.error('Error fetching onboarding data:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
