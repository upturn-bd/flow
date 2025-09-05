"use client";

import { supabase } from "@/lib/supabase/client";
import { getEmployeeInfo } from "@/lib/utils/auth";
import { useState, useRef, useEffect } from "react";
import { FaEllipsisV } from "react-icons/fa";

const ClickableStatusCell = ({
    tag, id }: {
        tag: string;
        id: number;
    }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
    const [status, setStatus] = useState(tag);

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
            const notification = document.createElement('div');
            notification.className = 'fixed bottom-4 right-4 bg-green-100 text-green-800 px-4 py-3 rounded-lg shadow-lg z-50 animate-fade-in-up';
            notification.innerHTML = 'Request sent successfully';
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.classList.add('animate-fade-out');
                setTimeout(() => document.body.removeChild(notification), 500);
            }, 3000);
            setStatus("Pending");
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
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-orange-100 text-orange-800"
                    }`}
            >
                {status.replace("_", " ")}
            </span>

            {status !== "Pending" && (
                <button
                    ref={buttonRef}
                    onClick={toggleMenu}
                    className="ml-2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100 focus:outline-none"
                    aria-label="Toggle menu"
                >
                    <FaEllipsisV className="text-sm" />
                </button>
            )}



            {isMenuOpen && (
                <div
                    ref={dropdownRef}
                    className="fixed z-50 bg-white border shadow-lg rounded-md py-1 w-40"
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
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
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

