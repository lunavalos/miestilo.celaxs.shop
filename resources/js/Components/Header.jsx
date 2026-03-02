import React from 'react';
import { Link } from '@inertiajs/react';

export default function Header({ auth }) {
    return (
        <div className="header-wrapper">
            <header className="header">
                <div className="header-logo">
                    <Link href="/">
                        <img src="/storage/logos/celaxs-accesorios-para-celulares-fundas-iphone.png" alt="Celax Logo" />
                    </Link>
                </div>

                <nav className="header-nav">
                    <Link href="/" className="nav-link">INICIO</Link>
                    <a href="https://celaxs.shop/tienda/" className="nav-link">TIENDA</a>
                    <a href="https://celaxs.shop/nosotros/" className="nav-link">NOSOTROS</a>
                    <a href="https://celaxs.shop/preguntas-frecuentes/" className="nav-link">FAQS</a>
                    <a href="https://celaxs.shop/contacto/" className="nav-link">CONTACTO</a>
                </nav>

                <div className="header-actions">
                    <Link href={route('customizer')} className="btn btn-primary  text-xs" style={{ fontSize: '0.8rem' }}>
                        PERSONALIZAR
                    </Link>

                    {auth?.user?.is_admin ? (
                        <Link href={route('admin.dashboard')} className="admin-icon" title="Panel de Administración">
                            <i className="fas fa-user-shield"></i>
                        </Link>
                    ) : (
                        <Link href={route('login')} className="admin-icon" title="Admin Login">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </Link>
                    )}
                </div>
            </header>
        </div>
    );
}
