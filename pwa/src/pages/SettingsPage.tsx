import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import ConfirmDialog from '../components/Common/ConfirmDialog';
import Spinner from '../components/Common/Spinner';
import type { Device } from '../types/device';
import type { DevicesResponse, GenerateTokenResponse } from '../types/api';
import './SettingsPage.css';

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "a l'instant";
  if (minutes < 60) return `il y a ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

export default function SettingsPage() {
  const logout = useAuthStore((s) => s.logout);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    setIsLoading(true);
    try {
      const { devices } = await api.get<DevicesResponse>('/api/devices');
      setDevices(devices);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleRevoke = useCallback(async () => {
    if (!revokeTarget) return;
    await api.delete(`/api/devices/${revokeTarget}`);
    setDevices((prev) => prev.filter((d) => d.token !== revokeTarget));
    setRevokeTarget(null);
  }, [revokeTarget]);

  const handleGenerateToken = useCallback(async () => {
    const { token } = await api.post<GenerateTokenResponse>('/api/devices/generate', {
      deviceName: 'Generated from settings',
    });
    setGeneratedToken(token);
  }, []);

  return (
    <div className="settings-page">
      <div className="settings-page__header">
        <Link to="/" className="settings-page__back">&#8592; Retour</Link>
        <h1>Parametres</h1>
      </div>

      <section className="settings-section">
        <h2>Appareils</h2>
        {isLoading ? (
          <div className="settings-section__loading"><Spinner /></div>
        ) : (
          <div className="device-list">
            {devices.map((device) => (
              <div key={device.token} className="device-item">
                <div className="device-item__info">
                  <span className="device-item__name">{device.device_name}</span>
                  <span className="device-item__meta">
                    Cree {formatRelativeTime(device.created_at)} &middot; Utilise {formatRelativeTime(device.last_used)}
                  </span>
                </div>
                <button
                  className="device-item__revoke"
                  onClick={() => setRevokeTarget(device.token)}
                >
                  Revoquer
                </button>
              </div>
            ))}
          </div>
        )}
        <button className="settings-section__btn" onClick={handleGenerateToken}>
          Generer un token
        </button>
        {generatedToken && (
          <div className="settings-section__token">
            <code>{generatedToken}</code>
            <p>Ce token expire dans 5 minutes.</p>
          </div>
        )}
      </section>

      <section className="settings-section">
        <h2>Compte</h2>
        <button className="settings-section__btn settings-section__btn--danger" onClick={logout}>
          Se deconnecter
        </button>
      </section>

      {revokeTarget && (
        <ConfirmDialog
          title="Revoquer l'appareil"
          message="Cet appareil ne pourra plus acceder a NanoClaw."
          confirmLabel="Revoquer"
          destructive
          onConfirm={handleRevoke}
          onCancel={() => setRevokeTarget(null)}
        />
      )}
    </div>
  );
}
