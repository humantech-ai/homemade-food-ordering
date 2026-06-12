import React from 'react';
import { ActivityLog } from '../types';
import { Clock, ShieldAlert, User, Database } from 'lucide-react';

interface AdminLogsProps {
  logs: ActivityLog[];
}

export const AdminLogs: React.FC<AdminLogsProps> = ({ logs }) => {
  return (
    <div className="bg-white rounded-3xl border border-gray-150 p-6 md:p-8 shadow-sm text-left max-w-4xl mx-auto space-y-6">
      
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h4 className="font-sans font-bold text-base text-gray-950 flex items-center gap-1.5">
            <Database className="w-5 h-5 text-amber-500" />
            <span>Auditable Activity Logs</span>
          </h4>
          <p className="text-xs text-gray-450 mt-0.5">Real-time trails of menu additions, pricing edits, and order status transitions.</p>
        </div>
        <span className="text-[10px] bg-red-100 border border-red-200 text-red-800 px-2.5 py-1 rounded-full font-extrabold uppercase">Read-Only</span>
      </div>

      <div className="space-y-4">
        {logs.length === 0 ? (
          <div className="text-center p-8 text-gray-400 text-xs">
            No audit logs registered yet. Admin modifications will trigger activity entries.
          </div>
        ) : (
          <div className="relative border-l border-gray-200 pl-4 sm:pl-6 space-y-6 text-xs text-gray-600">
            {logs.map((log) => (
              <div key={log.id} className="relative space-y-1.5">
                
                {/* Connect Dots */}
                <div className="absolute -left-[21px] sm:-left-[29px] top-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-white ring-4 ring-amber-50" />

                <div className="flex items-center justify-between gap-4 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1.5 font-bold text-gray-700">
                    <User className="w-3.5 h-3.5" />
                    <span>{log.adminEmail}</span>
                  </span>
                  <span className="flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {new Date(log.createdAt).toLocaleString('bn-BD', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </span>
                  </span>
                </div>

                <p className="font-sans font-bold text-gray-900 text-xs md:text-sm leading-snug">
                  {log.action}
                </p>

                {log.details && (
                  <pre className="bg-gray-50 border border-gray-150 p-2.5 rounded-xl font-mono text-[10px] text-gray-540 overflow-x-auto whitespace-pre-wrap select-all">
                    {log.details}
                  </pre>
                )}

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
