import { useState, useEffect } from 'react';
import { usersApi } from '../../api/users.api';

interface Role { id: number; name: string; }
interface Props {
  userId: number;
  currentRole: string;
  onClose: () => void;
  onUpdated: () => void;
}

export default function ChangeRoleModal({ userId, currentRole, onClose, onUpdated }: Props) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);

  useEffect(() => {
    usersApi.getRoles()
      .then((fetchedRoles: Role[]) => {
        setRoles(fetchedRoles);
        // Set current role as default selected value
        const current = fetchedRoles.find((r) => r.name === currentRole);
        if (current) setRoleId(current.id);
      })
      .catch(() => setError('Failed to load roles'))
      .finally(() => setLoadingRoles(false));
  }, [currentRole]);

  async function handleSave() {
    if (!roleId) return;
    setSaving(true);
    setError(null);
    try {
      await usersApi.update(userId, { roleId });
      onUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to update role');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Change Role</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          {loadingRoles ? (
            <p className="text-sm text-gray-400">Loading roles...</p>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Role</label>
              <select
                value={roleId ?? ''}
                onChange={(e) => setRoleId(Number(e.target.value))}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          )}

          <p className="text-xs text-gray-500">
            Changing the role updates the user's default permission set immediately.
            Any manual permission overrides are preserved.
          </p>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="text-sm text-gray-600 px-4 py-2">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || loadingRoles || !roleId}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Save Role'}
          </button>
        </div>
      </div>
    </div>
  );
}