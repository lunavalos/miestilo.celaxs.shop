import React, { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';

export default function AdminLayout({ children, activeTab, onTabChange }) {
    const { auth } = usePage().props;
    const [menuOpen, setMenuOpen] = useState(false);

    const navItems = [
        { id: 'dashboard', icon: 'fa-home', label: 'Dashboard', href: route('admin.dashboard') },
        { id: 'brands', icon: 'fa-tags', label: 'Marcas' },
        { id: 'models', icon: 'fa-mobile-alt', label: 'Modelos' },
        { id: 'orders', icon: 'fa-shopping-bag', label: 'Pedidos' },
        { id: 'users', icon: 'fa-users', label: 'Usuarios' },
        { id: 'stripe_settings', icon: 'fab fa-stripe', label: 'Stripe / Pagos', href: route('admin.stripe.settings') },
    ];

    const handleNavClick = (item) => {
        if (item.href) return; // Link handles navigation

        if (onTabChange) {
            onTabChange(item.id);
        } else {
            // Si no estamos en el dashboard (donde onTabChange existe), navegamos a él
            router.get(route('admin.dashboard'), { tab: item.id });
        }
        setMenuOpen(false);
    };

    return (
        <div className="admin-layout">
            {/* ── SIDEBAR (Desktop) ── */}
            <aside className="admin-sidebar">
                {/* Logo */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #1e293b' }}>
                    <Link href="/" style={{ textDecoration: 'none' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#01A0AD', letterSpacing: '0.05em' }}>CELAX</span>
                    </Link>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', marginBottom: 0 }}>Admin Panel</p>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        const baseStyle = {
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.75rem 1.5rem', textDecoration: 'none',
                            fontSize: '0.9rem', fontWeight: isActive ? '700' : '500',
                            background: isActive ? '#1e293b' : 'transparent',
                            color: isActive ? '#01A0AD' : '#94a3b8',
                            borderLeft: isActive ? '3px solid #01A0AD' : '3px solid transparent',
                            cursor: 'pointer', transition: 'all 0.15s',
                            border: 'none', width: '100%', textAlign: 'left',
                        };

                        if (item.href) {
                            return (
                                <Link key={item.id} href={item.href} style={baseStyle}>
                                    <i className={`fas ${item.icon}`} style={{ width: '18px', textAlign: 'center' }}></i>
                                    {item.label}
                                </Link>
                            );
                        }

                        return (
                            <button
                                key={item.id}
                                style={baseStyle}
                                onClick={() => handleNavClick(item)}
                                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = 'white'; } }}
                                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
                            >
                                <i className={`fas ${item.icon}`} style={{ width: '18px', textAlign: 'center' }}></i>
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                {/* User + Logout */}
                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #1e293b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#01A0AD', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '1rem', flexShrink: 0 }}>
                            {auth.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{auth.user.name}</p>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{auth.user.email}</p>
                        </div>
                    </div>
                    <Link
                        href={route('logout')} method="post" as="button"
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
                    >
                        <i className="fas fa-sign-out-alt"></i> Cerrar Sesión
                    </Link>
                </div>
            </aside>

            {/* ── MOBILE TOPBAR ── */}
            <div className="admin-topbar">
                <Link href="/" style={{ textDecoration: 'none' }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: '900', color: '#01A0AD' }}>CELAX</span>
                </Link>
                <button
                    className="admin-hamburger"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle menu"
                >
                    <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'}`}></i>
                </button>
            </div>

            {/* ── MOBILE DROPDOWN MENU ── */}
            {menuOpen && (
                <div className="admin-mobile-menu">
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        if (item.href) {
                            return (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    className={`admin-mobile-nav-item ${isActive ? 'active' : ''}`}
                                    onClick={() => setMenuOpen(false)}
                                >
                                    <i className={`fas ${item.icon}`}></i>
                                    {item.label}
                                </Link>
                            );
                        }
                        return (
                            <button
                                key={item.id}
                                className={`admin-mobile-nav-item ${isActive ? 'active' : ''}`}
                                onClick={() => handleNavClick(item)}
                            >
                                <i className={`fas ${item.icon}`}></i>
                                {item.label}
                            </button>
                        );
                    })}
                    <div style={{ borderTop: '1px solid #e2e8f0', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#01A0AD', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '0.85rem' }}>
                                {auth.user.name.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{auth.user.name}</span>
                        </div>
                        <Link
                            href={route('logout')} method="post" as="button"
                            style={{ padding: '0.4rem 0.75rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}
                        >
                            <i className="fas fa-sign-out-alt"></i>
                        </Link>
                    </div>
                </div>
            )}

            {/* ── MAIN ── */}
            <main className="admin-main">
                {/* Header */}
                <header className="admin-header">
                    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.25rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' }}>
                                Panel de Administración
                            </h1>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', marginTop: '0.1rem' }}>
                                Gestiona marcas, modelos y pedidos
                            </p>
                        </div>
                        <Link
                            href="/"
                            className="admin-view-site-btn"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem', border: '2px solid #01A0AD', borderRadius: '50px', color: '#01A0AD', fontWeight: '700', fontSize: '0.85rem', textDecoration: 'none', transition: 'all 0.2s' }}
                        >
                            <i className="fas fa-external-link-alt"></i> Ver Sitio Web
                        </Link>
                    </div>
                </header>

                {/* Content */}
                <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem', width: '100%' }}>
                    {children}
                </div>
            </main>

            <style>{`
                /* Admin Layout Base */
                .admin-layout {
                    display: flex;
                    min-height: 100vh;
                    background: #f1f5f9;
                    font-family: 'Montserrat', sans-serif;
                }

                .admin-sidebar {
                    width: 260px;
                    min-width: 260px;
                    background: #0f172a;
                    color: white;
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                    position: sticky;
                    top: 0;
                    z-index: 100; /* Asegura que el sidebar siempre esté encima */
                }

                .admin-topbar {
                    display: none;
                }

                .admin-mobile-menu {
                    display: none;
                }

                .admin-main {
                    flex: 1;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                }

                .admin-header {
                    background: white;
                    border-bottom: 1px solid #e2e8f0;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }

                .admin-hamburger {
                    background: none;
                    border: 2px solid #0f172a;
                    border-radius: 8px;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 1.1rem;
                    color: #0f172a;
                    transition: all 0.2s;
                }

                .admin-hamburger:hover {
                    background: #0f172a;
                    color: white;
                }

                .admin-mobile-nav-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1rem;
                    text-decoration: none;
                    color: #374151;
                    font-size: 0.9rem;
                    font-weight: 500;
                    border: none;
                    background: none;
                    width: 100%;
                    text-align: left;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .admin-mobile-nav-item:hover {
                    background: #f1f5f9;
                    color: #01A0AD;
                }

                .admin-mobile-nav-item.active {
                    background: #f0fdfa;
                    color: #01A0AD;
                    font-weight: 700;
                    border-left: 3px solid #01A0AD;
                }

                .admin-mobile-nav-item i {
                    width: 20px;
                    text-align: center;
                }

                /* Tablet & Mobile */
                @media (max-width: 1024px) {
                    .admin-sidebar {
                        display: none;
                    }

                    .admin-topbar {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 0.75rem 1rem;
                        background: white;
                        border-bottom: 1px solid #e2e8f0;
                        position: sticky;
                        top: 0;
                        z-index: 100;
                    }

                    .admin-mobile-menu {
                        display: block;
                        background: white;
                        border-bottom: 1px solid #e2e8f0;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                        position: sticky;
                        top: 56px;
                        z-index: 99;
                    }

                    .admin-layout {
                        flex-direction: column;
                    }

                    .admin-header {
                        position: relative;
                    }

                    .admin-main > div:last-child {
                        padding: 1rem !important;
                    }
                }

                @media (max-width: 768px) {
                    .admin-header > div {
                        padding: 1rem !important;
                    }

                    .admin-header h1 {
                        font-size: 1.2rem !important;
                    }

                    .admin-view-site-btn {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
