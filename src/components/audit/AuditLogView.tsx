import React, { useState, useEffect } from 'react';
import { AuditLog } from '../../types/auth';
import { authApi } from '../../services/authApi';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Clock, 
  User, 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  Code,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface AuditLogViewProps {
  currentUserPermissions: string[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ currentUserPermissions }) => {
  const hasAuditPermission = currentUserPermissions.includes('view_audit_log') || currentUserPermissions.includes('manage_roles');

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await authApi.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.warn('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (!hasAuditPermission) {
    return (
      <div className="p-8 text-center bg-surface-2 rounded-3xl border border-subtle space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-primary font-serif">
          Access Restricted: Security Audit Log
        </h3>
        <p className="text-xs text-secondary max-w-md mx-auto leading-relaxed">
          Your current staff role does not possess the <code className="px-1.5 py-0.5 rounded bg-surface-3 font-mono font-bold text-[var(--primary-gold)]">view_audit_log</code> permission required to inspect security records.
        </p>
      </div>
    );
  }

  // Filter logs
  const filteredLogs = logs.filter(log => {
    if (actionFilter !== 'all') {
      if (actionFilter === 'roles' && !log.action.includes('ROLE')) return false;
      if (actionFilter === 'users' && !log.action.includes('USER')) return false;
      if (actionFilter === 'auth' && !['LOGIN', 'LOGOUT', 'FAILED_LOGIN', 'ACCOUNT_LOCKED', 'OTP_REQUESTED', 'OTP_LOGIN'].includes(log.action)) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.actor_name.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.target_type.toLowerCase().includes(q) ||
        log.target_id.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const getActionBadge = (action: string) => {
    if (action.includes('LOCKED') || action.includes('FAILED')) {
      return 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30';
    }
    if (action.includes('CREATE') || action.includes('ASSIGN')) {
      return 'bg-[var(--primary-gold)]/15 text-[var(--primary-gold)] border-[var(--primary-gold)]/30';
    }
    if (action.includes('LOGIN') || action.includes('ACTIVATE')) {
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    }
    if (action.includes('DELETE')) {
      return 'bg-neutral-500/15 text-neutral-600 dark:text-neutral-400 border-neutral-500/30';
    }
    return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
  };

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[var(--primary-gold)]/20 text-[var(--primary-gold)]">
              <Activity className="w-4 h-4" />
            </span>
            <h3 className="text-lg font-bold text-primary font-serif">
              Security &amp; Role Audit Log
            </h3>
          </div>
          <p className="text-xs text-secondary mt-0.5">
            Immutable system audit trail tracking authentication events, role creations, deletions, and permission reassignments.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          className="btn-secondary !h-8 text-xs font-semibold self-start sm:self-auto"
        >
          Refresh Log
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by actor, action, or target ID..."
            className="input-field !pl-9 text-xs w-full"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0">
          {(['all', 'roles', 'users', 'auth'] as const).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setActionFilter(f)}
              className={`px-3 py-1.5 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-colors cursor-pointer shrink-0 ${
                actionFilter === f
                  ? 'bg-[var(--primary-navy)] text-white dark:bg-[var(--primary-gold)] dark:text-[var(--primary-gold-text)] shadow-xs'
                  : 'bg-surface-2 text-secondary hover:text-primary border border-subtle'
              }`}
            >
              {f === 'all' ? 'All Events' : `${f.toUpperCase()} Events`}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-surface-1 border border-subtle rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2 text-secondary font-bold border-b border-subtle uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Scope</th>
                <th className="py-3 px-4 text-right">State Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-tertiary">
                    Loading security records...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-tertiary">
                    No audit records match the current filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const isExpanded = expandedLogId === log.id;
                  const dateStr = new Date(log.created_at).toLocaleString();

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-surface-2/60 transition-colors">
                        
                        {/* Timestamp */}
                        <td className="py-3 px-4 whitespace-nowrap text-secondary font-mono text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-tertiary" />
                            <span>{dateStr}</span>
                          </div>
                        </td>

                        {/* Actor */}
                        <td className="py-3 px-4 whitespace-nowrap font-bold text-primary">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-tertiary" />
                            <span>{log.actor_name}</span>
                          </div>
                        </td>

                        {/* Action Badge */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getActionBadge(log.action)}`}>
                            {log.action}
                          </span>
                        </td>

                        {/* Target Scope */}
                        <td className="py-3 px-4 text-secondary text-[11px]">
                          <span className="uppercase font-semibold tracking-wider text-[10px] text-tertiary mr-1.5">
                            {log.target_type}:
                          </span>
                          <span className="font-mono">{log.target_id}</span>
                        </td>

                        {/* Diff Inspector Toggle */}
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-2 hover:bg-surface-3 text-secondary hover:text-primary transition-colors cursor-pointer text-[11px] font-medium"
                          >
                            <Code className="w-3 h-3" />
                            <span>{isExpanded ? 'Hide Diff' : 'Inspect'}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </td>

                      </tr>

                      {/* Expandable JSON Before/After Diff */}
                      {isExpanded && (
                        <tr className="bg-surface-2/80">
                          <td colSpan={5} className="p-4 border-y border-subtle">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                              
                              {/* Before State */}
                              <div className="p-3 rounded-xl bg-surface-1 border border-subtle space-y-1">
                                <span className="text-[10px] uppercase font-bold text-secondary tracking-wider block">
                                  Before State:
                                </span>
                                <pre className="font-mono text-[10px] text-tertiary overflow-x-auto max-h-40 p-2 rounded bg-surface-2">
                                  {log.before_value ? JSON.stringify(log.before_value, null, 2) : '(Initial state / None)'}
                                </pre>
                              </div>

                              {/* After State */}
                              <div className="p-3 rounded-xl bg-surface-1 border border-[var(--primary-gold)]/40 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-[var(--primary-gold)] tracking-wider block">
                                  After State (Applied):
                                </span>
                                <pre className="font-mono text-[10px] text-primary overflow-x-auto max-h-40 p-2 rounded bg-surface-2">
                                  {log.after_value ? JSON.stringify(log.after_value, null, 2) : '(Deleted / None)'}
                                </pre>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
