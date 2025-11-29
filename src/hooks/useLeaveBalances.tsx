import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface LeaveBalance {
  id?: number;
  employee_id: string;
  type_id: number;
  balance: number;
  leave_type_name?: string;
  color?: string;
}

export function useLeaveBalances(employeeId?: number, companyId?: number) {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employeeId || !companyId) return;

    const fetchOrCreateBalances = async () => {
      const supabase = createClient();
      setLoading(true);

      // Get all leave types for the company
      const { data: leaveTypes, error: typesError } = await supabase
        .from("leave_types")
        .select("*")
        .eq("company_id", companyId);

      if (typesError) {
        console.error("Error fetching leave types:", typesError);
        setLoading(false);
        return;
      }

      // Get existing balances for the employee
      const { data: existingBalances, error: balancesError } = await supabase
        .from("leave_balances")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("company_id", companyId);

      if (balancesError) {
        console.error("Error fetching leave balances:", balancesError);
        setLoading(false);
        return;
      }

      const updatedBalances: LeaveBalance[] = [];

      for (const type of leaveTypes || []) {
        // Check if balance exists
        let balance = existingBalances?.find(b => b.type_id === type.id);
        if (!balance) {
          // Create balance if missing
          const { data: newBalance, error: insertError } = await supabase
            .from("leave_balances")
            .insert({
              employee_id: employeeId,
              type_id: type.id,
              balance: type.annual_quota,
              company_id: companyId,
            })
            .select()
            .single();

          if (insertError) {
            console.error("Error creating leave balance:", insertError);
            continue;
          }

          balance = newBalance;
        }

        updatedBalances.push({
          ...balance,
          leave_type_name: type.name,
          color: type.color || "bg-background-tertiary border-border-secondary text-foreground-primary",
        });
      }

      setBalances(updatedBalances);
      setLoading(false);
    };

    fetchOrCreateBalances();
  }, [employeeId, companyId]);


  // 🔹 Function to update a balance
  const updateBalance = useCallback(
    async (typeId: number, newBalance: number) => {
      if (!employeeId || !companyId) return { success: false };

      try {
        const supabase = createClient();

        const { error } = await supabase
          .from("leave_balances")
          .update({ balance: newBalance })
          .eq("employee_id", employeeId)
          .eq("company_id", companyId)
          .eq("type_id", typeId);

        if (error) {
          console.error("Error updating leave balance:", error);
          return { success: false, error };
        }

        // Update local state too
        setBalances((prev) =>
          prev.map((b) =>
            b.type_id === typeId ? { ...b, balance: newBalance } : b
          )
        );

        return { success: true };
      } catch (err) {
        console.error("Unexpected error updating leave balance:", err);
        return { success: false, error: err };
      }
    },
    [employeeId, companyId]
  );

  const reduceBalance = async (
    employeeId: string,
    typeId: number,
    amount: number
  ) => {
    const supabase = createClient();

    // Get current balance
    const { data: balanceRow, error: fetchError } = await supabase
      .from("leave_balances")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("type_id", typeId)
      .single();

    if (fetchError) {
      console.error("Error fetching balance:", fetchError);
      return;
    }

    const newBalance = balanceRow.balance - amount;
    console.log(amount)

    const { error: updateError } = await supabase
      .from("leave_balances")
      .update({ balance: newBalance })
      .eq("id", balanceRow.id);

    if (updateError) {
      console.error("Error updating balance:", updateError);
      return;
    }

    // Update local state
    setBalances(prev =>
      prev.map(b =>
        b.type_id === typeId && b.employee_id === employeeId
          ? { ...b, balance: newBalance }
          : b
      )
    );
  };

  return { balances, loading, updateBalance, reduceBalance };
}
