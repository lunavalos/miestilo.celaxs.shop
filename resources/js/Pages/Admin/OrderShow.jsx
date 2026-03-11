import React, { useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import axios from 'axios';

export default function OrderShow() {
    const { order, auth } = usePage().props;
    const [statusLoading, setStatusLoading] = useState(false);

    const handleStatusUpdate = async (newStatus) => {
        if (!confirm(`¿Cambiar el estado del pedido #${order.id} a ${newStatus}?`)) return;
        setStatusLoading(true);
        try {
            await axios.put(`/api/orders/${order.id}/status`, { status: newStatus });
            router.reload({ preserveScroll: true });
        } catch (error) {
            console.error('Error al actualizar el estado:', error);
            alert('Error al actualizar el estado del pedido');
        } finally {
            setStatusLoading(false);
        }
    };

    if (!order) {
        return (
            <AdminLayout user={auth?.user}>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <h2>Cargando pedido o pedido no encontrado...</h2>
                    <Link href="/admin/dashboard" style={{ color: '#01A0AD' }}>Volver al Panel</Link>
                </div>
            </AdminLayout>
        );
    }

    const statusColors = {
        'pendiente': { bg: '#fef3c7', text: '#92400e' },
        'en proceso': { bg: '#eff6ff', text: '#1e40af' },
        'enviado': { bg: '#dbeafe', text: '#1e40af' },
        'entregado': { bg: '#dcfce7', text: '#166534' }
    };

    const currentStatusStyle = statusColors[order.status] || { bg: '#f3f4f6', text: '#374151' };

    return (
        <AdminLayout user={auth?.user}>
            <Head title={`Pedido #${order.id || ''}`} />

            <style>{`
                .order-container {
                    padding: 2rem;
                    max-width: 1200px;
                    margin: 0 auto;
                    font-family: 'Montserrat', sans-serif;
                }
                .order-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                    gap: 2.5rem;
                    align-items: start;
                }
                @media (max-width: 768px) {
                    .order-container { padding: 1.5rem; }
                    .order-grid { gap: 1.5rem; }
                }
                @media (max-width: 480px) {
                    .order-container { padding: 1rem 0.5rem; }
                    .order-grid { 
                        grid-template-columns: 1fr;
                        gap: 1.25rem;
                    }
                    .order-header {
                        text-align: left;
                    }
                    .order-header-links {
                        justify-content: left !important;
                    }
                }
            `}</style>

            <div className="order-container">
                {/* Header Section */}
                <div className="order-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div className="order-header-info">
                        <Link
                            href="/admin/dashboard"
                            className="order-header-links"
                            style={{ color: '#01A0AD', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: '600' }}
                        >
                            <i className="fas fa-arrow-left"></i> Volver al Panel
                        </Link>
                        <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: '#1f2937' }}>Pedido #{order.id}</h1>
                        <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
                            Realizado el {order.created_at ? new Date(order.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {statusLoading && <i className="fas fa-spinner fa-spin" style={{ color: '#01A0AD' }}></i>}
                        <div style={{ position: 'relative' }}>
                            <select
                                value={order.status}
                                onChange={(e) => handleStatusUpdate(e.target.value)}
                                disabled={statusLoading}
                                style={{
                                    padding: '0.6rem 2.5rem 0.6rem 1.2rem',
                                    borderRadius: '20px',
                                    background: currentStatusStyle.bg,
                                    color: currentStatusStyle.text,
                                    fontWeight: '800',
                                    textTransform: 'uppercase',
                                    fontSize: '0.85rem',
                                    letterSpacing: '0.05em',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    appearance: 'none',
                                    outline: 'none'
                                }}
                            >
                                <option value="pendiente">Pendiente</option>
                                <option value="en proceso">En Proceso</option>
                                <option value="enviado">Enviado</option>
                                <option value="entregado">Entregado</option>
                            </select>
                            <i className="fas fa-chevron-down" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.8rem', color: currentStatusStyle.text }}></i>
                        </div>
                    </div>
                </div>

                <div className="order-grid">
                    {/* Left Column: Design Image */}
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                        <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.2rem', fontWeight: '800', color: '#1e293b', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <i className="fas fa-palette" style={{ color: '#01A0AD' }}></i> Diseño Personalizado
                        </h3>
                        {order.preview_image ? (
                            <div style={{ position: 'relative', display: 'inline-block', padding: '15px', background: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0', width: '100%' }}>
                                <img
                                    src={order.preview_image}
                                    alt="Vista previa del diseño"
                                    style={{ maxWidth: '100%', height: 'auto', borderRadius: '12px', maxHeight: '600px', objectFit: 'contain' }}
                                />
                                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'white', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                    <div style={{ fontSize: '1rem', color: '#01A0AD', fontWeight: '800' }}>
                                        {order.phone_model?.brand?.name || ''}
                                    </div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1e293b' }}>
                                        {order.phone_model?.name || 'Modelo no especificado'}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ padding: '6rem 2rem', background: '#f9fafb', borderRadius: '20px', color: '#9ca3af', border: '2px dashed #e2e8f0' }}>
                                <i className="fas fa-image" style={{ fontSize: '4rem', marginBottom: '1.5rem', opacity: 0.3 }}></i>
                                <p style={{ fontWeight: '600' }}>No hay imagen de previsualización disponible</p>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Order Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* Status Bubbles Explanation */}
                        <div style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', padding: '1.25rem', borderRadius: '20px', border: '1px solid #bae6fd' }}>
                            <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: '#0369a1', fontWeight: '900', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <i className="fas fa-info-circle"></i> Estados del Pedido
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem', color: '#0c4a6e' }}>
                                <div style={{ background: 'rgba(255,255,255,0.4)', padding: '0.5rem', borderRadius: '8px' }}><strong>Pendiente:</strong> Pedido realizado.</div>
                                <div style={{ background: 'rgba(255,255,255,0.4)', padding: '0.5rem', borderRadius: '8px' }}><strong>En Proceso:</strong> Por enviar.</div>
                                <div style={{ background: 'rgba(255,255,255,0.4)', padding: '0.5rem', borderRadius: '8px' }}><strong>Enviado:</strong> En tránsito.</div>
                                <div style={{ background: 'rgba(255,255,255,0.4)', padding: '0.5rem', borderRadius: '8px' }}><strong>Entregado:</strong> Entregado.</div>
                            </div>
                        </div>

                        {/* Customer & Shipping Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                            {/* Billing Section (Always shown) */}
                            <div style={{ background: 'white', padding: '1.75rem', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                                <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: '800', color: '#01A0AD', borderBottom: '2px solid #f0fdfa', paddingBottom: '0.5rem' }}>
                                    <i className="fas fa-file-invoice"></i> {order.shipping_address_line1 ? 'Datos de Facturación' : 'Datos de Facturación / Destino de Envío'}
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    <div><label style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Nombre completo</label><p style={{ margin: 0, fontWeight: '600' }}>{order.first_name} {order.last_name}</p></div>
                                    <div><label style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Correo electrónico</label><p style={{ margin: 0, fontWeight: '600', color: '#01A0AD' }}>{order.customer_email}</p></div>
                                    <div><label style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Dirección principal</label><p style={{ margin: 0, fontSize: '0.95rem' }}>{order.address_line1}</p></div>
                                    {order.address_line2 && <div><label style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Espec. Domicilio</label><p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>{order.address_line2}</p></div>}
                                    <div><label style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Ubicación</label><p style={{ margin: 0, fontSize: '0.95rem' }}>{order.city}, {order.state} - {order.zip_code}</p></div>
                                    <div><label style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Teléfono</label><p style={{ margin: 0, fontWeight: '700' }}>{order.phone || '—'}</p></div>
                                    {order.order_notes && (
                                        <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fef3c7' }}>
                                            <label style={{ fontSize: '0.72rem', color: '#92400e', textTransform: 'uppercase', fontWeight: '800', display: 'block', marginBottom: '0.25rem' }}>
                                                <i className="fas fa-comment-alt"></i> Notas del Comprador
                                            </label>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#78350f', lineHeight: '1.4', fontWeight: '500' }}>{order.order_notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Shipping Section (Only if different) */}
                            {order.shipping_address_line1 && (
                                <div style={{ background: 'white', padding: '1.75rem', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                                    <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: '800', color: '#EC008C', borderBottom: '2px solid #fff1f2', paddingBottom: '0.5rem' }}>
                                        <i className="fas fa-truck"></i> Destino de Envío
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                        <div><label style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Recibe</label><p style={{ margin: 0, fontWeight: '600' }}>{order.shipping_first_name} {order.shipping_last_name}</p></div>
                                        <div><label style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Dirección alternativa</label><p style={{ margin: 0, fontSize: '0.95rem' }}>{order.shipping_address_line1}</p></div>
                                        {order.shipping_address_line2 && <div><label style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Espec. Domicilio</label><p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>{order.shipping_address_line2}</p></div>}
                                        <div><label style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Ubicación</label><p style={{ margin: 0, fontSize: '0.95rem' }}>{order.shipping_city}, {order.shipping_state} - {order.shipping_zip_code}</p></div>
                                        <div><label style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Teléfono envío</label><p style={{ margin: 0, fontWeight: '700' }}>{order.shipping_phone || '—'}</p></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Payment & Summary */}
                        <div style={{ background: '#0f172a', padding: '2rem', borderRadius: '24px', color: 'white', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ margin: '0 0 1.5rem', fontSize: '1rem', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Detalles de pago
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem' }}>
                                    <span style={{ color: '#94a3b8' }}>Precio Base del Producto:</span>
                                    <span style={{ fontWeight: '600' }}>${(parseFloat(order.total_price || 0) - parseFloat(order.shipping_price || 0)).toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem' }}>
                                    <span style={{ color: '#94a3b8' }}>Gastos de Envío:</span>
                                    <span style={{ fontWeight: '600' }}>${parseFloat(order.shipping_price || 0).toFixed(2)}</span>
                                </div>
                                <div style={{ height: '1px', background: '#1e293b', margin: '0.5rem 0' }}></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: '900', color: '#10b981' }}>
                                    <span>Total:</span>
                                    <span>${parseFloat(order.total_price || 0).toFixed(2)} <small style={{ fontSize: '0.8rem', verticalAlign: 'middle', color: '#94a3b8' }}>MXN</small></span>
                                </div>
                                <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#1e293b', borderRadius: '12px', fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <i className="fas fa-shield-check" style={{ color: '#10b981' }}></i>
                                    <span>ID Transacción: <strong style={{ color: 'white' }}>{order.transaction_id || 'N/A'}</strong></span>
                                </div>
                            </div>
                        </div>



                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
