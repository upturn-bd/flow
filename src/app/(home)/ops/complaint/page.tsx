"use client";
import ComplaintCreatePage from "@/components/ops/complaint/ComplaintCreatePage";
import ComplaintHistoryPage from "@/components/ops/complaint/ComplaintHistory";
import ComplaintRequestsPage from "@/components/ops/complaint/ComplaintRequests";
import ServicePageTemplate from "@/components/ui/ServicePageTemplate";
import { TabItem } from "@/components/ui/TabView";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  History,
  BookOpen,
  FilePlus,
  ClipboardCheck,
  AlertTriangle
} from "lucide-react";


export default function ComplaintPage() {
  const [activeTab, setActiveTab] = useState("home");

  const tabs: TabItem[] = [
    {
      key: "home",
      label: "New Complaint",
      icon: <FilePlus className="h-5 w-5" />,
      color: "text-red-600",
      content: <ComplaintCreatePage onClose={() => { }} setActiveTab={setActiveTab} />
    },
    {
      key: "history",
      label: "History",
      icon: <History className="h-5 w-5" />,
      color: "text-blue-600",
      content: <ComplaintHistoryPage />
    },
        {
      key: "requests",
      label: "Requests",
      icon: <ClipboardCheck className="h-5 w-5" />,
      color: "text-amber-600",
      content: <ComplaintRequestsPage />
    },
    {
      key: "policy",
      label: "Policy",
      icon: <BookOpen className="h-5 w-5" />,
      color: "text-purple-600",
      content: (
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
            Complaint Policy
          </h2>
          <div className="prose prose-red max-w-none">
            <p className="text-gray-600">
              Our complaint policy is designed to ensure that all employee concerns are addressed promptly and fairly. Please review the guidelines below before submitting a complaint.
            </p>
            <h3 className="text-lg font-semibold text-gray-700 mt-4">Submission Guidelines</h3>
            <ul className="mt-2 space-y-1 text-gray-600">
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                All complaints must be factual and include specific details about the incident.
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                Submit complaints within 7 days of the incident for prompt resolution.
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                Maintain confidentiality regarding the complaint and involved parties.
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                Follow up through the appropriate channels as directed.
              </li>
            </ul>
            <h3 className="text-lg font-semibold text-gray-700 mt-4">Resolution Process</h3>
            <ol className="mt-2 space-y-2 text-gray-600">
              <li className="flex items-start">
                <span className="bg-red-100 text-red-700 rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">1</span>
                <div>
                  <span className="font-medium">Initial Review (1-2 days):</span> Your complaint will be reviewed by HR and relevant department heads.
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-red-100 text-red-700 rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">2</span>
                <div>
                  <span className="font-medium">Investigation (3-5 days):</span> Evidence will be gathered and interviews conducted as needed.
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-red-100 text-red-700 rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">3</span>
                <div>
                  <span className="font-medium">Decision (2-3 days):</span> A resolution will be determined based on the investigation findings.
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-red-100 text-red-700 rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">4</span>
                <div>
                  <span className="font-medium">Implementation:</span> The resolution will be implemented and all parties will be notified.
                </div>
              </li>
            </ol>
          </div>
        </div>
      )
    },
  ];


  return (
    <ServicePageTemplate
      title="Complaint Management"
      description="Submit, track, and manage workplace complaints and concerns. Our system ensures all issues are addressed promptly and fairly."
      icon={<AlertCircle className="h-6 w-6" />}
      primaryColor="text-red-600"
      tabs={tabs}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      actionButtonLabel="New Complaint"
      actionButtonIcon={<FilePlus className="h-4 w-4" />}
      actionButtonOnClick={() => setActiveTab("home")}
    />
  );
}
