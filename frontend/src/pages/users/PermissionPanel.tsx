import { useEffect, useState } from 'react';
import { usersApi } from '../../api/users.api';

interface Props {
  userId: number;
  onClose: () => void;
}

interface PermissionState {
  id: number;
  key: string;
  isDefault: boolean;       // comes from role
  override: boolean | null; // null = no override, true = granted, false = revoked
  effective: boolean;       // final resolved value
}

export default function PermissionPanel({ userId, onClose }: Props) {
  const [permissions, setPermissions] = useState<PermissionState[]>([]);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [user, perms] = await Promise.all([
        usersApi.getOne(userId),
        usersApi.getPermissions(userId),
      ]);
      setUserName(user.name);

      const defaultKeys = new Set(perms.roleDefaults.map((p: any) => p.key));
      const overrideMap = new Map(perms.overrides.map((o: any) => [o.key, o.granted]));
      const effectiveSet = new Set(perms.effectivePermissions);

      // Merge all known permissions into one unified list
      const allKeys = new Set([...perms.roleDefaults.map((p: any) => p.key), ...perms.overrides.map((o: any) => o.key)]);
      const allPermissions = [...allKeys].map((key, idx) => ({
        id: perms.roleDefaults.find((p: any) => p.key === key)?.id ?? perms.overrides.find((o: any) => o.key === key)?.id ?? idx,
        key,
        isDefault: defaultKeys.has(key),
        override: overrideMap.has(key) ? overrideMap.get(key)! : null,
        effective: effectiveSet.has(key),
      }));

      setPermissions(allPermissions.sort((a, b) => a.key.localeCompare(b.key)));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [userId]);

  async function toggle(perm: PermissionState) {
    setSaving(perm.id);
    try {
      if (perm.override === null) {
        // No override yet — grant if it's not a default, revoke if it is a default
        await usersApi.setPermissionOverride(userId, perm.id, !perm.isDefault);
      } else {
        // Already has an override — remove it (revert to role default)
        await usersApi.removePermissionOverride(userId, perm.id);
      }
      await load();
    } finally {
      setSaving(null);
    }
  }

  function getState(perm: PermissionState): 'default-on' | 'default-off' | 'granted' | 'revoked' {
    if (perm.override === true) return 'granted';
    if (perm.override === false) return 'revoked';
    return perm.isDefault ? 'default-on' : 'default-off';
  }

  const stateStyles = {
    'default-on': 'bg-blue-50 text-blue-700 border-blue-200',
    'default-off': 'bg-gray-50 text-gray-400 border-gray-200',
    'granted': 'bg-green-50 text-green-700 border-green-200',
    'revoked': 'bg-red-50 text-red-600 border-red-200',
  };

  const stateLabel = {
    'default-on': 'Role default ✓',
    'default-off': 'Not assigned',
    'granted': 'Manually granted',
    'revoked': 'Manually revoked',
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-end z-50">
      <div className="bg-white h-full w-full max-w-md shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="font-semibold text-gray-900">Permissions</h2>
            <p className="text-xs text-gray-500 mt-0.5">{userName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex gap-3 text-xs flex-wrap">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />Role default on</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />Not assigned</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Manually granted</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />Manually revoked</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-8">Loading permissions...</p>
          ) : (
            permissions.map((perm) => {
              const state = getState(perm);
              return (
                <div key={perm.key} className={`flex items-center justify-between p-3 rounded-lg border ${stateStyles[state]}`}>
                  <div>
                    <p className="text-sm font-medium">{perm.key}</p>
                    <p className="text-xs opacity-70 mt-0.5">{stateLabel[state]}</p>
                  </div>
                  <button
                    onClick={() => toggle(perm)}
                    disabled={saving === perm.id}
                    className="text-xs px-2.5 py-1 rounded-md border border-current opacity-70 hover:opacity-100 disabled:opacity-30 transition-opacity"
                  >
                    {saving === perm.id ? '...' : perm.override !== null ? 'Reset' : perm.effective ? 'Revoke' : 'Grant'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}