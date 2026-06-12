import React, { useState } from 'react';
import { Admin, AdminRole, ActivityType } from '../types';
import { ShieldCheck, Plus, RefreshCw, Key, Mail, Check, X, ShieldAlert, BadgeCheck, Loader2 } from 'lucide-react';

interface AdminPermissionsProps {
  admins: Admin[];
  currentAdminEmail: string;
  onAddAdmin: (uid: string, email: string, role: AdminRole, permissions: ActivityType[]) => void;
  onUpdateAdminPermissions: (uid: string, permissions: ActivityType[]) => void;
  onUpdateAdminRole: (uid: string, role: AdminRole) => void;
  onDeleteAdmin: (uid: string) => void;
  isSuperAdmin: boolean;
}

export const AdminPermissions: React.FC<AdminPermissionsProps> = ({
  admins,
  currentAdminEmail,
  onAddAdmin,
  onUpdateAdminPermissions,
  onUpdateAdminRole,
  onDeleteAdmin,
  isSuperAdmin
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('operator');
  const [newPermissions, setNewPermissions] = useState<ActivityType[]>(['manage_orders']);

  const permissionOptions: { value: ActivityType; labelBn: string; labelEn: string; desc: string }[] = [
    { value: 'manage_menu', labelBn: 'মেনু তালিকা ও মূল্য নির্ধারণ', labelEn: 'Manage Menu Items', desc: 'Can create, edit, change prices and delete recipes' },
    { value: 'manage_categories', labelBn: 'খাদ্য ক্যাটাগরি তৈরি ও ডিলিট', labelEn: 'Manage Categories', desc: 'Can handle food categorizations and soft deletes' },
    { value: 'manage_orders', labelBn: 'অর্ডার অর্ডার ও অনাহুত ক্যানসেল', labelEn: 'Manage Orders', desc: 'Can process customer orders, update statuses, accept/hold/cancel' },
    { value: 'manage_site_config', labelBn: 'বিকাশ নম্বর ও ডেলিভারি রেট', labelEn: 'Manage Configurations', desc: 'Can modify bKash payment data & global delivery costs' },
    { value: 'view_audit_logs', labelBn: 'অডিট লগ পর্যবেক্ষণ', labelEn: 'View Central Logs', desc: 'Can access and monitor the central auditable activity logs dashboard' }
  ];

  const handleTogglePermission = (uid: string, permission: ActivityType, currentPerms: ActivityType[]) => {
    if (!isSuperAdmin) {
      alert('Only the super admin has authority to modify personnel permissions.');
      return;
    }
    const updated = currentPerms.includes(permission)
      ? currentPerms.filter(p => p !== permission)
      : [...currentPerms, permission];
    
    onUpdateAdminPermissions(uid, updated);
  };

  const handleToggleNewPermission = (permission: ActivityType) => {
    setNewPermissions(prev => 
      prev.includes(permission) 
        ? prev.filter(p => p !== permission) 
        : [...prev, permission]
    );
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      alert('Only the super admin can register new administrative operators.');
      return;
    }
    if (!newEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      alert('Please state a valid user email.');
      return;
    }

    setIsSaving(true);
    try {
      // Generate a secure lookup UID
      const generatedUid = 'operator-' + Math.random().toString(36).substr(2, 9);
      await onAddAdmin(generatedUid, newEmail.toLowerCase(), newRole, newPermissions);
      
      // reset
      setNewEmail('');
      setNewRole('operator');
      setNewPermissions(['manage_orders']);
      setIsAdding(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-150 p-6 md:p-8 shadow-sm text-left max-w-4xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h4 className="font-sans font-bold text-base text-gray-950 flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <span>Personnel Permission Settings</span>
          </h4>
          <p className="text-xs text-gray-450 mt-0.5">Control administrative access layers. Super admins can allocate precise permissions to moderators/operators.</p>
        </div>
        {isSuperAdmin && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm shadow-amber-500/10 active:scale-[0.98] transition-transform shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Operator</span>
          </button>
        )}
      </div>

      {/* Add New Operator Drawer */}
      {isAdding && (
        <div className="border border-amber-200/50 bg-amber-50/10 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-150/50 pb-2">
            <h5 className="font-bold text-gray-800 text-xs uppercase tracking-wider flex items-center gap-1">
              <Mail className="w-4 h-4 text-amber-500" />
              <span>Invite New Moderator/Operator</span>
            </h5>
            <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-gray-700">Google Login Email address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. operator@gmail.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full p-2.5 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-gray-700">Access Role Level *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AdminRole)}
                  className="w-full p-2.5 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-100"
                >
                  <option value="operator">Operator (Moderates selections according to allowances)</option>
                  <option value="super_admin">Super Admin (Unrestricted root settings access)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-bold text-gray-700 block">Allocate Access Allowances *</label>
              <div className="grid sm:grid-cols-2 gap-3.5">
                {permissionOptions.map((opt) => (
                  <div 
                    key={opt.value}
                    onClick={() => handleToggleNewPermission(opt.value)}
                    className={`p-3 rounded-xl border cursor-pointer select-none transition-colors flex items-start gap-2.5 ${
                      newPermissions.includes(opt.value)
                        ? 'border-amber-300 bg-amber-50/20 text-gray-900'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={newPermissions.includes(opt.value)}
                      readOnly
                      className="mt-0.5 rounded text-amber-500 focus:ring-amber-200"
                    />
                    <div className="text-left">
                      <p className="font-bold leading-tight">{opt.labelEn}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{opt.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-150/40">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className={`px-5 py-2 font-bold rounded-xl flex items-center gap-1 shadow-sm cursor-pointer transition-all ${
                  isSaving 
                    ? 'bg-amber-400 text-white cursor-not-allowed opacity-85' 
                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <BadgeCheck className="w-4 h-4" />
                    <span>Save Registry</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Operator List table */}
      <div className="overflow-x-auto border border-gray-150 rounded-2xl">
        <table className="w-full text-left border-collapse text-xs font-sans">
          <thead>
            <tr className="bg-gray-50 text-[10px] uppercase font-extrabold text-gray-500 border-b border-gray-100">
              <th className="p-4">Staff Email</th>
              <th className="p-4">Security Level</th>
              <th className="p-4">Active Access Scopes</th>
              {isSuperAdmin && <th className="p-4 text-right">Modifications</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {admins.filter(a => !a.isDeleted).map((admin) => {
              const emailText = admin.email;
              const isCurrentUser = emailText.toLowerCase() === currentAdminEmail.toLowerCase();
              return (
                <tr key={admin.uid} className={`hover:bg-gray-55/20 ${isCurrentUser ? 'bg-amber-50/10' : ''}`}>
                  
                  {/* Email & Info */}
                  <td className="p-4">
                    <div className="font-bold text-gray-900 flex items-center gap-1">
                      <span>{emailText}</span>
                      {isCurrentUser && (
                        <span className="text-[9px] bg-amber-105 bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full">You</span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">UID: {admin.uid}</p>
                  </td>

                  {/* Level role badge */}
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase border ${
                      admin.role === 'super_admin'
                        ? 'bg-amber-100 border-amber-200 text-amber-900'
                        : 'bg-indigo-50 border-indigo-100 text-indigo-800'
                    }`}>
                      {admin.role === 'super_admin' ? 'Root Super Admin' : 'Staff Operator'}
                    </span>
                  </td>

                  {/* Active clearances */}
                  <td className="p-3">
                    {admin.role === 'super_admin' ? (
                      <span className="text-gray-500 font-semibold italic text-[11px]">All Clearance Approved</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {permissionOptions.map((opt) => {
                          const isAllocated = admin.permissions.includes(opt.value);
                          return (
                            <button
                              key={opt.value}
                              disabled={!isSuperAdmin || isCurrentUser}
                              onClick={() => handleTogglePermission(admin.uid, opt.value, admin.permissions)}
                              className={`p-1.5 px-2.5 rounded-lg border text-[10px] leading-tight font-medium transition-all ${
                                isAllocated
                                  ? 'bg-amber-50 border-amber-200 text-amber-805 hover:bg-rose-50 hover:border-rose-100 hover:text-rose-600'
                                  : 'bg-white border-gray-150 text-gray-400 hover:border-gray-300'
                              } ${!isSuperAdmin || isCurrentUser ? 'cursor-not-allowed opacity-85 hover:bg-transparent' : 'cursor-pointer'}`}
                              title={isSuperAdmin && !isCurrentUser ? 'Click to toggle permission' : ''}
                            >
                              {opt.labelEn}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </td>

                  {/* Root Admin Actions */}
                  {isSuperAdmin && (
                    <td className="p-4 text-right">
                      {isCurrentUser || admin.email === "edutechsa55@gmail.com" ? (
                        <span className="text-[10px] text-gray-400 italic">Locked</span>
                      ) : (
                        <button
                          onClick={() => {
                            if (confirm(`Remove admin operator permissions from ${admin.email}?`)) {
                              onDeleteAdmin(admin.uid);
                            }
                          }}
                          className="text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  )}

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};
