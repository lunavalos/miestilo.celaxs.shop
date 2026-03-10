import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import axios from 'axios';

const MEXICO_STATES = [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
    'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México',
    'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos',
    'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo',
    'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala',
    'Veracruz', 'Yucatán', 'Zacatecas'
];

export default function ShippingSettings() {
    const [activeTab, setActiveTab] = useState('zones');
    const [zones, setZones] = useState([]);
    const [exceptions, setExceptions] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal Zones
    const [showZoneModal, setShowZoneModal] = useState(false);
    const [editingZone, setEditingZone] = useState(null);
    const [zoneForm, setZoneForm] = useState({ name: '', price: '', states: [] });
    
    // Modal Exceptions
    const [showExceptionModal, setShowExceptionModal] = useState(false);
    const [editingException, setEditingException] = useState(null);
    const [exceptionForm, setExceptionForm] = useState({ state_name: 'Coahuila', city_name: '', price: '', active: true });

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [zonesRes, exceptionsRes] = await Promise.all([
                axios.get('/api/admin/shipping-zones'),
                axios.get('/api/admin/shipping-city-exceptions')
            ]);
            setZones(zonesRes.data.zone || zonesRes.data); // Handle potential success:true wrapper
            if (Array.isArray(zonesRes.data)) {
                setZones(zonesRes.data);
            } else if (zonesRes.data.zones) {
                setZones(zonesRes.data.zones);
            } else if (zonesRes.data.data) {
                setZones(zonesRes.data.data);
            }
            setExceptions(exceptionsRes.data);
        } catch (err) {
            console.error('Error fetching shipping data:', err);
            alert('Error al cargar datos: El servidor reportó un error. Es muy probable que necesites ejecutar las migraciones de la base de datos.');
        } finally {
            setLoading(false);
        }
    };

    // --- ZONES HANDLERS ---
    const handleOpenZoneModal = (zone = null) => {
        if (zone) {
            setEditingZone(zone);
            setZoneForm({ name: zone.name, price: zone.price, states: zone.states || [] });
        } else {
            setEditingZone(null);
            setZoneForm({ name: '', price: '', states: [] });
        }
        setShowZoneModal(true);
    };

    const handleToggleState = (state) => {
        setZoneForm(prev => {
            const newStates = prev.states.includes(state)
                ? prev.states.filter(s => s !== state)
                : [...prev.states, state];
            return { ...prev, states: newStates };
        });
    };

    const handleZoneSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingZone) {
                await axios.put(`/api/admin/shipping-zones/${editingZone.id}`, zoneForm);
            } else {
                await axios.post('/api/admin/shipping-zones', zoneForm);
            }
            setShowZoneModal(false);
            fetchData();
        } catch (err) { 
            console.error(err);
            alert('Error al guardar zona: ' + (err.response?.data?.message || err.message)); 
        } finally { setSaving(false); }
    };

    const handleDeleteZone = async (id) => {
        if (!confirm('¿Eliminar esta zona?')) return;
        try {
            await axios.delete(`/api/admin/shipping-zones/${id}`);
            fetchData();
        } catch (err) { alert('Error al eliminar zona'); }
    };

    // --- EXCEPTIONS HANDLERS ---
    const handleOpenExceptionModal = (exc = null) => {
        if (exc) {
            setEditingException(exc);
            setExceptionForm({ 
                state_name: exc.state_name, 
                city_name: exc.city_name, 
                price: exc.price, 
                active: exc.active 
            });
        } else {
            setEditingException(null);
            setExceptionForm({ state_name: 'Coahuila', city_name: '', price: '', active: true });
        }
        setShowExceptionModal(true);
    };

    const handleExceptionSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingException) {
                await axios.put(`/api/admin/shipping-city-exceptions/${editingException.id}`, exceptionForm);
            } else {
                await axios.post('/api/admin/shipping-city-exceptions', exceptionForm);
            }
            setShowExceptionModal(false);
            fetchData();
        } catch (err) { 
            console.error(err);
            alert('Error al guardar excepción: ' + (err.response?.data?.message || err.message)); 
        } finally { setSaving(false); }
    };

    const handleDeleteException = async (id) => {
        if (!confirm('¿Eliminar esta excepción?')) return;
        try {
            await axios.delete(`/api/admin/shipping-city-exceptions/${id}`);
            fetchData();
        } catch (err) { alert('Error al eliminar excepción'); }
    };

    const assignedStates = zones.reduce((acc, z) => {
        if (editingZone && z.id === editingZone.id) return acc;
        return [...acc, ...(z.states || [])];
    }, []);

    const inputStyle = { width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', marginTop: '0.25rem' };
    const labelStyle = { display: 'block', fontWeight: '700', fontSize: '0.85rem', color: '#374151' };

    return (
        <AdminLayout activeTab="shipping_settings">
            <Head title="Configuración de Envío - Admin" />

            <style>{`
                .status-container { position: relative; display: inline-block; }
                .status-tooltip {
                    visibility: hidden;
                    width: 180px;
                    background-color: #334155;
                    color: #fff;
                    text-align: center;
                    border-radius: 6px;
                    padding: 8px;
                    position: absolute;
                    z-index: 100;
                    bottom: 125%;
                    left: 50%;
                    margin-left: -90px;
                    opacity: 0;
                    transition: opacity 0.3s;
                    font-size: 0.75rem;
                    pointer-events: none;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                    line-height: 1.2;
                }
                .status-container:hover .status-tooltip {
                    visibility: visible;
                    opacity: 1;
                }
                .status-tooltip::after {
                    content: "";
                    position: absolute;
                    top: 100%;
                    left: 50%;
                    margin-left: -5px;
                    border-width: 5px;
                    border-style: solid;
                    border-color: #334155 transparent transparent transparent;
                }
            `}</style>

            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.5rem' }}>Configuración de Envío</h2>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Gestiona las zonas estatales y las excepciones por ciudad</p>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid #e2e8f0', marginBottom: '2rem' }}>
                    <button
                        onClick={() => setActiveTab('zones')}
                        style={{
                            padding: '1rem 1.5rem', border: 'none', background: 'none', cursor: 'pointer',
                            fontSize: '1rem', fontWeight: '800', transition: 'all 0.2s',
                            color: activeTab === 'zones' ? '#01A0AD' : '#64748b',
                            borderBottom: activeTab === 'zones' ? '3px solid #01A0AD' : '3px solid transparent'
                        }}
                    >
                        <i className="fas fa-map-marked-alt"></i> Zonas por Estado
                    </button>
                    <button
                        onClick={() => setActiveTab('exceptions')}
                        style={{
                            padding: '1rem 1.5rem', border: 'none', background: 'none', cursor: 'pointer',
                            fontSize: '1rem', fontWeight: '800', transition: 'all 0.2s',
                            color: activeTab === 'exceptions' ? '#EC008C' : '#64748b',
                            borderBottom: activeTab === 'exceptions' ? '3px solid #EC008C' : '3px solid transparent'
                        }}
                    >
                        <i className="fas fa-city"></i> Ciudades Excepción
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '5rem' }}>
                        <i className="fas fa-spinner fa-spin fa-3x" style={{ color: '#01A0AD' }}></i>
                    </div>
                ) : (
                    <>
                        {/* TAB: ZONES */}
                        {activeTab === 'zones' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                                    <button
                                        onClick={() => handleOpenZoneModal()}
                                        style={{ padding: '0.75rem 1.5rem', background: '#01A0AD', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        <i className="fas fa-plus"></i> Nueva Zona
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                                    {zones.map(zone => (
                                        <div key={zone.id} style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', border: '1px solid #f1f5f9' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>{zone.name}</h3>
                                                <div style={{ padding: '0.4rem 0.8rem', background: '#f0fdfa', borderRadius: '20px', fontSize: '1.1rem', fontWeight: '900', color: '#007580' }}>${zone.price}</div>
                                            </div>
                                            <div style={{ flex: 1, marginBottom: '1.5rem' }}>
                                                <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Estados asignados:</p>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                                    {zone.states?.map(s => (
                                                        <span key={s} style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', background: '#f8fafc', color: '#475569', borderRadius: '8px', border: '1px solid #e2e8f0', fontWeight: '600' }}>{s}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
                                                <button onClick={() => handleOpenZoneModal(zone)} style={{ flex: 1, padding: '0.6rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                    <i className="fas fa-edit"></i> Editar
                                                </button>
                                                <button onClick={() => handleDeleteZone(zone.id)} style={{ padding: '0.6rem 1rem', background: '#fff1f2', color: '#be123c', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {zones.length === 0 && (
                                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                            No hay zonas de envío registradas.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB: EXCEPTIONS */}
                        {activeTab === 'exceptions' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
                                    <div className="status-container">
                                        <i className="fas fa-exclamation-circle" style={{ color: '#64748b', fontSize: '1.2rem', cursor: 'help' }}></i>
                                        <div className="status-tooltip" style={{ width: '250px', marginLeft: '-125px' }}>
                                            Establece precios de envío personalizados para ciudades específicas. 
                                            Si el cliente escribe una de estas ciudades, se cobrará este precio 
                                            en lugar de la tarifa general del estado.
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleOpenExceptionModal()}
                                        style={{ padding: '0.75rem 1.5rem', background: '#EC008C', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(236,0,140,0.2)' }}
                                    >
                                        <i className="fas fa-plus"></i> Nueva Excepción
                                    </button>
                                </div>
                                <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 30px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                                        <thead>
                                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#64748b' }}>Estado</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#64748b' }}>Ciudad</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#64748b' }}>Precio</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#64748b' }}>Estatus</th>
                                                <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {exceptions.map(exc => (
                                                <tr key={exc.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                                                    <td style={{ padding: '1rem', fontWeight: '700', fontSize: '0.9rem' }}>{exc.state_name}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ fontWeight: '800', color: '#0f172a' }}>{exc.city_name}</div>
                                                    </td>
                                                    <td style={{ padding: '1rem', fontWeight: '900', color: '#10b981', fontSize: '1rem' }}>${exc.price}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: exc.active ? '#166534' : '#991b1b' }}>
                                                            {exc.active ? 'ACTIVO' : 'INACTIVO'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                            <button onClick={() => handleOpenExceptionModal(exc)} style={{ padding: '0.5rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer' }}><i className="fas fa-edit"></i></button>
                                                            <button onClick={() => handleDeleteException(exc.id)} style={{ padding: '0.5rem', background: '#fff1f2', color: '#be123c', border: 'none', borderRadius: '8px', cursor: 'pointer' }}><i className="fas fa-trash"></i></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {exceptions.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>No hay ciudades excepción registradas.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal: ZONES */}
            {showZoneModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #f1f5f9' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>{editingZone ? 'Editar Zona Estatal' : 'Nueva Zona Estatal'}</h3>
                            <button onClick={() => setShowZoneModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
                        </div>
                        <form onSubmit={handleZoneSubmit} style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '1.25rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <label style={labelStyle}>Nombre de la Zona</label>
                                    <input style={inputStyle} value={zoneForm.name} onChange={e => setZoneForm({ ...zoneForm, name: e.target.value })} placeholder="Ej. Centro" required />
                                </div>
                                <div>
                                    <label style={labelStyle}>Precio ($)</label>
                                    <input type="number" step="0.01" style={inputStyle} value={zoneForm.price} onChange={e => setZoneForm({ ...zoneForm, price: e.target.value })} placeholder="150" required />
                                </div>
                            </div>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ ...labelStyle, marginBottom: '0.75rem' }}>Estados de México</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}>
                                    {MEXICO_STATES.map(state => {
                                        const isSelected = zoneForm.states.includes(state);
                                        const isAssignedElsewhere = assignedStates.includes(state);
                                        return (
                                            <div key={state} onClick={() => !isAssignedElsewhere && handleToggleState(state)} style={{
                                                padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', cursor: isAssignedElsewhere ? 'not-allowed' : 'pointer',
                                                border: '1.5px solid', borderColor: isSelected ? '#01A0AD' : 'transparent',
                                                background: isSelected ? '#ffffff' : isAssignedElsewhere ? '#f1f5f9' : 'transparent',
                                                color: isSelected ? '#007580' : isAssignedElsewhere ? '#94a3b8' : '#475569',
                                                fontWeight: isSelected ? '800' : '600', transition: 'all 0.1s', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                            }}>
                                                <i className={`fas ${isSelected ? 'fa-check-circle' : isAssignedElsewhere ? 'fa-lock' : 'fa-circle'}`} style={{ color: isSelected ? '#01A0AD' : '#cbd5e1', fontSize: '0.9rem' }}></i>
                                                {state}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" onClick={() => setShowZoneModal(false)} style={{ flex: 1, padding: '0.85rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: 'white', fontWeight: '800', cursor: 'pointer', color: '#64748b' }}>Cancelar</button>
                                <button type="submit" disabled={saving} style={{ flex: 2, padding: '0.85rem', borderRadius: '12px', border: 'none', background: '#01A0AD', color: 'white', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 12px rgba(1,160,173,0.3)' }}>{saving ? 'Guardando...' : 'Guardar Zona'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: EXCEPTIONS */}
            {showExceptionModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #f1f5f9' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>{editingException ? 'Editar Excepción' : 'Nueva Ciudad Excepción'}</h3>
                            <button onClick={() => setShowExceptionModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
                        </div>
                        <form onSubmit={handleExceptionSubmit} style={{ padding: '1.5rem' }}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={labelStyle}>Estado</label>
                                <select style={inputStyle} value={exceptionForm.state_name} onChange={e => setExceptionForm({ ...exceptionForm, state_name: e.target.value })} required>
                                    {MEXICO_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={labelStyle}>Nombre de la Ciudad</label>
                                <input style={inputStyle} value={exceptionForm.city_name} onChange={e => setExceptionForm({ ...exceptionForm, city_name: e.target.value })} placeholder="Ej. Saltillo" required />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                                <div>
                                    <label style={labelStyle}>Precio de Envío ($)</label>
                                    <input type="number" step="0.01" style={inputStyle} value={exceptionForm.price} onChange={e => setExceptionForm({ ...exceptionForm, price: e.target.value })} placeholder="99.00" required />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.25rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0, fontWeight: '700', fontSize: '0.9rem' }}>
                                        <input type="checkbox" checked={exceptionForm.active} onChange={e => setExceptionForm({ ...exceptionForm, active: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                                        Estatus Activo
                                    </label>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" onClick={() => setShowExceptionModal(false)} style={{ flex: 1, padding: '0.85rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: 'white', fontWeight: '800', cursor: 'pointer', color: '#64748b' }}>Cancelar</button>
                                <button type="submit" disabled={saving} style={{ flex: 2, padding: '0.85rem', borderRadius: '12px', border: 'none', background: '#EC008C', color: 'white', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 12px rgba(236,0,140,0.3)' }}>{saving ? 'Guardando...' : 'Guardar Excepción'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
