import React, { useState, useEffect } from 'react';
import { Role, Permission, PermissionCategory } from '../../types/auth';
import { authApi } from '../../services/authApi';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  AlertCircle, 
  Users, 
  Lock, 
  Sliders, 
  CheckSquare, 
  Square,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface RoleManagementViewProps {
  currentUserPermissions: string[];
  onRoleCreatedOrUpdated?: () => void;
}

export const RoleManagementView: React.FC<RoleManagementViewProps> = ({
  currentUserPermissions,
  onRoleCreatedOrUpdated
}) => {
  const hasManageRoles = currentUserPermissions.includes('manage_roles');

  const [roles, setRoles] = useState<(Role & { users_count: number; permissions_count: number })[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State for Add / Edit Role
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirmation State
  const [roleToDelete, setRoleToDelete] = useState<(Role & { users_count: number }) | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedRoles, fetchedPerms] = await Promise.all([
        authApi.getRoles(),
        authApi.getPermissions()
      ]);
      setRoles(fetchedRoles);
      setPermissions(fetchedPerms);
    } catch (err: any) {
      setError(err.message || 'Failed to load roles and permissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Group permissions by category
  const permissionsByCategory = React.useMemo(() => {
    const map = new Map<PermissionCategory, Permission[]>();
    for (const p of permissions) {
      const cat = p.category as PermissionCategory;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    return map;
  }, [permissions]);

  // Open Create Modal
  const openCreateModal = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleDescription('');
    setSelectedPermissions([]);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description);
    setSelectedPermissions([...role.permissions]);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Toggle single permission
  const togglePermission = (key: string) => {
    setSelectedPermissions(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // Toggle category all
  const toggleCategory = (categoryPerms: Permission[]) => {
    const keys = categoryPerms.map(p => p.key);
    const allSelected = keys.every(k => selectedPermissions.includes(k));
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(k => !keys.includes(k)));
    } else {
      setSelectedPermissions(prev => Array.from(new Set([...prev, ...keys])));
    }
  };

  // Handle Save (Create or Update)
  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      setModalError('Role name is required.');
      return;
    }

    if (editingRole?.is_system_role && selectedPermissions.length === 0) {
      setModalError('Security Policy: Cannot remove all permissions from the system Admin role.');
      return;
    }

    setSubmitting(true);
    setModalError(null);

    try {
      if (editingRole) {
        await authApi.updateRole(editingRole.id, {
          name: roleName.trim(),
          description: roleDescription.trim(),
          permissions: selectedPermissions
        });
        setSuccessMsg(`Role "${roleName}" successfully updated.`);
      } else {
        await authApi.createRole({
          name: roleName.trim(),
          description: roleDescription.trim(),
          permissions: selectedPermissions
        });
        setSuccessMsg(`Role "${roleName}" successfully created.`);
      }

      setIsModalOpen(false);
      await loadData();
      if (onRoleCreatedOrUpdated) onRoleCreatedOrUpdated();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setModalError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Role
  const handleDeleteRole = async (role: Role & { users_count: number }) => {
    if (role.is_system_role) {
      alert('Security policy: The system Admin role cannot be deleted.');
      return;
    }
    if (role.users_count > 0) {
      alert(`Cannot delete role "${role.name}" while ${role.users_count} active user(s) are assigned to it.`);
      return;
    }

    try {
      await authApi.deleteRole(role.id);
      setSuccessMsg(`Role "${role.name}" deleted.`);
      setRoleToDelete(null);
      await loadData();
      if (onRoleCreatedOrUpdated) onRoleCreatedOrUpdated();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete role');
    }
  };

  // Access check guard
  if (!hasManageRoles) {
    return (
      <div className="p-8 text-center bg-surface-2 rounded-3xl border border-subtle space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-primary font-serif">
          Access Restricted: Manage Roles
        </h3>
        <p className="text-xs text-secondary max-w-md mx-auto leading-relaxed">
          Your current staff role does not possess the <code className="px-1.5 py-0.5 rounded bg-surface-3 font-mono font-bold text-[var(--primary-gold)]">manage_roles</code> permission required to configure system roles and permission bundles.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[var(--primary-gold)]/20 text-[var(--primary-gold)]">
              <Sliders className="w-4 h-4" />
            </span>
            <h3 className="text-lg font-bold text-primary font-serif">
              Role-Based Access Control (RBAC)
            </h3>
          </div>
          <p className="text-xs text-secondary mt-0.5">
            Configure system and custom staff roles, manage permission categories, and enforce least-privilege security.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary !h-9 text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Role</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Roles Table */}
      <div className="bg-surface-1 border border-subtle rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2 text-secondary font-bold border-b border-subtle uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Role Particulars</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-center">Assigned Staff</th>
                <th className="py-3 px-4 text-center">Active Permissions</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-tertiary">
                    <div className="w-6 h-6 border-2 border-[var(--primary-gold)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading roles from system...</span>
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-tertiary">
                    No roles found.
                  </td>
                </tr>
              ) : (
                roles.map(role => {
                  const isDeletable = !role.is_system_role && role.users_count === 0;
                  const deleteReason = role.is_system_role 
                    ? 'System roles cannot be deleted' 
                    : role.users_count > 0 
                      ? `Cannot delete: ${role.users_count} active user(s) assigned` 
                      : '';

                  return (
                    <tr key={role.id} className="hover:bg-surface-2/60 transition-colors">
                      {/* Name & Description */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-primary text-sm flex items-center gap-1.5">
                          <span>{role.name}</span>
                          {role.is_system_role && (
                            <span className="p-0.5 text-amber-500" title="Protected System Role">
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-secondary mt-0.5 line-clamp-1 max-w-sm">
                          {role.description || 'No description provided.'}
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4">
                        {role.is_system_role ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                            <Lock className="w-2.5 h-2.5" />
                            <span>System Role</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-surface-3 text-secondary border border-subtle">
                            Custom Role
                          </span>
                        )}
                      </td>

                      {/* Users Count */}
                      <td className="py-3.5 px-4 text-center font-bold">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-2 text-primary">
                          <Users className="w-3 h-3 text-tertiary" />
                          <span>{role.users_count}</span>
                        </span>
                      </td>

                      {/* Permissions Count */}
                      <td className="py-3.5 px-4 text-center font-bold">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[var(--primary-gold)]/10 text-primary border border-[var(--primary-gold)]/20">
                          <span>{role.permissions_count} / {permissions.length}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => openEditModal(role)}
                            className="p-1.5 rounded-lg hover:bg-surface-3 text-secondary hover:text-primary transition-colors cursor-pointer"
                            title={`Edit ${role.name}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button: blocked with tooltip if is_system_role or users_count > 0 */}
                          {isDeletable ? (
                            <button
                              type="button"
                              onClick={() => setRoleToDelete(role)}
                              className="p-1.5 rounded-lg hover:bg-red-500/15 text-red-500 transition-colors cursor-pointer"
                              title={`Delete ${role.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <div className="relative group inline-block">
                              <button
                                type="button"
                                disabled
                                className="p-1.5 rounded-lg text-tertiary opacity-40 cursor-not-allowed"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <div className="absolute right-0 bottom-full mb-1 hidden group-hover:block z-20 w-48 p-2 rounded-lg bg-neutral-900 text-white text-[10px] leading-tight shadow-lg">
                                {deleteReason}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {roleToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-surface rounded-2xl p-6 max-w-sm w-full border border-strong shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h4 className="font-bold text-base text-primary">Delete Role</h4>
              <p className="text-xs text-secondary mt-1">
                Are you sure you want to permanently delete the role <strong>"{roleToDelete.name}"</strong>? This action is recorded in the audit log.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRoleToDelete(null)}
                className="btn-secondary flex-1 !h-9 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteRole(roleToDelete)}
                className="btn-primary flex-1 !h-9 text-xs !bg-red-600 hover:!bg-red-700 font-bold"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Role Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="card-surface rounded-3xl max-w-2xl w-full border border-strong shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-surface-2 border-b border-subtle flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--primary-gold)]">
                  {editingRole ? 'Modify Existing Role' : 'Create Role Bundle'}
                </span>
                <h3 className="text-lg font-bold text-primary font-serif">
                  {editingRole ? `Edit Role: ${editingRole.name}` : 'Add New Staff Role'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-surface-3 text-secondary hover:text-primary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveRole} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-surface-1">
              
              {modalError && (
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Role Name */}
              <div className="space-y-1">
                <label className="font-bold text-xs text-primary">Role Name *</label>
                <input
                  type="text"
                  value={roleName}
                  onChange={e => setRoleName(e.target.value)}
                  placeholder="e.g. Night Auditor, Housekeeping Lead"
                  disabled={editingRole?.is_system_role}
                  className="input-field text-xs w-full disabled:opacity-60"
                  required
                />
                {editingRole?.is_system_role && (
                  <p className="text-[10px] text-tertiary">
                    System role name cannot be modified.
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-xs text-primary">Role Description</label>
                <textarea
                  value={roleDescription}
                  onChange={e => setRoleDescription(e.target.value)}
                  placeholder="Describe operational responsibilities and scope..."
                  rows={2}
                  className="input-field text-xs w-full resize-none"
                />
              </div>

              {/* Permissions Checklist by Category */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-subtle pb-2">
                  <label className="font-bold text-xs text-primary">
                    Assigned Permission Bundle ({selectedPermissions.length} selected)
                  </label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSelectedPermissions(permissions.map(p => p.key))}
                      className="text-[var(--primary-gold)] hover:underline font-semibold cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-tertiary">·</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (editingRole?.is_system_role) {
                          alert('System Admin role must maintain active permissions.');
                          return;
                        }
                        setSelectedPermissions([]);
                      }}
                      className="text-tertiary hover:text-primary font-semibold cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {Array.from(permissionsByCategory.entries()).map(([cat, perms]) => {
                    const allCatSelected = perms.every(p => selectedPermissions.includes(p.key));

                    return (
                      <div key={cat} className="p-3.5 rounded-2xl bg-surface-2 border border-subtle space-y-2.5">
                        
                        {/* Category Header */}
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-primary uppercase tracking-wider">
                            {cat} Category
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleCategory(perms)}
                            className="text-[10px] text-secondary hover:text-primary font-bold flex items-center gap-1 cursor-pointer"
                          >
                            {allCatSelected ? <CheckSquare className="w-3.5 h-3.5 text-[var(--primary-gold)]" /> : <Square className="w-3.5 h-3.5" />}
                            <span>{allCatSelected ? 'Deselect Category' : 'Select Category'}</span>
                          </button>
                        </div>

                        {/* Category Checkboxes */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {perms.map(p => {
                            const isChecked = selectedPermissions.includes(p.key);

                            return (
                              <label
                                key={p.key}
                                className={`flex items-start gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                                  isChecked 
                                    ? 'bg-surface-1 border-[var(--primary-gold)] text-primary shadow-xs' 
                                    : 'bg-surface-1/50 border-subtle text-secondary hover:bg-surface-1'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => togglePermission(p.key)}
                                  className="mt-0.5 rounded text-[var(--primary-gold)] focus:ring-[var(--primary-gold)]"
                                />
                                <div>
                                  <div className="font-bold text-[11px] leading-tight text-primary">
                                    {p.label}
                                  </div>
                                  <div className="text-[10px] text-tertiary leading-normal mt-0.5">
                                    {p.description}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-subtle flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary !h-9 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary !h-9 text-xs font-bold px-5"
                >
                  {submitting ? 'Saving Role...' : editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
