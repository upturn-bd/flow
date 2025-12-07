"use client";

import SuccessToast from "@/components/ui/SuccessToast";
import { useNotifications } from "@/hooks/useNotifications";
import { supabase } from "@/lib/supabase/client";
import { getEmployeeInfo } from "@/lib/utils/auth";
import { useState, useRef, useEffect } from "react";
import { DotsThree } from "@phosphor-icons/react";

const ClickableStatusCell = ({
    tag, id }: {
        tag: string;
        id: number;
    }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
    const [status, setStatus] = useState(tag);
    const { createNotification } = useNotifications();
    const [showSuccess, setShowSuccess] = useState(false);

    async function handleRequest() {
        console.log("Request sent for", id);

        const user = await getEmployeeInfo();
        try {
            const { error } = await supabase
                .from("attendance_records")
                .update({ tag: "Pending" })
                .eq("employee_id", user.id)
                .eq("company_id", user.company_id)
                .eq("id", id);

            if (error) throw error;

            // Show success notification
            SuccessToast({ message: "Attendance update request sent successfully." });
            setStatus("Pending");

            const recipients = [user.supervisor_id].filter(Boolean) as string[];
            createNotification({
                title: "Attendance Update Requested",
                message: `An attendance update has been requested by ${user.name}.`,
                priority: 'normal',
                type_id: 5,
                recipient_id: recipients,
                action_url: '/ops/attendance',
                company_id: user.company_id,
                department_id: user.department_id
            });


            // Refresh attendance data
        } catch (error) {
            console.error("Error updating attendance data:", error);
        }
    }

    // Close menu when clicking outside
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


    const toggleMenu = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setMenuPosition({ top: rect.bottom + window.scrollY, right: window.innerWidth - rect.right });
            setIsMenuOpen(!isMenuOpen);
        }
    };

    return (
        <div className="flex items-center justify-between w-full">
            <span
                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${tag === "Late"
                    ? "bg-warning/10 text-warning dark:bg-warning/20"
                    : "bg-warning/10 text-warning dark:bg-warning/20"
                    }`}
            >
                {status.replace("_", " ")}
            </span>

            {status !== "Pending" && (
                <button
                    ref={buttonRef}
                    onClick={toggleMenu}
                    className="ml-2 text-foreground-tertiary hover:text-foreground-secondary transition-colors p-1 rounded-full hover:bg-background-tertiary dark:bg-surface-secondary focus:outline-none"
                    aria-label="Toggle menu"
                >
                    <DotsThree className="text-sm" />
                </button>
            )}



            {isMenuOpen && (
                <div
                    ref={dropdownRef}
                    className="fixed z-50 bg-surface-primary border shadow-lg rounded-md py-1 w-40"
                    style={{
                        top: menuPosition.top,
                        right: menuPosition.right,
                    }}
                >
                    <button
                        onClick={async () => {
                            await handleRequest();
                            setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-foreground-secondary hover:bg-background-tertiary dark:bg-surface-secondary transition-colors flex items-center gap-2"
                    >
                        Send to Request
                    </button>
                </div>
            )}

        </div>
    );
};

export default ClickableStatusCell;
function fetchAttendanceData() {
    throw new Error("Function not implemented.");
}

