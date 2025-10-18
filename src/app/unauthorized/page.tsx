import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <ShieldAlert className="w-10 h-10 text-red-600" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            Access Denied
          </h1>
          
          <p className="text-slate-600 mb-6">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          
          <div className="space-y-3">
            <Link
              href="/home"
              className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Go to Home
            </Link>
            
            <Link
              href="/profile"
              className="block w-full py-3 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition-colors"
            >
              Go to Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
