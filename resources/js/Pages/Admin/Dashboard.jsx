import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import axios from 'axios';

export default function Dashboard({ auth, brands = [], models = [], orders = [], users = [] }) {
    const [activeTab, setActiveTab] = useState('brands');

    // ---- Marcas ----
    const [showBrandModal, setShowBrandModal] = useState(false);
    const [brandForm, setBrandForm] = useState({ name: '', logo: null });
    const [brandLoading, setBrandLoading] = useState(false);
    const [brandError, setBrandError] = useState('');

    // ---- Modelos ----
    const [showModelModal, setShowModelModal] = useState(false);
    const [modelForm, setModelForm] = useState({ brand_id: '', name: '', image_normal: null, image_transparent: null });
    const [modelLoading, setModelLoading] = useState(false);
    const [modelError, setModelError] = useState('');
    const [modelFilterBrandId, setModelFilterBrandId] = useState('');

    // ---- Usuarios ----
    const [showUserModal, setShowUserModal] = useState(false);
    const [userForm, setUserForm] = useState({ name: '', email: '', password: '', password_confirmation: '', is_admin: true });
    const [userLoading, setUserLoading] = useState(false);
    const [userError, setUserError] = useState('');

    // ---- Handlers Marcas ----
    const handleBrandSubmit = async (e) => {
        e.preventDefault();
        setBrandLoading(true); setBrandError('');
        const fd = new FormData();
        fd.append('name', brandForm.name);
        if (brandForm.logo) fd.append('logo', brandForm.logo);
        fd.append('active', '1');
        try {
            await axios.post('/api/brands', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setShowBrandModal(false); setBrandForm({ name: '', logo: null }); router.reload();
        } catch (err) { setBrandError(err.response?.data?.message || 'Error al guardar'); }
        finally { setBrandLoading(false); }
    };

    const handleDeleteBrand = async (id) => {
        if (!confirm('¿Eliminar esta marca?')) return;
        try { await axios.delete(`/api/brands/${id}`); router.reload(); }
        catch { alert('Error al eliminar'); }
    };

    // ---- Handlers Modelos ----
    const handleModelSubmit = async (e) => {
        e.preventDefault();
        setModelLoading(true); setModelError('');
        const fd = new FormData();
        fd.append('brand_id', modelForm.brand_id);
        fd.append('name', modelForm.name);
        if (modelForm.image_normal) fd.append('image_normal', modelForm.image_normal);
        if (modelForm.image_transparent) fd.append('image_transparent', modelForm.image_transparent);
        fd.append('active', '1');
        try {
            await axios.post('/api/models', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setShowModelModal(false); setModelForm({ brand_id: '', name: '', image_normal: null, image_transparent: null }); router.reload();
        } catch (err) { setModelError(err.response?.data?.message || 'Error al guardar'); }
        finally { setModelLoading(false); }
    };

    const handleDeleteModel = async (id) => {
        if (!confirm('¿Eliminar este modelo?')) return;
        try { await axios.delete(`/api/models/${id}`); router.reload(); }
        catch { alert('Error al eliminar'); }
    };

    // ---- Handlers Usuarios ----
    const handleUserSubmit = async (e) => {
        e.preventDefault();
        if (userForm.password !== userForm.password_confirmation) {
            setUserError('Las contraseñas no coinciden'); return;
        }
        setUserLoading(true); setUserError('');
        try {
            await axios.post('/api/admin/users', {
                name: userForm.name,
                email: userForm.email,
                password: userForm.password,
                password_confirmation: userForm.password_confirmation,
                is_admin: userForm.is_admin,
            });
            setShowUserModal(false);
            setUserForm({ name: '', email: '', password: '', password_confirmation: '', is_admin: true });
            router.reload();
        } catch (err) {
            const errors = err.response?.data?.errors;
            if (errors) {
                setUserError(Object.values(errors).flat().join(', '));
            } else {
                setUserError(err.response?.data?.message || 'Error al crear usuario');
            }
        } finally { setUserLoading(false); }
    };

    const handleDeleteUser = async (id) => {
        if (id === auth.user.id) { alert('No puedes eliminar tu propia cuenta'); return; }
        if (!confirm('¿Eliminar este usuario?')) return;
        try { await axios.delete(`/api/admin/users/${id}`); router.reload(); }
        catch { alert('Error al eliminar'); }
    };

    // ---- Estilos comunes ----
    const inputStyle = { width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem', outline: 'none', marginTop: '0.25rem', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', fontWeight: '600', fontSize: '0.85rem', color: '#374151', marginBottom: '0.1rem' };
    const btnPrimary = { padding: '0.6rem 1.5rem', background: '#01A0AD', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' };
    const btnDanger = { padding: '0.4rem 0.8rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' };

    const stats = [
        { label: 'Marcas', value: brands.length, icon: 'fa-tags', color: '#01A0AD', tab: 'brands' },
        { label: 'Modelos', value: models.length, icon: 'fa-mobile-alt', color: '#EC008C', tab: 'models' },
        { label: 'Pedidos', value: orders.length, icon: 'fa-shopping-bag', color: '#10b981', tab: 'orders' },
        { label: 'Usuarios', value: users.length, icon: 'fa-users', color: '#8b5cf6', tab: 'users' },
    ];

    return (
        <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
            <Head title="Panel de Administración" />

            {/* Stats */}
            <style>{`
                .admin-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }
                @media (max-width: 1024px) {
                    .admin-stats-grid { grid-template-columns: repeat(2, 1fr); }
                }
                @media (max-width: 480px) {
                    .admin-stats-grid { grid-template-columns: 1fr; gap: 1rem; }
                }
            `}</style>
            <div className="admin-stats-grid">
                {stats.map(stat => (
                    <div
                        key={stat.label}
                        onClick={() => setActiveTab(stat.tab)}
                        style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', border: activeTab === stat.tab ? `2px solid ${stat.color}` : '2px solid transparent', transition: 'all 0.2s' }}
                    >
                        <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: stat.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <i className={`fas ${stat.icon}`} style={{ color: stat.color, fontSize: '1.3rem' }}></i>
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}>{stat.label}</p>
                            <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: '#111827' }}>{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Contenido de tabs */}
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem' }}>

                    {/* ---- TAB MARCAS ---- */}
                    {activeTab === 'brands' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Marcas ({brands.length})</h2>
                                <button style={btnPrimary} onClick={() => setShowBrandModal(true)}>
                                    <i className="fas fa-plus"></i> Nueva Marca
                                </button>
                            </div>
                            {brands.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                                    <i className="fas fa-tags" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}></i>
                                    <p>No hay marcas registradas. ¡Agrega la primera!</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                                    {brands.map(brand => (
                                        <div key={brand.id} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem', textAlign: 'center', background: '#fafafa' }}>
                                            {brand.logo && <img src={brand.logo} alt={brand.name} style={{ width: '60px', height: '60px', objectFit: 'contain', marginBottom: '0.5rem' }} />}
                                            <p style={{ fontWeight: '700', margin: '0 0 0.5rem', fontSize: '0.95rem' }}>{brand.name}</p>
                                            <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '20px', background: brand.active ? '#d1fae5' : '#fee2e2', color: brand.active ? '#065f46' : '#991b1b' }}>
                                                {brand.active ? 'Activa' : 'Inactiva'}
                                            </span>
                                            <div style={{ marginTop: '0.75rem' }}>
                                                <button style={btnDanger} onClick={() => handleDeleteBrand(brand.id)}>
                                                    <i className="fas fa-trash"></i> Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ---- TAB MODELOS ---- */}
                    {activeTab === 'models' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Modelos</h2>
                                    <select
                                        style={{ ...inputStyle, width: 'auto', marginTop: 0 }}
                                        value={modelFilterBrandId}
                                        onChange={e => setModelFilterBrandId(e.target.value)}
                                    >
                                        <option value="">Todas las Marcas</option>
                                        {brands.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <button style={btnPrimary} onClick={() => setShowModelModal(true)}>
                                    <i className="fas fa-plus"></i> Nuevo Modelo
                                </button>
                            </div>

                            {(() => {
                                const filteredModels = modelFilterBrandId
                                    ? models.filter(m => m.brand_id == modelFilterBrandId)
                                    : models;

                                if (filteredModels.length === 0) {
                                    return (
                                        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                                            <i className="fas fa-mobile-alt" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}></i>
                                            <p>{modelFilterBrandId ? 'No hay modelos para esta marca.' : 'No hay modelos registrados.'}</p>
                                        </div>
                                    );
                                }

                                return (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ background: '#f9fafb' }}>
                                                    {['Imagen', 'Nombre', 'Marca', 'Estado', 'Acciones'].map(h => (
                                                        <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredModels.map(model => (
                                                    <tr key={model.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                                                        <td style={{ padding: '0.75rem 1rem' }}>
                                                            {model.image_normal && <img src={model.image_normal} alt={model.name} style={{ width: '50px', height: '50px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #eee' }} />}
                                                        </td>
                                                        <td style={{ padding: '0.75rem 1rem', fontWeight: '600', fontSize: '0.9rem' }}>{model.name}</td>
                                                        <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.9rem' }}>{model.brand?.name || '—'}</td>
                                                        <td style={{ padding: '0.75rem 1rem' }}>
                                                            <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '20px', background: model.active ? '#d1fae5' : '#fee2e2', color: model.active ? '#065f46' : '#991b1b' }}>
                                                                {model.active ? 'Activo' : 'Inactivo'}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '0.75rem 1rem' }}>
                                                            <button style={btnDanger} onClick={() => handleDeleteModel(model.id)}>
                                                                <i className="fas fa-trash"></i> Eliminar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* ---- TAB PEDIDOS ---- */}
                    {activeTab === 'orders' && (
                        <div>
                            <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: '700' }}>Pedidos ({orders.length})</h2>
                            {orders.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                                    <i className="fas fa-shopping-bag" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}></i>
                                    <p>No hay pedidos registrados aún.</p>
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: '#f9fafb' }}>
                                                {['#', 'Diseño', 'Cliente', 'Modelo', 'Estado', 'Fecha'].map(h => (
                                                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.map(order => (
                                                <tr key={order.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                                                    <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.9rem' }}>#{order.id}</td>
                                                    <td style={{ padding: '0.75rem 1rem' }}>
                                                        {order.preview_image ? (
                                                            <div
                                                                style={{ width: '50px', height: '100px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #e5e7eb' }}
                                                                onClick={() => {
                                                                    const win = window.open('', '_blank');
                                                                    win.document.write(`<img src="${order.preview_image}" style="max-width:100%; height:auto;">`);
                                                                }}
                                                                title="Clic para ver diseño completo"
                                                            >
                                                                <img src={order.preview_image} alt="Diseño" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            </div>
                                                        ) : (
                                                            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Sin diseño</span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem', fontWeight: '600', fontSize: '0.9rem' }}>{order.customer_email || '—'}</td>
                                                    <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.9rem' }}>{order.phone_model?.name || '—'}</td>
                                                    <td style={{ padding: '0.75rem 1rem' }}>
                                                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '20px', background: '#dbeafe', color: '#1e40af' }}>
                                                            {order.status || 'Pendiente'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.9rem' }}>
                                                        {order.created_at ? new Date(order.created_at).toLocaleDateString('es-MX') : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ---- TAB USUARIOS ---- */}
                    {activeTab === 'users' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Usuarios ({users.length})</h2>
                                <button style={btnPrimary} onClick={() => setShowUserModal(true)}>
                                    <i className="fas fa-user-plus"></i> Nuevo Usuario
                                </button>
                            </div>
                            {users.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                                    <i className="fas fa-users" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}></i>
                                    <p>No hay usuarios registrados.</p>
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: '#f9fafb' }}>
                                                {['Avatar', 'Nombre', 'Correo', 'Rol', 'Fecha de Registro', 'Acciones'].map(h => (
                                                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map(user => (
                                                <tr key={user.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                                                    <td style={{ padding: '0.75rem 1rem' }}>
                                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#01A0AD', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '1rem' }}>
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem', fontWeight: '600', fontSize: '0.9rem' }}>{user.name}</td>
                                                    <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.9rem' }}>{user.email}</td>
                                                    <td style={{ padding: '0.75rem 1rem' }}>
                                                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '20px', background: user.is_admin ? '#ede9fe' : '#f3f4f6', color: user.is_admin ? '#6d28d9' : '#374151', fontWeight: '600' }}>
                                                            {user.is_admin ? '⭐ Admin' : 'Usuario'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.9rem' }}>
                                                        {user.created_at ? new Date(user.created_at).toLocaleDateString('es-MX') : '—'}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem' }}>
                                                        {user.id !== auth.user.id && (
                                                            <button style={btnDanger} onClick={() => handleDeleteUser(user.id)}>
                                                                <i className="fas fa-trash"></i> Eliminar
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ======== MODAL NUEVA MARCA ======== */}
            {showBrandModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '450px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Nueva Marca</h3>
                            <button onClick={() => setShowBrandModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}>×</button>
                        </div>
                        {brandError && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>{brandError}</div>}
                        <form onSubmit={handleBrandSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={labelStyle}>Nombre de la Marca *</label>
                                <input type="text" style={inputStyle} placeholder="Ej: Samsung, Apple..." value={brandForm.name} onChange={e => setBrandForm({ ...brandForm, name: e.target.value })} required />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={labelStyle}>Logo de la Marca</label>
                                <input type="file" accept="image/*" style={{ ...inputStyle, padding: '0.4rem' }} onChange={e => setBrandForm({ ...brandForm, logo: e.target.files[0] })} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowBrandModal(false)} style={{ padding: '0.6rem 1.2rem', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Cancelar</button>
                                <button type="submit" style={btnPrimary} disabled={brandLoading}>
                                    {brandLoading ? <><i className="fas fa-spinner fa-spin"></i> Guardando...</> : <><i className="fas fa-save"></i> Guardar</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ======== MODAL NUEVO MODELO ======== */}
            {showModelModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '500px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Nuevo Modelo</h3>
                            <button onClick={() => setShowModelModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}>×</button>
                        </div>
                        {modelError && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>{modelError}</div>}
                        <form onSubmit={handleModelSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={labelStyle}>Marca *</label>
                                <select style={inputStyle} value={modelForm.brand_id} onChange={e => setModelForm({ ...modelForm, brand_id: e.target.value })} required>
                                    <option value="">Selecciona una marca...</option>
                                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={labelStyle}>Nombre del Modelo *</label>
                                <input type="text" style={inputStyle} placeholder="Ej: Galaxy S24..." value={modelForm.name} onChange={e => setModelForm({ ...modelForm, name: e.target.value })} required />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={labelStyle}>Imagen Normal (con fondo) *</label>
                                <input type="file" accept="image/*" style={{ ...inputStyle, padding: '0.4rem' }} onChange={e => setModelForm({ ...modelForm, image_normal: e.target.files[0] })} required />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={labelStyle}>Imagen Transparente (máscara) *</label>
                                <input type="file" accept="image/png" style={{ ...inputStyle, padding: '0.4rem' }} onChange={e => setModelForm({ ...modelForm, image_transparent: e.target.files[0] })} required />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowModelModal(false)} style={{ padding: '0.6rem 1.2rem', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Cancelar</button>
                                <button type="submit" style={btnPrimary} disabled={modelLoading}>
                                    {modelLoading ? <><i className="fas fa-spinner fa-spin"></i> Guardando...</> : <><i className="fas fa-save"></i> Guardar</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ======== MODAL NUEVO USUARIO ======== */}
            {showUserModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Nuevo Usuario</h3>
                            <button onClick={() => setShowUserModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}>×</button>
                        </div>
                        {userError && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>{userError}</div>}
                        <form onSubmit={handleUserSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={labelStyle}>Nombre *</label>
                                <input type="text" style={inputStyle} placeholder="Nombre completo" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} required />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={labelStyle}>Correo Electrónico *</label>
                                <input type="email" style={inputStyle} placeholder="correo@ejemplo.com" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} required />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={labelStyle}>Contraseña *</label>
                                <input type="password" style={inputStyle} placeholder="Mínimo 8 caracteres" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} required minLength={8} />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={labelStyle}>Confirmar Contraseña *</label>
                                <input type="password" style={inputStyle} placeholder="Repite la contraseña" value={userForm.password_confirmation} onChange={e => setUserForm({ ...userForm, password_confirmation: e.target.value })} required />
                            </div>
                            {/* All new users are admins by default as per request */}
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowUserModal(false)} style={{ padding: '0.6rem 1.2rem', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Cancelar</button>
                                <button type="submit" style={btnPrimary} disabled={userLoading}>
                                    {userLoading ? <><i className="fas fa-spinner fa-spin"></i> Creando...</> : <><i className="fas fa-user-plus"></i> Crear Usuario</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
