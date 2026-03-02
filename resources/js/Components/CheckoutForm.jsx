import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import axios from 'axios';
import PreviewCanvas from '@/Components/PreviewCanvas';

const MEXICAN_STATES = [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
    'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango',
    'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco',
    'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla',
    'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora',
    'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas',
];

export default function CheckoutForm({ selectedBrand, selectedModel, layers, updateLayer, selectedLayerId, setSelectedLayerId, deleteLayer, getImageUrl }) {
    const PRICE = 350.00;
    const SHIPPING = 100.00;
    const TOTAL = PRICE + SHIPPING;

    const [form, setForm] = useState({
        first_name: '', last_name: '', country: 'México',
        address_line1: '', address_line2: '',
        city: '', state: 'Coahuila', zip_code: '',
        phone: '', customer_email: '', order_notes: '',
        card_number: '', card_expiry: '', card_cvv: '',
        agreed_terms: false, coupon_code: '',
        ship_to_different_address: false,
        shipping_first_name: '', shipping_last_name: '', shipping_country: 'México',
        shipping_address_line1: '', shipping_address_line2: '',
        shipping_city: '', shipping_state: 'Coahuila', shipping_zip_code: '',
        shipping_phone: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleCardNumber = (e) => {
        let val = e.target.value.replace(/\D/g, '').substring(0, 16);
        val = val.replace(/(.{4})/g, '$1 ').trim();
        setForm(prev => ({ ...prev, card_number: val }));
    };

    const handleExpiry = (e) => {
        let val = e.target.value.replace(/\D/g, '').substring(0, 4);
        if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2);
        setForm(prev => ({ ...prev, card_expiry: val }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.agreed_terms) { setError('Debes aceptar los términos y condiciones.'); return; }
        if (!form.card_number || form.card_number.replace(/\s/g, '').length < 16) {
            setError('Ingresa un número de tarjeta válido.'); return;
        }
        setLoading(true);
        setError('');
        try {
            await axios.post('/api/orders', {
                customer_email: form.customer_email,
                model_id: selectedModel?.id,
                customization_data: { layers },
                total_price: TOTAL,
                shipping_price: SHIPPING,
                first_name: form.first_name,
                last_name: form.last_name,
                country: form.country,
                address_line1: form.address_line1,
                address_line2: form.address_line2,
                city: form.city,
                state: form.state,
                zip_code: form.zip_code,
                phone: form.phone,
                order_notes: form.order_notes,
                payment_method: 'card',
                // Shipping fields
                ...(form.ship_to_different_address ? {
                    shipping_first_name: form.shipping_first_name,
                    shipping_last_name: form.shipping_last_name,
                    shipping_country: form.shipping_country,
                    shipping_address_line1: form.shipping_address_line1,
                    shipping_address_line2: form.shipping_address_line2,
                    shipping_city: form.shipping_city,
                    shipping_state: form.shipping_state,
                    shipping_zip_code: form.shipping_zip_code,
                    shipping_phone: form.shipping_phone,
                } : {})
            });
            setSuccess(true);
        } catch (err) {
            const errors = err.response?.data?.errors;
            if (errors) setError(Object.values(errors).flat().join(', '));
            else setError(err.response?.data?.message || 'Error al procesar el pedido.');
        } finally {
            setLoading(false);
        }
    };

    if (success) return (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2rem', color: '#059669' }}>
                <i className="fas fa-check-circle"></i>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#059669', marginBottom: '0.5rem' }}>¡Pedido Realizado!</h2>
            <p style={{ color: '#6b7280', fontFamily: 'var(--font-secondary)' }}>
                Gracias por tu compra. Recibirás un correo de confirmación en breve.
            </p>
            <Link href="/" className="btn btn-primary" style={{ marginTop: '2rem', display: 'inline-block' }}>
                Volver al Inicio
            </Link>
        </div>
    );

    return (
        <>
            <style>{`
                .checkout-layout { display: grid; grid-template-columns: 1fr 380px; gap: 1rem; align-items: start; }
                @media (max-width: 1100px) { .checkout-layout { grid-template-columns: 1fr; } }
                .checkout-section { background: white; border: 1px solid #e5e7eb; border-radius: 4px; padding: 1.5rem; margin-bottom: 1.5rem; }
                .checkout-label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.25rem; color: #374151; }
                .checkout-label .req { color: var(--color-primary); }
                .checkout-input { width: 100%; padding: 0.55rem 0.8rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.9rem; font-family: var(--font-primary); outline: none; transition: border 0.2s; box-sizing: border-box; }
                .checkout-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px rgba(1,160,173,0.1); }
                .checkout-select { width: 100%; padding: 0.55rem 0.8rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.9rem; font-family: var(--font-primary); background: white; outline: none; transition: border 0.2s; box-sizing: border-box; }
                .checkout-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                @media (max-width: 600px) { .checkout-row-2 { grid-template-columns: 1fr; } }
                .checkout-title { font-size: 0.95rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #1f2937; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #f3f4f6; }
                .order-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 0.5rem 0; font-size: 0.9rem; }
                .order-row-label { color: var(--color-primary); font-weight: 600; }
                .order-row-value { color: var(--color-primary); font-weight: 700; }
                .order-divider { border: none; border-top: 1px solid #e5e7eb; margin: 0.5rem 0; }
                .checkout-card-icons-inside { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); display: flex; gap: 3px; pointer-events: none; }
                .payment-section-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
                .terms-text { font-size: 0.82rem; color: #6b7280; line-height: 1.5; margin: 1rem 0; }
                .terms-text a { color: var(--color-primary); text-decoration: underline; }
                .btn-realizar { width: 100%; padding: 0.9rem; background: var(--color-secondary); color: white; border: none; border-radius: 4px; font-size: 1rem; font-weight: 800; cursor: pointer; letter-spacing: 0.05em; transition: background 0.2s; text-transform: uppercase; }
                .btn-realizar:hover:not(:disabled) { background: #d10079; }
                .btn-realizar:disabled { opacity: 0.6; cursor: not-allowed; }
                .checkout-heading { font-size: 1.6rem; font-weight: 800; text-align: center; letter-spacing: 0.02em; margin-bottom: 1.5rem; color: #1f2937; }
                .ya-cliente { font-size: 0.85rem; color: #374151; margin-bottom: 1rem; }
                .ya-cliente a { color: var(--color-primary); font-weight: 700; text-decoration: none; }
                .coupon-row { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
                .coupon-row input { flex: 1; min-width: 80px; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.85rem; outline: none; }
                .coupon-btn { padding: 0.5rem 1rem; background: var(--color-primary); color: white; border: none; border-radius: 4px; font-size: 0.8rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
                .coupon-text { font-size: 0.85rem; color: #374151; white-space: nowrap; }
            `}</style>

            <h2 className="checkout-heading">FINALIZAR COMPRA</h2>

            {error && (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fas fa-exclamation-circle"></i> {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="checkout-layout">

                    {/* ── COLUMNA IZQUIERDA ── */}
                    <div>

                        {/* Datos de Facturación */}
                        <div className="checkout-section" style={{ borderRadius: '10px', boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.12)' }}>
                            <p className="checkout-title">Detalles de Facturación</p>

                            <div className="checkout-row-2" style={{ marginBottom: '0.85rem' }}>
                                <div>
                                    <label className="checkout-label">First Name <span className="req">*</span></label>
                                    <input className="checkout-input" type="text" name="first_name" placeholder="First Name" value={form.first_name} onChange={handleChange} required />
                                </div>
                                <div>
                                    <label className="checkout-label">Last Name <span className="req">*</span></label>
                                    <input className="checkout-input" type="text" name="last_name" placeholder="Last Name" value={form.last_name} onChange={handleChange} required />
                                </div>
                            </div>

                            <div style={{ marginBottom: '0.85rem' }}>
                                <label className="checkout-label">País / Región <span className="req">*</span></label>
                                <div style={{ color: '#374151', fontSize: '0.9rem', padding: '0.4rem 0' }}>México</div>
                            </div>

                            <div style={{ marginBottom: '0.85rem' }}>
                                <label className="checkout-label">Dirección de la calle <span className="req">*</span></label>
                                <input className="checkout-input" type="text" name="address_line1" placeholder="Nombre de la calle y número de la casa" value={form.address_line1} onChange={handleChange} required style={{ marginBottom: '0.5rem' }} />
                                <input className="checkout-input" type="text" name="address_line2" placeholder="Apartamento, habitación, etc. (opcional)" value={form.address_line2} onChange={handleChange} />
                            </div>

                            <div style={{ marginBottom: '0.85rem' }}>
                                <label className="checkout-label">Población <span className="req">*</span></label>
                                <input className="checkout-input" type="text" name="city" value={form.city} onChange={handleChange} required />
                            </div>

                            <div style={{ marginBottom: '0.85rem' }}>
                                <label className="checkout-label">Región / Provincia <span className="req">*</span></label>
                                <select className="checkout-select" name="state" value={form.state} onChange={handleChange} required>
                                    {MEXICAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <div style={{ marginBottom: '0.85rem' }}>
                                <label className="checkout-label">Código postal / ZIP <span className="req">*</span></label>
                                <input className="checkout-input" type="text" name="zip_code" value={form.zip_code} onChange={handleChange} required maxLength={10} />
                            </div>

                            <div style={{ marginBottom: '0.85rem' }}>
                                <label className="checkout-label">Phone (opcional)</label>
                                <input className="checkout-input" type="tel" name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
                            </div>

                            <div style={{ marginBottom: '0.85rem' }}>
                                <label className="checkout-label">Email Address <span className="req">*</span></label>
                                <input className="checkout-input" type="email" name="customer_email" placeholder="Email Address" value={form.customer_email} onChange={handleChange} required />
                            </div>
                        </div>

                        {/* Enviar a otra dirección */}
                        <div className="checkout-section" style={{ borderRadius: '10px', boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.12)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '600' }}>
                                <input
                                    type="checkbox"
                                    name="ship_to_different_address"
                                    checked={form.ship_to_different_address}
                                    onChange={handleChange}
                                    style={{ width: '15px', height: '15px' }}
                                />
                                Enviar a otra dirección
                            </label>

                            {/* Formulario de envío (con animación simple de CSS) */}
                            <div style={{
                                maxHeight: form.ship_to_different_address ? '1000px' : '0',
                                overflow: 'hidden',
                                transition: 'max-height 0.5s ease-in-out',
                                marginTop: form.ship_to_different_address ? '1.5rem' : '0'
                            }}>
                                <div className="checkout-row-2" style={{ marginBottom: '0.85rem' }}>
                                    <div>
                                        <label className="checkout-label">First Name <span className="req">*</span></label>
                                        <input className="checkout-input" type="text" name="shipping_first_name" placeholder="First Name" value={form.shipping_first_name} onChange={handleChange} required={form.ship_to_different_address} />
                                    </div>
                                    <div>
                                        <label className="checkout-label">Last Name <span className="req">*</span></label>
                                        <input className="checkout-input" type="text" name="shipping_last_name" placeholder="Last Name" value={form.shipping_last_name} onChange={handleChange} required={form.ship_to_different_address} />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '0.85rem' }}>
                                    <label className="checkout-label">País / Región <span className="req">*</span></label>
                                    <div style={{ color: '#374151', fontSize: '0.9rem', padding: '0.4rem 0' }}>México</div>
                                </div>

                                <div style={{ marginBottom: '0.85rem' }}>
                                    <label className="checkout-label">Dirección de la calle <span className="req">*</span></label>
                                    <input className="checkout-input" type="text" name="shipping_address_line1" placeholder="Nombre de la calle y número de la casa" value={form.shipping_address_line1} onChange={handleChange} required={form.ship_to_different_address} style={{ marginBottom: '0.5rem' }} />
                                    <input className="checkout-input" type="text" name="shipping_address_line2" placeholder="Apartamento, habitación, etc. (opcional)" value={form.shipping_address_line2} onChange={handleChange} />
                                </div>

                                <div style={{ marginBottom: '0.85rem' }}>
                                    <label className="checkout-label">Población <span className="req">*</span></label>
                                    <input className="checkout-input" type="text" name="shipping_city" value={form.shipping_city} onChange={handleChange} required={form.ship_to_different_address} />
                                </div>

                                <div style={{ marginBottom: '0.85rem' }}>
                                    <label className="checkout-label">Región / Provincia <span className="req">*</span></label>
                                    <select className="checkout-select" name="shipping_state" value={form.shipping_state} onChange={handleChange} required={form.ship_to_different_address}>
                                        {MEXICAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>

                                <div style={{ marginBottom: '0.85rem' }}>
                                    <label className="checkout-label">Código postal / ZIP <span className="req">*</span></label>
                                    <input className="checkout-input" type="text" name="shipping_zip_code" value={form.shipping_zip_code} onChange={handleChange} required={form.ship_to_different_address} maxLength={10} />
                                </div>

                                <div style={{ marginBottom: '0.85rem' }}>
                                    <label className="checkout-label">Teléfono (opcional)</label>
                                    <input className="checkout-input" type="tel" name="shipping_phone" placeholder="Phone" value={form.shipping_phone} onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        {/* Notas */}
                        <div className="checkout-section" style={{ borderRadius: '10px', boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.12)' }}>
                            <p className="checkout-title">Notas del pedido (opcional)</p>
                            <textarea
                                className="checkout-input"
                                name="order_notes"
                                placeholder="Notas sobre tu pedido, por ejemplo, notas especiales para la entrega."
                                value={form.order_notes}
                                onChange={handleChange}
                                rows={4}
                                style={{ resize: 'vertical' }}
                            />
                        </div>
                    </div>

                    {/* ── COLUMNA DERECHA ── */}
                    <div>
                        {/* Resumen del Pedido */}
                        <div className="checkout-section" style={{ borderRadius: '10px', boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.12)' }}>
                            <p className="checkout-title" style={{ borderBottom: 'none', paddingBottom: 0 }}>Tu Pedido</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                                <span className="order-row-label" style={{ fontSize: '0.8rem' }}>Producto</span>
                                <span className="order-row-label" style={{ fontSize: '0.8rem' }}>Subtotal</span>
                            </div>
                            <div className="order-row">
                                <span style={{ fontSize: '0.85rem', color: '#374151', flex: 1 }}>
                                    Funda {selectedBrand?.name} {selectedModel?.name} × 1
                                </span>
                                <span style={{ fontSize: '0.85rem', color: '#374151' }}>${PRICE.toFixed(2)}</span>
                            </div>
                            <hr className="order-divider" />
                            <div className="order-row">
                                <span className="order-row-label">Subtotal</span>
                                <span className="order-row-value">${PRICE.toFixed(2)}</span>
                            </div>
                            <div className="order-row">
                                <span className="order-row-label">Envío 1</span>
                                <span style={{ fontSize: '0.85rem', color: '#374151', textAlign: 'right' }}>
                                    Precio fijo Nacional:<br /><strong>${SHIPPING.toFixed(2)}</strong>
                                </span>
                            </div>
                            <hr className="order-divider" />
                            <div className="order-row">
                                <span className="order-row-label" style={{ fontSize: '1rem' }}>Total</span>
                                <span className="order-row-value" style={{ fontSize: '1.1rem' }}>${TOTAL.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Cupón */}
                        <div className="checkout-section" style={{ padding: '1rem 1.5rem', borderRadius: '10px', boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.12)' }}>
                            <div className="coupon-row">
                                <span className="coupon-text">¿TIENES UN CUPÓN?</span>
                                <input type="text" placeholder="" value={form.coupon_code} onChange={e => setForm(p => ({ ...p, coupon_code: e.target.value }))} />
                                <button type="button" className="coupon-btn">APLICAR AQUÍ</button>
                            </div>
                        </div>

                        {/* Pago con Tarjeta */}
                        <div className="checkout-section" style={{ borderRadius: '10px', boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.12)' }}>
                            <div className="payment-section-title">
                                <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1f2937' }}>Tarjeta de Crédito / Débito</span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {/* VISA */}
                                    <svg width="34" height="22" viewBox="0 0 34 22" style={{ border: '1px solid #e5e7eb', borderRadius: '3px' }}>
                                        <rect width="34" height="22" fill="white" />
                                        <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#1A1F71" fontFamily="Arial">VISA</text>
                                    </svg>
                                    {/* Mastercard */}
                                    <svg width="34" height="22" viewBox="0 0 34 22" style={{ border: '1px solid #e5e7eb', borderRadius: '3px' }}>
                                        <rect width="34" height="22" fill="white" />
                                        <circle cx="13" cy="11" r="7" fill="#EB001B" opacity="0.9" />
                                        <circle cx="21" cy="11" r="7" fill="#F79E1B" opacity="0.9" />
                                        <ellipse cx="17" cy="11" rx="3" ry="7" fill="#FF5F00" opacity="0.85" />
                                    </svg>
                                    {/* Amex */}
                                    <svg width="34" height="22" viewBox="0 0 34 22" style={{ border: '1px solid #e5e7eb', borderRadius: '3px', background: '#016FD0' }}>
                                        <rect width="34" height="22" fill="#016FD0" />
                                        <text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle" fontSize="7" fontWeight="bold" fill="white" fontFamily="Arial">AMEX</text>
                                    </svg>
                                </div>
                            </div>

                            {/* Card Number */}
                            <div style={{ marginBottom: '0.85rem' }}>
                                <label className="checkout-label">Número de tarjeta</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        className="checkout-input"
                                        type="text"
                                        placeholder="1234 1234 1234 1234"
                                        value={form.card_number}
                                        onChange={handleCardNumber}
                                        maxLength={19}
                                        style={{ paddingRight: '110px' }}
                                    />
                                    <div className="checkout-card-icons-inside">
                                        <svg width="28" height="18" viewBox="0 0 34 22"><rect width="34" height="22" fill="white" stroke="#e5e7eb" /><text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#1A1F71" fontFamily="Arial">VISA</text></svg>
                                        <svg width="28" height="18" viewBox="0 0 34 22"><rect width="34" height="22" fill="white" stroke="#e5e7eb" /><circle cx="13" cy="11" r="7" fill="#EB001B" opacity="0.9" /><circle cx="21" cy="11" r="7" fill="#F79E1B" opacity="0.9" /><ellipse cx="17" cy="11" rx="3" ry="7" fill="#FF5F00" opacity="0.85" /></svg>
                                        <svg width="28" height="18" viewBox="0 0 34 22"><rect width="34" height="22" fill="#016FD0" /><text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle" fontSize="7" fontWeight="bold" fill="white" fontFamily="Arial">AMEX</text></svg>
                                    </div>
                                </div>
                            </div>

                            {/* Expiry + CVV */}
                            <div className="checkout-row-2">
                                <div>
                                    <label className="checkout-label">Fecha de caducidad</label>
                                    <input className="checkout-input" type="text" placeholder="MM / AA" value={form.card_expiry} onChange={handleExpiry} maxLength={5} />
                                </div>
                                <div>
                                    <label className="checkout-label">Código de seguridad</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            className="checkout-input"
                                            type="text"
                                            placeholder="CVC"
                                            name="card_cvv"
                                            value={form.card_cvv}
                                            onChange={e => setForm(p => ({ ...p, card_cvv: e.target.value.replace(/\D/, '').substring(0, 4) }))}
                                            maxLength={4}
                                            style={{ paddingRight: '36px' }}
                                        />
                                        <i className="fas fa-credit-card" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '0.9rem', pointerEvents: 'none' }}></i>
                                    </div>
                                </div>
                            </div>

                            {/* Privacy notice */}
                            <p className="terms-text">
                                Your personal data will be used to process your order, support your experience throughout
                                this website, and for other purposes described in our <a href="#">política de privacidad</a>.
                            </p>

                            {/* Terms */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '1rem' }}>
                                <input
                                    type="checkbox"
                                    id="agreed_terms"
                                    name="agreed_terms"
                                    checked={form.agreed_terms}
                                    onChange={handleChange}
                                    style={{ width: '15px', height: '15px', marginTop: '2px', flexShrink: 0 }}
                                />
                                <label htmlFor="agreed_terms" style={{ fontSize: '0.85rem', color: '#374151', lineHeight: '1.5', cursor: 'pointer' }}>
                                    He leído y estoy de acuerdo con los{' '}
                                    <a href="#" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>términos y condiciones</a>{' '}
                                    de la web <span style={{ color: 'var(--color-secondary)' }}>*</span>
                                </label>
                            </div>

                            {/* Botón de pago */}
                            <button type="submit" className="btn-realizar" disabled={loading}>
                                {loading
                                    ? <><i className="fas fa-spinner fa-spin"></i> Procesando...</>
                                    : 'REALIZAR EL PEDIDO'
                                }
                            </button>
                        </div>

                        {/* Vista Previa de la Funda Personalizada */}
                        {selectedModel && (
                            <div className="checkout-section" style={{ padding: '1.5rem', textAlign: 'center', borderRadius: '10px', boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.12)' }}>
                                <p className="checkout-title" style={{ textAlign: 'left' }}>Tu Funda Personalizada</p>
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '320px', background: '#f9f9f9', borderRadius: '8px', padding: '1rem' }}>
                                    <div style={{ position: 'relative', width: '200px', height: '400px', background: 'white', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', overflow: 'visible' }}>
                                        <div style={{ transform: 'scale(0.67)', transformOrigin: 'top left', width: '300px', height: '600px' }}>
                                            <PreviewCanvas
                                                layers={layers}
                                                updateLayer={updateLayer || (() => { })}
                                                transparentImage={getImageUrl ? getImageUrl(selectedModel.image_transparent) : selectedModel.image_transparent}
                                                normalImage={getImageUrl ? getImageUrl(selectedModel.image_transparent) : selectedModel.image_transparent}
                                                selectedLayerId={null}
                                                setSelectedLayerId={() => { }}
                                                onDeleteLayer={() => { }}
                                                readOnly={true}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.75rem', fontFamily: 'var(--font-secondary)' }}>
                                    {selectedBrand?.name} {selectedModel?.name}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </form>
        </>
    );
}
