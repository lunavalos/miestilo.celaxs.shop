import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import axios from 'axios';

export default function PaymentGateway() {
    const [settings, setSettings] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Estado del formulario actual
    const [currentProvider, setCurrentProvider] = useState('stripe');
    const [currentEnv, setCurrentEnv] = useState('sandbox');
    const [formData, setFormData] = useState({
        public_key: '',
        secret_key: '',
        webhook_secret: '',
        merchant_id: ''
    });
    const [showKeys, setShowKeys] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/admin/payment-settings');
            setSettings(res.data.settings);
            setLogs(res.data.logs);
            // Cargar datos del proveedor actual si existen
            const existing = res.data.settings.find(s => s.provider === currentProvider && s.environment === currentEnv);
            if (existing) {
                setFormData({
                    public_key: existing.masked_settings.public_key || '',
                    secret_key: existing.masked_settings.secret_key || '',
                    webhook_secret: existing.masked_settings.webhook_secret || '',
                    merchant_id: existing.masked_settings.merchant_id || ''
                });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error al cargar configuraciones.' });
        } finally {
            setLoading(false);
        }
    };

    // Actualizar formulario al cambiar proveedor o entorno
    useEffect(() => {
        const existing = settings.find(s => s.provider === currentProvider && s.environment === currentEnv);
        if (existing) {
            setFormData({
                public_key: existing.masked_settings.public_key || '',
                secret_key: existing.masked_settings.secret_key || '',
                webhook_secret: existing.masked_settings.webhook_secret || '',
                merchant_id: existing.masked_settings.merchant_id || ''
            });
        } else {
            setFormData({ public_key: '', secret_key: '', webhook_secret: '', merchant_id: '' });
        }
    }, [currentProvider, currentEnv]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true); setMessage({ type: '', text: '' });
        try {
            await axios.post('/admin/payment-settings', {
                provider: currentProvider,
                environment: currentEnv,
                settings: formData,
                is_active: true // Activar automáticamente al guardar
            });
            setMessage({ type: 'success', text: 'Configuración guardada correctamente.' });
            fetchData();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Error al guardar.' });
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        setTesting(true); setMessage({ type: '', text: '' });
        try {
            const res = await axios.post('/admin/payment-settings/test', {
                provider: currentProvider,
                environment: currentEnv,
                settings: formData
            });
            setMessage({ type: 'success', text: res.data.message });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Error en la prueba de conexión.' });
        } finally {
            setTesting(false);
        }
    };

    const getWebhookUrl = () => {
        const baseUrl = window.location.origin;
        return `${baseUrl}/api/payments/webhook/${currentProvider}`;
    };

    const inputStyle = { width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', transition: 'border 0.2s', marginTop: '0.25rem' };
    const labelStyle = { display: 'block', fontWeight: '700', fontSize: '0.85rem', color: '#374151' };

    return (
        <AdminLayout activeTab="payments">
            <Head title="Pasarela de Pago - Admin" />

            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>Pasarela de Pago</h2>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <span style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', background: currentEnv === 'production' ? '#fee2e2' : '#dcfce7', color: currentEnv === 'production' ? '#991b1b' : '#166534', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <i className={`fas ${currentEnv === 'production' ? 'fa-rocket' : 'fa-flask'}`}></i>
                            MODO: {currentEnv.toUpperCase()}
                        </span>
                    </div>
                </div>

                {message.text && (
                    <div style={{ padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', background: message.type === 'success' ? '#dcfce7' : '#fee2e2', color: message.type === 'success' ? '#166534' : '#991b1b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                        {message.text}
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem' }}>

                    {/* Panel de Configuración */}
                    <div>
                        <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                            <form onSubmit={handleSave}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={labelStyle}>Proveedor de Pago</label>
                                    <select
                                        style={inputStyle}
                                        value={currentProvider}
                                        onChange={e => setCurrentProvider(e.target.value)}
                                    >
                                        <option value="stripe">Stripe</option>
                                        <option value="mercadopago">Mercado Pago</option>
                                        <option value="manual">Otro / Pago Manual</option>
                                    </select>
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={labelStyle}>Entorno</label>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                        <button
                                            type="button"
                                            onClick={() => setCurrentEnv('sandbox')}
                                            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: currentEnv === 'sandbox' ? '2px solid #01A0AD' : '1px solid #d1d5db', background: currentEnv === 'sandbox' ? '#f0fdfa' : 'white', cursor: 'pointer', fontWeight: '600', color: currentEnv === 'sandbox' ? '#065f46' : '#6b7280' }}
                                        >
                                            Sandbox (Pruebas)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCurrentEnv('production')}
                                            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: currentEnv === 'production' ? '2px solid #ef4444' : '1px solid #d1d5db', background: currentEnv === 'production' ? '#fef2f2' : 'white', cursor: 'pointer', fontWeight: '600', color: currentEnv === 'production' ? '#991b1b' : '#6b7280' }}
                                        >
                                            Producción (Real)
                                        </button>
                                    </div>
                                </div>

                                <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', margin: '2rem 0' }} />

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800' }}>Credenciales</h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowKeys(!showKeys)}
                                        style={{ background: 'none', border: 'none', color: '#01A0AD', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}
                                    >
                                        <i className={`fas ${showKeys ? 'fa-eye-slash' : 'fa-eye'}`}></i> {showKeys ? 'Ocultar' : 'Mostrar'} claves
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div>
                                        <label style={labelStyle}>Public Key / Client ID</label>
                                        <input
                                            type={showKeys ? "text" : "password"}
                                            style={inputStyle}
                                            value={formData.public_key}
                                            onChange={e => setFormData({ ...formData, public_key: e.target.value })}
                                            placeholder="pk_test_..."
                                            required={currentProvider !== 'manual'}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Secret Key / Secret ID</label>
                                        <input
                                            type={showKeys ? "text" : "password"}
                                            style={inputStyle}
                                            value={formData.secret_key}
                                            onChange={e => setFormData({ ...formData, secret_key: e.target.value })}
                                            placeholder="sk_test_..."
                                            required={currentProvider !== 'manual'}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                                    <div>
                                        <label style={labelStyle}>Webhook Signing Secret</label>
                                        <input
                                            type={showKeys ? "text" : "password"}
                                            style={inputStyle}
                                            value={formData.webhook_secret}
                                            onChange={e => setFormData({ ...formData, webhook_secret: e.target.value })}
                                            placeholder="whsec_..."
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Merchant ID (opcional)</label>
                                        <input
                                            type="text"
                                            style={inputStyle}
                                            value={formData.merchant_id}
                                            onChange={e => setFormData({ ...formData, merchant_id: e.target.value })}
                                            placeholder="ID de comercio"
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        type="button"
                                        onClick={handleTest}
                                        disabled={testing || saving}
                                        style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '2px solid #01A0AD', color: '#01A0AD', background: 'transparent', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}
                                    >
                                        {testing ? <><i className="fas fa-spinner fa-spin"></i> Probando...</> : 'Probar Conexión'}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving || testing}
                                        style={{ flex: 2, padding: '0.8rem', borderRadius: '8px', border: 'none', color: 'white', background: '#01A0AD', fontWeight: '800', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(1,160,173,0.3)' }}
                                    >
                                        {saving ? <><i className="fas fa-spinner fa-spin"></i> Guardando...</> : 'Guardar Cambios'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Sidebar de Ayuda/Webhooks */}
                    <div>
                        <div style={{ background: '#0f172a', borderRadius: '12px', padding: '1.5rem', color: 'white', marginBottom: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: '800', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>
                                Webhook URL
                            </h3>
                            <p style={{ fontSize: '0.75rem', lineHeight: '1.5', color: '#cbd5e1', marginBottom: '1rem' }}>
                                Copia esta URL en el dashboard de {currentProvider} para recibir notificaciones de pagos:
                            </p>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.7rem', fontFamily: 'monospace', wordBreak: 'break-all', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }} onClick={() => { navigator.clipboard.writeText(getWebhookUrl()); alert('URL copiada'); }}>
                                {getWebhookUrl()}
                            </div>
                        </div>

                        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ margin: '0 0 1rem', fontSize: '0.85rem', fontWeight: '800', color: '#1f2937' }}>Estado Actual</h3>
                            {settings.find(s => s.provider === currentProvider && s.is_active) ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.8rem', fontWeight: '700' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                                    CONECTADO
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', fontSize: '0.8rem', fontWeight: '700' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d1d5db' }}></div>
                                    NO CONFIGURADO
                                </div>
                            )}
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '1rem', lineHeight: '1.4' }}>
                                Se enviará el prefijo <strong>APP-</strong> en la descripción de cada cargo.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabla de Logs de Webhooks */}
                <div style={{ marginTop: '2rem', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid #f3f4f6' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800' }}>Últimos Webhooks</h3>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem', fontSize: '0.75rem', color: '#6b7280', fontWeight: '600' }}>Fecha</th>
                                    <th style={{ padding: '1rem', fontSize: '0.75rem', color: '#6b7280', fontWeight: '600' }}>Evento</th>
                                    <th style={{ padding: '1rem', fontSize: '0.75rem', color: '#6b7280', fontWeight: '600' }}>Proveedor</th>
                                    <th style={{ padding: '1rem', fontSize: '0.75rem', color: '#6b7280', fontWeight: '600' }}>Firma</th>
                                    <th style={{ padding: '1rem', fontSize: '0.75rem', color: '#6b7280', fontWeight: '600' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>
                                            No se han recibido webhooks todavía.
                                        </td>
                                    </tr>
                                ) : logs.map(log => (
                                    <tr key={log.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{new Date(log.created_at).toLocaleString()}</td>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: '600' }}>{log.event_type}</td>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem', textTransform: 'capitalize' }}>{log.provider}</td>
                                        <td style={{ padding: '1rem' }}>
                                            {log.is_valid_signature ?
                                                <span style={{ color: '#10b981' }} title="Firma válida"><i className="fas fa-check-circle"></i></span> :
                                                <span style={{ color: '#ef4444' }} title="Firma inválida"><i className="fas fa-times-circle"></i></span>
                                            }
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', background: log.status === 200 ? '#dcfce7' : '#fee2e2', color: log.status === 200 ? '#166534' : '#991b1b' }}>
                                                {log.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
