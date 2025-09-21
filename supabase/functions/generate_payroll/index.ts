/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: any) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // needs service role for updates
  );

  let processedCount = 0;
  let errorCount = 0;
  const today = new Date().toISOString().split('T')[0]; // yyyy-mm-dd format
  const dayOfMonth = new Date().getDate();

  try {
    // 1. Get companies with live_payroll_enabled = true and matching payroll_generation_day
    const { data: companies, error: compErr } = await supabase
      .from("companies")
      .select("id, payroll_generation_day, fiscal_year_start, pay_frequency")
      .eq("live_payroll_enabled", true)
      .eq("payroll_generation_day", dayOfMonth);

    if (compErr) {
      console.error("Error fetching companies:", compErr);
      return new Response("Error fetching companies", { status: 500 });
    }

    if (!companies || companies.length === 0) {
      return new Response(`No companies scheduled for payroll generation on day ${dayOfMonth}`, { status: 200 });
    }

    console.log(`Processing payroll for ${companies.length} companies`);

    for (const company of companies) {
      console.log(`Processing payroll for company ${company.id}`);

      try {
        // 2. Get all employees for this company with their grade information
        const { data: employees, error: empErr } = await supabase
          .from("employees")
          .select(`
            id, 
            first_name, 
            last_name, 
            email,
            supervisor_id,
            grade_id,
            grades!inner(name, basic_salary)
          `)
          .eq("company_id", company.id)
          .eq("has_approval", true)
          .not("grade_id", "is", null);

        if (empErr) {
          console.error(`Error fetching employees for company ${company.id}:`, empErr);
          errorCount++;
          continue;
        }

        if (!employees || employees.length === 0) {
          console.log(`No eligible employees found for company ${company.id}`);
          continue;
        }

        console.log(`Found ${employees.length} eligible employees for company ${company.id}`);

        // 3. Generate payroll records for each employee
        const payrollRecords = employees.map((emp: any) => {
          const grade = emp.grades;
          const basicSalary = grade?.basic_salary || 0;

          return {
            employee_id: emp.id,
            grade_name: grade?.name || 'Unknown Grade',
            basic_salary: basicSalary,
            adjustments: [], // No adjustments by default
            total_amount: basicSalary,
            generation_date: today,
            company_id: company.id,
            status: 'Pending',
            supervisor_id: emp.supervisor_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        });

        // 4. Insert payroll records (use upsert to handle potential duplicates)
        const { data: insertedPayrolls, error: insertErr } = await supabase
          .from("payrolls")
          .upsert(payrollRecords, { 
            onConflict: 'employee_id,generation_date',
            ignoreDuplicates: false 
          })
          .select();

        if (insertErr) {
          console.error(`Error inserting payroll records for company ${company.id}:`, insertErr);
          errorCount++;
          continue;
        }

        processedCount += insertedPayrolls?.length || 0;
        console.log(`Successfully generated ${insertedPayrolls?.length || 0} payroll records for company ${company.id}`);

        // 5. Optional: Send notifications to employees about new payroll
        // This could be enhanced to use the notification system
        try {
          for (const payroll of insertedPayrolls || []) {
            // Create notification for employee about payroll generation
            await supabase
              .from("notifications")
              .insert({
                recipient_id: payroll.employee_id,
                title: "New Payroll Generated",
                message: `Your payroll for ${today} has been generated and is pending approval.`,
                context: "payroll",
                priority: "normal",
                company_id: company.id,
                reference_id: payroll.id,
                created_at: new Date().toISOString()
              });
          }
        } catch (notifErr) {
          console.log(`Notification creation failed for company ${company.id}:`, notifErr);
          // Don't fail the entire process for notification errors
        }

      } catch (companyErr) {
        console.error(`Error processing company ${company.id}:`, companyErr);
        errorCount++;
      }
    }

    const message = `Payroll generation completed. Processed: ${processedCount} records, Errors: ${errorCount}`;
    console.log(message);
    
    return new Response(message, { 
      status: errorCount > 0 ? 207 : 200, // 207 Multi-Status if there were some errors
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Fatal error in payroll generation:", error);
    return new Response(`Fatal error: ${error.message}`, { status: 500 });
  }
});