import React, { useEffect } from 'react';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import Header from '@/Components/Header';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <div style={{ backgroundColor: '#F8F8F8', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Head title="Iniciar Sesión" />
            <Header />

            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
                <div style={{
                    width: '100%',
                    maxWidth: '450px',
                    background: 'white',
                    padding: '2.5rem',
                    borderRadius: '15px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h2 className="section-title" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Bienvenido</h2>
                        <p className="text-muted">Ingresa a tu cuenta para administrar.</p>
                    </div>

                    {status && <div className="mb-4 font-medium text-sm text-green-600">{status}</div>}

                    <form onSubmit={submit}>
                        <div>
                            <InputLabel htmlFor="email" value="Correo Electrónico" style={{ fontFamily: 'var(--font-primary)', fontWeight: 'bold' }} />
                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="mt-1 block w-full form-input"
                                autoComplete="username"
                                isFocused={true}
                                onChange={(e) => setData('email', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.8rem',
                                    borderRadius: '8px',
                                    border: '1px solid #ddd',
                                    marginTop: '0.5rem'
                                }}
                            />
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        <div className="mt-4">
                            <InputLabel htmlFor="password" value="Contraseña" style={{ fontFamily: 'var(--font-primary)', fontWeight: 'bold' }} />
                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="mt-1 block w-full form-input"
                                autoComplete="current-password"
                                onChange={(e) => setData('password', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.8rem',
                                    borderRadius: '8px',
                                    border: '1px solid #ddd',
                                    marginTop: '0.5rem'
                                }}
                            />
                            <InputError message={errors.password} className="mt-2" />
                        </div>

                        <div className="block mt-4">
                            <label className="flex items-center">
                                <Checkbox
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                />
                                <span className="ml-2 text-sm text-gray-600" style={{ fontFamily: 'var(--font-secondary)' }}>Recordarme</span>
                            </label>
                        </div>

                        <div className="flex items-center justify-end mt-6">
                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    style={{ fontFamily: 'var(--font-secondary)' }}
                                >
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            )}

                            <PrimaryButton className="ml-4 btn btn-primary" disabled={processing} style={{ padding: '0.8rem 2rem', fontSize: '1rem' }}>
                                Ingresar
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
