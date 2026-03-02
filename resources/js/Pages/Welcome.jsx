import React, { useState, useEffect } from 'react';
import { Link, Head } from '@inertiajs/react';
import Header from '@/Components/Header';

export default function Welcome({ auth }) {
    const [textIndex, setTextIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const phrases = ["Mi estilo", "Mi Funda", "Mi celaxs"];

    useEffect(() => {
        const handleType = () => {
            const currentPhrase = phrases[textIndex];

            if (isDeleting) {
                setDisplayedText(currentPhrase.substring(0, displayedText.length - 1));
            } else {
                setDisplayedText(currentPhrase.substring(0, displayedText.length + 1));
            }

            if (!isDeleting && displayedText === currentPhrase) {
                setTimeout(() => setIsDeleting(true), 2000);
            } else if (isDeleting && displayedText === '') {
                setIsDeleting(false);
                setTextIndex((prev) => (prev + 1) % phrases.length);
            }
        };

        const timer = setTimeout(handleType, isDeleting ? 100 : 200);
        return () => clearTimeout(timer);
    }, [displayedText, isDeleting, textIndex]);

    return (
        <>
            <Head title="Personaliza tu Funda" />
            <Header auth={auth} />

            <main>
                {/* Hero Section */}
                <section className="hero">
                    <div className="container hero-content">
                        <h1>{displayedText}<span className="cursor">|</span></h1>
                        <p>
                            Crea fundas únicas para tu celular. Personaliza con tu estilo y
                            protege tu dispositivo con diseños increíbles.
                        </p>
                        <Link href={route('customizer')} className="btn btn-primary">
                            COMENZAR PERSONALIZACIÓN
                        </Link>
                    </div>
                </section>

                {/* How it Works Section */}
                <section className="section container" style={{ paddingBottom: '2rem' }}>
                    <h2 className="section-title" style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '3rem' }}>¿Cómo Funciona?</h2>
                    <div className="card-grid" style={{ gap: '2rem' }}>
                        {[
                            { icon: "fa-tag", title: "Selecciona tu Marca", text: "Elige entre las mejores marcas.", bg: "#f8f9fa" },
                            { icon: "fa-mobile-alt", title: "Escoge el Modelo", text: "Encuentra tu modelo específico.", bg: "#f8f9fa" },
                            { icon: "fa-cloud-upload-alt", title: "Sube tu Imagen", text: "Personaliza con tu foto favorita.", bg: "#f8f9fa" },
                            { icon: "fa-credit-card", title: "Realiza el Pago", text: "Proceso seguro y rápido.", bg: "#f8f9fa" }
                        ].map((item, index) => (
                            <div key={index} className="card-clean">
                                <div className="card-icon-circle">
                                    <i className={`fas ${item.icon}`}></i>
                                </div>
                                <h3>{item.title}</h3>
                                <p>{item.text}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Y Listo! Bar (Gradient Background as requested) */}
                <div className="container mb-5">
                    <div className="y-listo-bar">
                        <div className="y-listo-content">
                            <div className="check-circle">
                                <i className="fas fa-check"></i>
                            </div>
                            <h3>¡Y Listo! Recibe tu funda personalizada.</h3>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <section className="section container" style={{ paddingTop: '1rem' }}>
                    <div className="card-grid">
                        <div className="card-clean card-feature">
                            <div className="feature-icon">
                                <i className="fas fa-palette"></i>
                            </div>
                            <h3>Diseño Personalizado</h3>
                            <p>Sube tu imagen favorita y créala exactamente como la imaginas.</p>
                        </div>
                        <div className="card-clean card-feature">
                            <div className="feature-icon">
                                <i className="fas fa-mobile"></i>
                            </div>
                            <h3>Múltiples Marcas</h3>
                            <p>Compatible con las marcas más populares del mercado.</p>
                        </div>
                        <div className="card-clean card-feature">
                            <div className="feature-icon">
                                <i className="fas fa-shield-alt"></i>
                            </div>
                            <h3>Calidad Premium</h3>
                            <p>Materiales de alta calidad que protegen y lucen increíbles.</p>
                        </div>
                    </div>
                </section>

                {/* Final CTA Section (From Image 2) */}
                <section className="container mb-20">
                    <div className="final-cta-card">
                        <h2 style={{ fontSize: '1.5rem' }}>¿Listo para Crear tu Funda?</h2>
                        <p>Únete a miles de usuarios que ya personalizaron sus fundas con nosotros.</p>
                        <Link href={route('customizer')} className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1rem', borderRadius: '5px' }}>
                            EMPEZAR AHORA
                        </Link>
                    </div>
                </section>
            </main>

            <style>{`
                .cursor {
                    animation: blink 1s step-end infinite;
                }
                @keyframes blink {
                    50% { opacity: 0; }
                }
            `}</style>
        </>
    );
}
