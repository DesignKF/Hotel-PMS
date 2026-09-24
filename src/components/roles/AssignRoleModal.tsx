import React, { useState, useEffect } from 'react';
import { User, Role, Permission, PermissionCategory } from '../../types/auth';
import { authApi } from '../../services/authApi';
import { 
  X, 
  Check, 
  Search, 
  Plus, 
  ShieldCheck, 
  Users, 
  ArrowRight, 
  AlertCircle,
  CheckSquare,
  Square,
  Sparkles
} from 'lucide-react';

interface AssignRoleModalProps {
  user: User;
  currentRole: Role;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: User) => void;
}

export const AssignRoleModal: React.FC<AssignRoleModalProps> = ({
  user,
  currentRole,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [roles, setRoles] = useState<(Role & { users_count: number; permissions_count: number })[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState(currentRole.id);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sub-view mode: 'select' or 'create_inline'
  const [viewMode, setViewMode] = useState<'select' | 'create_inline'>('select');

  // Inline "Add Role" Form States
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>([]);
  const [inlineCreating, setInlineCreating] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const loadRolesAndPermissions = async () => {
    setLoading(true);
    try {
      const [fetchedRoles, fetchedPerms] = await Promise.all([
        authApi.getRoles(),
        authApi.getPermissions()
      ]);
      setRoles(fetchedRoles);
      setPermissions(fetchedPerms);
    } catch (err: any) {
      setError(err.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedRoleId(currentRole.id);
      setViewMode('select');
      loadRolesAndPermissions();
    }
  }, [isOpen, currentRole]);

  if (!isOpen) return null;

  // Filtered roles based on search
  const filteredRoles = roles.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group permissions by category for inline create
  const permissionsByCategory = Array.from(
    permissions.reduce((acc, p) => {
      const cat = p.category as PermissionCategory;
      if (!acc.has(cat)) acc.set(cat, []);
      acc.get(cat)!.push(p);
      return acc;
    }, new Map<PermissionCategory, Permission[]>()).entries()
  );

  // Handle Save Assignment
  const handleConfirmAssignment = async () => {
    if (selectedRoleId === currentRole.id) {
      onClose();
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const updated = await authApi.assignRoleToUser(user.id, selectedRoleId);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to assign role');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Inline Add Role
  const handleSaveInlineRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      setInlineError('Role name is required.');
      return;
    }

    setInlineCreating(true);
    setInlineError(null);

    try {
      // 1. Create the new role via API
      const createdRole = await authApi.createRole({
        name: newRoleName.trim(),
        description: newRoleDescription.trim(),
        permissions: newRolePermissions
      });

      // 2. Refresh roles list
      const refreshedRoles = await authApi.getRoles();
      setRoles(refreshedRoles);

      // 3. Immediately select the newly created role for this user without closing!
      setSelectedRoleId(createdRole.id);

      // 4. Return to selection view
      setViewMode('select');
      setNewRoleName('');
      setNewRoleDescription('');
      setNewRolePermissions([]);
    } catch (err: any) {
      setInlineError(err.message || 'Failed to create role');
    } finally {
      setInlineCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="card-surface rounded-3xl max-w-xl w-full border border-strong shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-surface-2 border-b border-subtle flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-[var(--primary-gold)]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Role Assignment &amp; RBAC</span>
            </div>
            <h3 className="text-lg font-bold text-primary font-serif">
              Assign Role for {user.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface-3 text-secondary hover:text-primary transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= VIEW 1: SELECT ROLE (WITH "+" OPTION) ================= */}
        {viewMode === 'select' && (
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-surface-1">
            
            {error && (
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Current user & role info card */}
            <div className="p-3 rounded-2xl bg-surface-2 border border-subtle flex items-center justify-between text-xs">
              <div>
                <span className="text-tertiary">Currently Assigned:</span>
                <span className="font-bold text-primary ml-1.5">{currentRole.name}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-3 text-secondary">
                {currentRole.permissions.length} perms active
              </span>
            </div>

            {/* Search Bar + "+" Create Role Option */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search roles by name or scope..."
                  className="input-field !pl-9 text-xs w-full"
                />
              </div>

              {/* "+" BUTTON: Opens inline Add Role form without leaving */}
              <button
                type="button"
                onClick={() => {
                  setViewMode('create_inline');
                  setInlineError(null);
                }}
                className="btn-primary !h-9 !px-3 text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                title="Create a new role inline and auto-select"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Role</span>
              </button>
            </div>

            {/* Roles List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {loading ? (
                <div className="py-8 text-center text-xs text-tertiary">
                  Loading roles...
                </div>
              ) : filteredRoles.length === 0 ? (
                <div className="py-6 text-center text-xs text-tertiary">
                  No roles match your search. Click <strong>+ New Role</strong> to create one.
                </div>
              ) : (
                filteredRoles.map(role => {
                  const isSelected = selectedRoleId === role.id;
                  const isOriginal = currentRole.id === role.id;

                  return (
                    <div
                      key={role.id}
                      onClick={() => setSelectedRoleId(role.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected 
                          ? 'bg-[var(--primary-gold)]/10 border-[var(--primary-gold)] shadow-xs ring-1 ring-[var(--primary-gold)]' 
                          : 'bg-surface-2/60 border-subtle hover:bg-surface-2'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-primary">{role.name}</span>
                          {role.is_system_role && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400">
                              System
                            </span>
                          )}
                          {isOriginal && (
                            <span className="text-[10px] text-tertiary italic">
                              (Current)
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-secondary line-clamp-1 max-w-sm">
                          {role.description || 'No description.'}
                        </p>
                        <div className="text-[10px] text-tertiary flex items-center gap-2 pt-0.5">
                          <span>{role.permissions.length} permissions</span>
                          <span>·</span>
                          <span>{role.users_count} assigned</span>
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                        isSelected 
                          ? 'bg-[var(--primary-gold)] border-[var(--primary-gold)] text-[var(--primary-gold-text)]' 
                          : 'border-strong text-transparent'
                      }`}>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-subtle flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary !h-9 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAssignment}
                disabled={submitting || selectedRoleId === currentRole.id}
                className="btn-primary !h-9 text-xs font-bold px-4 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? 'Updating...' : 'Confirm Role Assignment'}
              </button>
            </div>

          </div>
        )}

        {/* ================= VIEW 2: INLINE ADD ROLE FORM ================= */}
        {viewMode === 'create_inline' && (
          <form onSubmit={handleSaveInlineRole} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-surface-1">
            
            <div className="p-3 rounded-2xl bg-[var(--primary-gold)]/10 border border-[var(--primary-gold)]/30 text-xs flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-[var(--primary-gold)] shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Create &amp; Auto-Select:</strong> Saving this new role will immediately assign it to <strong>{user.name}</strong> without leaving this window.
              </div>
            </div>

            {inlineError && (
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{inlineError}</span>
              </div>
            )}

            {/* Name */}
            <div className="space-y-1">
              <label className="font-bold text-xs text-primary">New Role Name *</label>
              <input
                type="text"
                value={newRoleName}
                onChange={e => setNewRoleName(e.target.value)}
                placeholder="e.g., Night Shift Supervisor"
                className="input-field text-xs w-full"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="font-bold text-xs text-primary">Description</label>
              <input
                type="text"
                value={newRoleDescription}
                onChange={e => setNewRoleDescription(e.target.value)}
                placeholder="Operational role responsibilities..."
                className="input-field text-xs w-full"
              />
            </div>

            {/* Permission Checkboxes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs border-b border-subtle pb-1">
                <label className="font-bold text-primary">
                  Permissions ({newRolePermissions.length} selected)
                </label>
                <button
                  type="button"
                  onClick={() => setNewRolePermissions(permissions.map(p => p.key))}
                  className="text-[var(--primary-gold)] font-bold text-[11px] hover:underline cursor-pointer"
                >
                  Select All
                </button>
              </div>

              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {permissionsByCategory.map(([cat, perms]) => (
                  <div key={cat} className="p-2.5 rounded-xl bg-surface-2 border border-subtle space-y-1.5">
                    <span className="font-bold text-[11px] text-primary uppercase tracking-wider block">
                      {cat}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {perms.map(p => {
                        const checked = newRolePermissions.includes(p.key);
                        return (
                          <label
                            key={p.key}
                            className={`p-1.5 rounded-lg border text-[11px] flex items-center gap-2 cursor-pointer transition-colors ${
                              checked 
                                ? 'bg-surface-1 border-[var(--primary-gold)] text-primary' 
                                : 'bg-surface-1/40 border-subtle text-secondary'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setNewRolePermissions(prev => 
                                  prev.includes(p.key) ? prev.filter(k => k !== p.key) : [...prev, p.key]
                                );
                              }}
                              className="rounded text-[var(--primary-gold)]"
                            />
                            <span className="font-medium truncate">{p.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inline Form Footer */}
            <div className="pt-3 border-t border-subtle flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setViewMode('select')}
                className="btn-secondary !h-9 text-xs"
              >
                Back to Selection
              </button>
              <button
                type="submit"
                disabled={inlineCreating}
                className="btn-primary !h-9 text-xs font-bold px-4"
              >
                {inlineCreating ? 'Saving & Selecting...' : 'Save & Select This Role'}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
