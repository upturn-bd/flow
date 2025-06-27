import { useNewsAndNoticesTypes } from "@/hooks/useNewsAndNotices";
import { Notice } from "@/hooks/useNotice";
import { useDepartments } from "@/hooks/useDepartments";
import { createClient } from '@/lib/supabase/client';
import { getCompanyId } from "@/lib/api";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Bell, 
  ChevronLeft, 
  Loader2, 
  XCircle, 
  Calendar,
  Info,
  MessageCircle,
  Building2
} from "lucide-react";
import { toast } from "sonner";

interface NoticeDetailsProps {
  id: number;
  onClose: () => void;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "N/A";
  
  const [year, month, dayStr] = dateStr.split("-");
  const day = parseInt(dayStr, 10);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const monthName = months[parseInt(month, 10) - 1];

  return `${day} ${monthName}, ${year}`;
}

export default function NoticeDetails({ id, onClose }: NoticeDetailsProps) {
  const [noticeDetails, setNoticeDetails] = useState<Notice | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { departments } = useDepartments();
  const { newsAndNoticeTypes } = useNewsAndNoticesTypes();
  const [departmentName, setDepartmentName] = useState<string | null>(null);
  const [noticeTypeName, setNoticeTypeName] = useState<string | null>(null);

  async function fetchNoticeDetails(id: number) {
    setLoading(true);
    const client = createClient();
    const company_id = await getCompanyId();

    try {
      const { data, error } = await client
        .from("notice_records")
        .select("*")
        .eq("id", id)
        .eq("company_id", company_id)
        .single();

      if (error) {
        setError("Error fetching notice details");
        toast.error("Error fetching notice details");
        console.error(error);
        return;
      }

      setNoticeDetails(data);

      // Get department name
      const department = departments.find(d => d.id === data.department_id);
      setDepartmentName(department?.name || "N/A");

      // Get notice type name
      const noticeType = newsAndNoticeTypes.find(t => t.id === data.notice_type_id);
      setNoticeTypeName(noticeType?.name || "N/A");

    } catch (error) {
      setError("Error fetching notice details");
      toast.error("Error fetching notice details");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id !== null) {
      fetchNoticeDetails(id);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 text-amber-500 animate-spin mb-2" />
        <p className="text-gray-500">Loading notice details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <XCircle className="h-12 w-12 text-red-500 mb-2" />
        <p className="text-red-500 font-medium">{error}</p>
        <button
          onClick={onClose}
          className="mt-4 flex items-center gap-2 text-amber-600 hover:text-amber-800"
        >
          <ChevronLeft size={16} />
          <span>Go back</span>
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="md:max-w-4xl mx-auto p-6 md:p-10 bg-white rounded-lg shadow-sm border border-gray-200"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-amber-700">
          Notice Details
        </h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
        >
          <ChevronLeft size={16} />
          <span>Back</span>
        </motion.button>
      </div>

      <div className="bg-amber-50 rounded-lg p-5 mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{noticeDetails?.title || "N/A"}</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${
              noticeDetails?.urgency === 'High' 
                ? 'bg-red-100 text-red-800' 
                : noticeDetails?.urgency === 'Medium'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {noticeDetails?.urgency || "N/A"}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className="font-medium">Notice Type:</span>
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-xs">
              {noticeTypeName}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className="font-medium">Department:</span>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs">
              {departmentName}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
          <Calendar size={18} className="text-amber-500" />
          <div>
            <p className="text-xs text-gray-500">Valid From</p>
            <p className="font-medium">{formatDate(noticeDetails?.valid_from || "")}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
          <Calendar size={18} className="text-amber-500" />
          <div>
            <p className="text-xs text-gray-500">Valid Till</p>
            <p className="font-medium">{formatDate(noticeDetails?.valid_till || "")}</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-700 mb-2">Description</h3>
        <div className="bg-gray-50 p-4 rounded-lg text-gray-700">
          {noticeDetails?.description || "No description provided."}
        </div>
      </div>
    </motion.div>
  );
} 