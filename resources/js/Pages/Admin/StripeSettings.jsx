import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import axios from 'axios';

export default function StripeSettings() {
    const [settings, setSettings] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [currentEnv, setCurrentEnv] = useState('sandbox');
    const [formData, setFormData] = useState({
        public_key: '',
        secret_key: '',
        webhook_secret: '',
        is_active: false
    });
    const [configStatus, setConfigStatus] = useState({
        is_configured: false,
        validation_errors: [],
        last_verified_at: null,
        last_error: null
    });
    const [showKeys, setShowKeys] = useState(false);

    useEffect(() => {
        fetchData(currentEnv);
    }, [currentEnv]);

    const fetchData = async (env) => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/admin/stripe-settings?env=${env}`);
            const data = res.data;

            setFormData({
                public_key: data.public_key || '',
                secret_key: data.secret_key || '',
                webhook_secret: data.webhook_secret || '',
                is_active: data.is_active
            });
            setConfigStatus({
                is_configured: data.is_configured,
                validation_errors: data.validation_errors || [],
                last_verified_at: data.last_verified_at,
                last_error: data.last_error,
                global_active_env: data.global_active_env
            });
            setLogs(data.logs || []);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Error al cargar configuraciones de Stripe.' });
        } finally {
            setLoading(false);
        }
    };


    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true); setMessage({ type: '', text: '' });

        try {
            const res = await axios.put('/api/admin/stripe-settings', {
                ...formData,
                is_active: true, // Force active on "Save and Activate" button
                environment: currentEnv
            });
            setMessage({ type: 'success', text: res.data.message });
            fetchData(currentEnv);
        } catch (err) {
            const errorData = err.response?.data;
            setMessage({ type: 'error', text: errorData?.message || 'Error al guardar.' });
            if (errorData?.validation_errors) {
                setConfigStatus(prev => ({ ...prev, validation_errors: Object.values(errorData.validation_errors) }));
            }
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async () => {
        setSaving(true);
        try {
            const newVal = !formData.is_active;
            const res = await axios.put('/api/admin/stripe-settings', {
                ...formData,
                is_active: newVal,
                environment: currentEnv,
                public_key: '********', // Use masked to avoid overwriting with empty if not loaded
                secret_key: '********'
            });
            setFormData(prev => ({ ...prev, is_active: newVal }));
            setMessage({ type: 'success', text: newVal ? 'Canal activado.' : 'Canal desactivado.' });
            fetchData(currentEnv);
        } catch (err) {
            setMessage({ type: 'error', text: 'Error al cambiar estado.' });
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        setTesting(true); setMessage({ type: '', text: '' });
        try {
            const res = await axios.post('/api/admin/stripe-settings/test', {
                environment: currentEnv,
                settings: {
                    public_key: formData.public_key,
                    secret_key: formData.secret_key
                }
            });
            setMessage({ type: 'success', text: res.data.message });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Error en la prueba de conexión.' });
        } finally {
            setTesting(false);
        }
    };

    const isConfigIncomplete = () => {
        if (currentEnv === 'production') {
            return !formData.public_key || !formData.secret_key || !formData.webhook_secret;
        }
        return !formData.public_key || !formData.secret_key;
    };

    const getWebhookUrl = () => {
        const baseUrl = window.location.origin;
        return `${baseUrl}/api/payments/webhook/stripe`;
    };

    const inputStyle = { width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', transition: 'border 0.2s', marginTop: '0.25rem' };
    const labelStyle = { display: 'block', fontWeight: '700', fontSize: '0.85rem', color: '#374151' };

    return (
        <AdminLayout activeTab="stripe_settings">
            <Head title="Stripe / Pagos - Admin" />

            <style>{`
                .stripe-settings-grid {
                    display: grid;
                    grid-template-columns: 1fr 340px;
                    gap: 2rem;
                }
                @media (max-width: 1024px) {
                    .stripe-settings-grid {
                        grid-template-columns: 1fr;
                        gap: 1.5rem;
                    }
                }
            `}</style>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <i className="fab fa-stripe" style={{ fontSize: '2.5rem', color: '#635bff' }}></i>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Stripe / Pagos</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <span style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', background: configStatus.global_active_env === 'production' ? '#fee2e2' : configStatus.global_active_env === 'sandbox' ? '#dcfce7' : '#f1f5f9', color: configStatus.global_active_env === 'production' ? '#991b1b' : configStatus.global_active_env === 'sandbox' ? '#166534' : '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <i className={`fas ${configStatus.global_active_env === 'production' ? 'fa-rocket' : 'fa-flask'}`}></i>
                            ACTIVO: {configStatus.global_active_env ? configStatus.global_active_env.toUpperCase() : 'NINGUNO'}
                        </span>
                        {!configStatus.is_configured && (
                            <span style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', background: '#fef3c7', color: '#92400e' }}>
                                {currentEnv === 'sandbox' ? 'SANDBOX NO VERIFICADO' : 'LIVE NO VERIFICADO'}
                            </span>
                        )}
                    </div>
                </div>

                {message.text && (
                    <div style={{ padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', background: message.type === 'success' ? '#dcfce7' : '#fee2e2', color: message.type === 'success' ? '#166534' : '#991b1b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                        {message.text}
                    </div>
                )}

                <div className="stripe-settings-grid">

                    <div>
                        <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                            <form onSubmit={handleSave}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={labelStyle}>Entorno de Ejecución</label>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                        <button
                                            type="button"
                                            onClick={() => setCurrentEnv('sandbox')}
                                            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: currentEnv === 'sandbox' ? '2px solid #635bff' : '1px solid #d1d5db', background: currentEnv === 'sandbox' ? '#f5f3ff' : 'white', cursor: 'pointer', fontWeight: '700', color: currentEnv === 'sandbox' ? '#4338ca' : '#6b7280' }}
                                        >
                                            <i className="fas fa-flask"></i> Sandbox (Test)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCurrentEnv('production')}
                                            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: currentEnv === 'production' ? '2px solid #ef4444' : '1px solid #d1d5db', background: currentEnv === 'production' ? '#fef2f2' : 'white', cursor: 'pointer', fontWeight: '700', color: currentEnv === 'production' ? '#991b1b' : '#6b7280' }}
                                        >
                                            <i className="fas fa-rocket"></i> Producción (Live)
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800', textTransform: 'uppercase', color: '#64748b' }}>Credenciales de API</h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowKeys(!showKeys)}
                                        style={{ background: 'none', border: 'none', color: '#635bff', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                                    >
                                        <i className={`fas ${showKeys ? 'fa-eye-slash' : 'fa-eye'}`}></i> {showKeys ? 'Ocultar' : 'Mostrar'}
                                    </button>
                                </div>

                                <div style={{ marginBottom: '1.2rem' }}>
                                    <label style={labelStyle}>Publishable Key ({currentEnv === 'sandbox' ? 'pk_test_...' : 'pk_live_...'})</label>
                                    <input
                                        type={showKeys ? "text" : "password"}
                                        style={inputStyle}
                                        value={formData.public_key}
                                        onChange={e => setFormData({ ...formData, public_key: e.target.value })}
                                        placeholder={currentEnv === 'sandbox' ? 'pk_test_...' : 'pk_live_...'}
                                        required
                                    />
                                </div>

                                <div style={{ marginBottom: '1.2rem' }}>
                                    <label style={labelStyle}>Secret Key ({currentEnv === 'sandbox' ? 'sk_test_...' : 'sk_live_...'})</label>
                                    <input
                                        type={showKeys ? "text" : "password"}
                                        style={inputStyle}
                                        value={formData.secret_key}
                                        onChange={e => setFormData({ ...formData, secret_key: e.target.value })}
                                        placeholder={currentEnv === 'sandbox' ? 'sk_test_...' : 'sk_live_...'}
                                        required
                                    />
                                    <p style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                        <i className="fas fa-shield-alt"></i> Nunca se incluye en el código del cliente.
                                    </p>
                                </div>

                                <div style={{ marginBottom: '2rem' }}>
                                    <label style={labelStyle}>
                                        Webhook Signing Secret (whsec_...)
                                        {currentEnv === 'production' && <span style={{ color: '#ef4444', marginLeft: '4px' }}>* Requerido</span>}
                                    </label>
                                    <input
                                        type={showKeys ? "text" : "password"}
                                        style={inputStyle}
                                        value={formData.webhook_secret}
                                        onChange={e => setFormData({ ...formData, webhook_secret: e.target.value })}
                                        placeholder="whsec_..."
                                        required={currentEnv === 'production'}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        type="button"
                                        onClick={handleTest}
                                        disabled={testing || saving}
                                        style={{ flex: 1, padding: '0.85rem', borderRadius: '8px', border: '2px solid #635bff', color: '#635bff', background: 'transparent', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}
                                    >
                                        {testing ? <><i className="fas fa-spinner fa-spin"></i> Validando...</> : 'Probar Conexión'}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving || testing}
                                        style={{ flex: 2, padding: '0.85rem', borderRadius: '8px', border: 'none', color: 'white', background: '#635bff', fontWeight: '800', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(99,91,255,0.3)' }}
                                    >
                                        {saving ? <><i className="fas fa-spinner fa-spin"></i> Guardando...</> : 'Guardar y Activar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* <div style={{ background: '#0f172a', borderRadius: '12px', padding: '1.5rem', color: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ margin: '0 0 1rem', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>
                                Endpoint de Webhook
                            </h3>
                            <p style={{ fontSize: '0.75rem', lineHeight: '1.5', color: '#cbd5e1', marginBottom: '1rem' }}>
                                Registra esta URL en tu Dashboard de Stripe para sincronizar estados de pago:
                            </p>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.7rem', fontFamily: 'monospace', wordBreak: 'break-all', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }} onClick={() => { navigator.clipboard.writeText(getWebhookUrl()); alert('URL copiada'); }}>
                                {getWebhookUrl()}
                            </div>
                        </div> */}

                        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: '0 0 1rem', fontSize: '0.85rem', fontWeight: '800', color: '#1f2937' }}>Estado del Canal</h3>
                                <div 
                                    onClick={handleToggleActive}
                                    style={{ 
                                        width: '40px', 
                                        height: '20px', 
                                        background: formData.is_active ? '#10b981' : '#d1d5db', 
                                        borderRadius: '10px', 
                                        position: 'relative', 
                                        cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    <div style={{ 
                                        width: '16px', 
                                        height: '16px', 
                                        background: 'white', 
                                        borderRadius: '50%', 
                                        position: 'absolute', 
                                        top: '2px', 
                                        left: formData.is_active ? '22px' : '2px',
                                        transition: 'left 0.2s'
                                    }}></div>
                                </div>
                            </div>

                            <div style={{ marginTop: '0.8rem' }}>
                                {configStatus.is_configured && formData.is_active ? (
                                    <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#dcfce7', color: '#166534', fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <i className="fas fa-check-circle"></i> CANAL ACTIVO
                                    </div>
                                ) : (
                                    <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#f1f5f9', color: '#64748b', fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <i className="fas fa-pause-circle"></i> DESACTIVADO
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: '1.5rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '0.8rem' }}>ESTADO DE VERIFICACIÓN:</label>

                                {configStatus.last_verified_at ? (
                                    <div style={{ fontSize: '0.7rem', color: '#166534', background: '#f0fdf4', padding: '0.5rem', borderRadius: '4px', border: '1px solid #bcf0da', marginBottom: '0.5rem' }}>
                                        <i className="fas fa-check-double"></i> Verificado el: {new Date(configStatus.last_verified_at).toLocaleString()}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '0.7rem', color: '#92400e', background: '#fffbeb', padding: '0.5rem', borderRadius: '4px', border: '1px solid #fef3c7', marginBottom: '0.5rem' }}>
                                        <i className="fas fa-clock"></i> Nunca verificado satisfactoriamente.
                                    </div>
                                )}

                                {configStatus.last_error && (
                                    <div style={{ fontSize: '0.7rem', color: '#991b1b', background: '#fef2f2', padding: '0.5rem', borderRadius: '4px', border: '1px solid #fee2e2', marginTop: '0.5rem' }}>
                                        <i className="fas fa-times-circle"></i> Último error: <br />
                                        <span style={{ fontWeight: '500' }}>{configStatus.last_error}</span>
                                    </div>
                                )}

                                <div style={{ marginTop: '1.5rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>EVENTOS REQUERIDOS:</label>
                                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.7rem', color: '#475569', lineHeight: '1.6' }}>
                                        <li>payment_intent.succeeded</li>
                                        <li>payment_intent.payment_failed</li>
                                        <li>charge.refunded</li>
                                        <li>charge.dispute.created</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <div style={{ marginTop: '2rem', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800' }}>Monitoreo de Webhooks (Últimas 20)</h3>
                        <button onClick={fetchData} style={{ background: 'none', border: 'none', color: '#635bff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700' }}>
                            <i className="fas fa-sync-alt"></i> Refrescar
                        </button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Fecha</th>
                                    <th style={{ padding: '1rem', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Evento</th>
                                    <th style={{ padding: '1rem', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Intent ID</th>
                                    <th style={{ padding: '1rem', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Firma</th>
                                    <th style={{ padding: '1rem', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                                            Esperando señales de Stripe...
                                        </td>
                                    </tr>
                                ) : logs.map(log => (
                                    <tr key={log.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
                                            {new Date(log.created_at).toLocaleString('es-MX', { hour12: true })}
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: '700', color: '#1e293b' }}>
                                            {log.event_type}
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.75rem', fontFamily: 'monospace', color: '#635bff' }}>
                                            {log.payload?.data?.object?.id || 'N/A'}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {log.is_valid_signature ?
                                                <span style={{ color: '#10b981' }} title="Firma validada"><i className="fas fa-check-circle"></i></span> :
                                                <span style={{ color: '#ef4444' }} title="Firma inválida"><i className="fas fa-times-circle"></i></span>
                                            }
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '800', background: log.status === 200 ? '#dcfce7' : '#fee2e2', color: log.status === 200 ? '#166534' : '#991b1b' }}>
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
