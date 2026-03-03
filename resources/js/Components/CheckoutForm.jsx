import React, { useState, useRef } from 'react';
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
    const [showTerms, setShowTerms] = useState(false);

    // Stripe Vanilla Elements state
    const [stripeInstance, setStripeInstance] = useState(null);
    const [cardInstance, setCardInstance] = useState(null);
    const [paymentConfig, setPaymentConfig] = useState({ is_active: true, message: '' });
    const previewRef = useRef(null);

    // Initial config for Stripe
    React.useEffect(() => {
        const initStripe = async () => {
            try {
                const res = await axios.get('/api/payments/config');
                setPaymentConfig(res.data);

                if (res.data.is_active && res.data.publishable_key) {
                    await loadScript('https://js.stripe.com/v3/');
                    if (!window.Stripe) return;

                    const stripe = window.Stripe(res.data.publishable_key);
                    const elements = stripe.elements();
                    const card = elements.create('card', {
                        hidePostalCode: true,
                        style: {
                            base: {
                                fontSize: '16px',
                                color: '#374151',
                                fontFamily: 'var(--font-primary), sans-serif',
                                '::placeholder': { color: '#9ca3af' },
                                padding: '10px 12px',
                            },
                            invalid: { color: '#991b1b' },
                        }
                    });

                    // Mount card element
                    const mountInterval = setInterval(() => {
                        const el = document.getElementById('card-element');
                        if (el) {
                            card.mount('#card-element');
                            setStripeInstance(stripe);
                            setCardInstance(card);
                            clearInterval(mountInterval);
                        }
                    }, 100);

                    return () => clearInterval(mountInterval);
                }
            } catch (err) {
                console.error("Error loading Stripe config:", err);
            }
        };
        initStripe();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };


    // Helpers para cargar scripts
    const loadScript = (src) => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.agreed_terms) { setError('Debes aceptar los términos y condiciones.'); return; }

        setLoading(true);
        setError('');

        try {
            // Capture screenshot
            const preview_image = previewRef.current?.getScreenshot();

            // 1. Prepare (Create preorder + intent)
            const prepareRes = await axios.post('/api/orders/prepare', {
                customer_email: form.customer_email,
                model_id: selectedModel?.id,
                customization_data: { layers },
                preview_image: preview_image,
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

            if (!prepareRes.data.success) {
                setError(prepareRes.data.message || 'Error al preparar el pedido.');
                setLoading(false);
                return;
            }

            const { client_secret, order_id } = prepareRes.data;

            // 2. Stripe Confirm
            const { paymentIntent, error: stripeError } = await stripeInstance.confirmCardPayment(client_secret, {
                payment_method: {
                    card: cardInstance,
                    billing_details: {
                        name: `${form.first_name} ${form.last_name}`,
                        email: form.customer_email,
                    },
                }
            });

            if (stripeError) {
                setError(`Error en el pago: ${stripeError.message}`);
                setLoading(false);
                return;
            }

            // 3. Server Finalize
            if (paymentIntent.status === 'succeeded') {
                const confirmRes = await axios.post('/api/orders/confirm', {
                    order_id: order_id,
                    payment_intent_id: paymentIntent.id
                });

                if (confirmRes.data.success) {
                    setSuccess(true);
                    setLoading(false);
                } else {
                    setError(confirmRes.data.message || 'Error al confirmar el pedido final.');
                    setLoading(false);
                }
            }
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
                .card-header-label { font-size: 0.95rem; font-weight: 700; color: #1f2937; margin-bottom: 0.5rem; display: block; }
                #card-element { 
                    padding: 0.75rem; 
                    border: 1px solid #d1d5db; 
                    border-radius: 4px; 
                    background: white; 
                    min-height: 40px; 
                    transition: border 0.2s;
                }
                #card-element.StripeElement--focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px rgba(1,160,173,0.1); }
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
                        {/* <div className="checkout-section" style={{ padding: '1rem 1.5rem', borderRadius: '10px', boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.12)' }}>
                            <div className="coupon-row">
                                <span className="coupon-text">¿TIENES UN CUPÓN?</span>
                                <input type="text" placeholder="" value={form.coupon_code} onChange={e => setForm(p => ({ ...p, coupon_code: e.target.value }))} />
                                <button type="button" className="coupon-btn">APLICAR AQUÍ</button>
                            </div>
                        </div>*/}

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

                            <div style={{ marginBottom: '1rem' }}>
                                <label className="card-header-label">Datos de la Tarjeta</label>
                                <div id="card-element">
                                    {/* Aquí se montará Stripe CardElement */}
                                    <div style={{ padding: '0.4rem', color: '#6b7280', fontSize: '0.85rem' }}>Cargando formulario de pago seguro...</div>
                                </div>
                            </div>

                            {/* Privacy notice */}
                            <p className="terms-text">
                                Your personal data will be used to process your order, support your experience throughout
                                this website, and for other purposes described in our <a href="https://celaxs.shop/aviso-de-privacidad/">política de privacidad</a>.
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
                                    <a
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); setShowTerms(!showTerms); }}
                                        style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}
                                    >
                                        términos y condiciones
                                    </a>{' '}
                                    de la web <span style={{ color: 'var(--color-secondary)' }}>*</span>
                                </label>
                            </div>

                            {/* Terms & Conditions Box */}
                            {showTerms && (
                                <div style={{
                                    background: '#f9fafb',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '1rem',
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    fontSize: '0.8rem',
                                    color: '#4b5563',
                                    lineHeight: '1.6',
                                    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)'
                                }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1f2937', marginBottom: '0.5rem' }}>Términos y Condiciones</h3>
                                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '1rem' }}>Última actualización: [27/08/2025]</p>

                                    <p>Bienvenido(a) a Celaxs.shop. Estos Términos y Condiciones regulan el uso de nuestro sitio web, así como la compra de productos en línea. Al acceder, navegar o comprar en nuestra tienda, aceptas expresamente los términos descritos a continuación.</p>

                                    <p><strong>1. Información General</strong><br />
                                        Celaxs.shop tiene domicilio en HAITI AMPLIACION 26 DE MARZO, SALTILLO COAHUILA CP 25086.<br />
                                        Nos dedicamos a la venta de accesorios innovadores para celulares.</p>

                                    <p><strong>2. Uso del Sitio</strong><br />
                                        Al acceder a Celaxs.shop te comprometes a utilizar el sitio únicamente para fines legales.<br />
                                        Está prohibido realizar actividades fraudulentas, copiar contenido, alterar información o intentar acceder sin autorización a nuestros sistemas.</p>

                                    <p><strong>3. Productos</strong><br />
                                        Todos los productos mostrados en Celaxs.shop son originales, nuevos y garantizados.<br />
                                        Las imágenes son ilustrativas, pueden existir ligeras variaciones de color o diseño dependiendo del dispositivo o lote de fabricación.<br />
                                        La disponibilidad de productos está sujeta a cambios sin previo aviso.</p>

                                    <p><strong>4. Precios y Pagos</strong><br />
                                        Los precios están expresados en pesos mexicanos (MXN) e incluyen IVA, salvo que se indique lo contrario.<br />
                                        Aceptamos métodos de pago: tarjeta de crédito/débito.<br />
                                        El pago debe acreditarse para procesar el pedido.</p>

                                    <p><strong>5. Envíos y Entregas</strong><br />
                                        Realizamos envíos a todo México mediante paqueterías como DHL, FedEx, Estafeta, etc.<br />
                                        Los tiempos de entrega estimados son de 5 a 14 días hábiles, dependiendo de la ubicación.<br />
                                        Una vez entregado el pedido a la paquetería, Celaxs.shop no se hace responsable por retrasos ajenos a nuestra operación.<br />
                                        Proporcionaremos un número de guía para rastreo.</p>

                                    <p><strong>6. Devoluciones y Garantías</strong><br />
                                        El cliente podrá solicitar cambio o devolución dentro de los 7 días posteriores a la recepción, siempre que el producto esté en condiciones originales, sin uso y con empaque completo.<br />
                                        Los costos de envío por devoluciones corren a cargo del cliente, salvo que el error sea atribuible a Celaxs.shop.<br />
                                        No aplica garantía por mal uso, golpes, humedad o manipulación indebida.</p>

                                    <p><strong>7. Responsabilidad</strong><br />
                                        Celaxs.shop no se responsabiliza por daños indirectos o derivados del mal uso de los productos.<br />
                                        El uso de accesorios en dispositivos de terceros es responsabilidad del comprador.</p>

                                    <p><strong>8. Privacidad y Protección de Datos</strong><br />
                                        En Celaxs.shop protegemos tu información de acuerdo con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.<br />
                                        Consulta nuestro Aviso de Privacidad para más detalles sobre el tratamiento de tus datos.</p>

                                    <p><strong>9. Modificaciones</strong><br />
                                        Celaxs.shop se reserva el derecho de modificar en cualquier momento estos Términos y Condiciones.<br />
                                        Las modificaciones entrarán en vigor desde su publicación en el sitio web.</p>

                                    <p><strong>10. Contacto</strong><br />
                                        Para aclaraciones, dudas o reclamos, puedes escribirnos a:<br />
                                        📧 contacto@celaxs.shop<br />
                                        📞 8448791900</p>
                                </div>
                            )}

                            {/* Botón de pago */}
                            {!paymentConfig.is_active && (
                                <div style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                                    <i className="fas fa-exclamation-triangle"></i> Pago no disponible: {paymentConfig.message || 'Configuración incompleta'}. Contacta al administrador.
                                </div>
                            )}
                            <button
                                type="submit"
                                className="btn-realizar"
                                disabled={loading || !paymentConfig.is_active}
                                style={{ opacity: (loading || !paymentConfig.is_active) ? 0.7 : 1 }}
                            >
                                {loading
                                    ? <><i className="fas fa-spinner fa-spin"></i> Procesando...</>
                                    : <><i className="fas fa-lock"></i> REALIZAR EL PEDIDO ({TOTAL} MXN)</>
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
                                                ref={previewRef}
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
