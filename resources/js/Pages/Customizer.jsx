import React, { useState, useEffect, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import StepIndicator from '@/Components/StepIndicator';
import LayersPanel from '@/Components/LayersPanel';
import PreviewCanvas from '@/Components/PreviewCanvas';
import CheckoutForm from '@/Components/CheckoutForm';

export default function Customizer({ auth }) {
    const [step, setStep] = useState(1);
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [selectedModel, setSelectedModel] = useState(null);

    const getImageUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return window.location.origin + path;
    };

    // Customization State
    const [layers, setLayers] = useState([]);
    const [selectedLayerId, setSelectedLayerId] = useState(null);
    const [activeTab, setActiveTab] = useState('color'); // color, image, text

    // Initial Load
    useEffect(() => {
        axios.get('/api/brands').then(res => setBrands(res.data));
    }, []);

    // Load Models when Brand Selected
    useEffect(() => {
        if (selectedBrand) {
            axios.get(`/api/models?brand_id=${selectedBrand.id}`).then(res => setModels(res.data));
        }
    }, [selectedBrand]);

    const addLayer = (type, content) => {
        if (type === 'background') {
            // Si ya existe un fondo, solo actualiza el color
            const existingBg = layers.find(l => l.type === 'background');
            if (existingBg) {
                setLayers(prev => prev.map(l => l.type === 'background' ? { ...l, ...content } : l));
                return;
            }
            // Si no existe, lo agregamos al INICIO del array (se dibujará primero = debajo de todo)
            const newLayer = {
                id: Date.now(),
                type,
                name: 'Fondo',
                visible: true,
                locked: false,
                x: 0, y: 0, width: 300, height: 600,
                rotation: 0, opacity: 1,
                ...content
            };
            setLayers(prev => [newLayer, ...prev]);
        } else {
            const newLayer = {
                id: Date.now(),
                type,
                name: type === 'text' ? content.text : 'Imagen',
                visible: true,
                locked: false,
                x: 50, y: 100,
                width: type === 'text' ? 200 : 150,
                height: type === 'text' ? 50 : 150,
                rotation: 0, opacity: 1,
                ...content
            };
            // Las imágenes y textos se agregan al FINAL (se dibujan encima de todo)
            setLayers(prev => [...prev, newLayer]);
            setSelectedLayerId(newLayer.id);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    addLayer('image', {
                        src: event.target.result,
                        imgObject: img,
                        width: 150,
                        height: 150 * (img.height / img.width),
                        x: 75,
                        y: 100
                    });
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddText = () => {
        addLayer('text', {
            text: 'Texto Nuevo',
            color: '#000000',
            fontSize: 24,
            fontFamily: 'Montserrat',
            bold: false,
            italic: false,
            x: 60,
            y: 280,
            width: 180,
            height: 40
        });
    };

    const updateLayer = (id, updates) => {
        setLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    };

    const deleteLayer = (id) => {
        setLayers(prev => prev.filter(l => l.id !== id));
        if (selectedLayerId === id) setSelectedLayerId(null);
    };

    const updateSelectedLayer = (updates) => {
        if (selectedLayerId) {
            updateLayer(selectedLayerId, updates);
        }
    };

    // Tabs content
    const renderTabContent = () => {
        const selectedLayer = layers.find(l => l.id === selectedLayerId);

        switch (activeTab) {
            case 'color':
                return (
                    <div className="tool-panel">
                        <h4 style={{ marginBottom: '1rem', fontWeight: '700' }}>Color de Fondo</h4>
                        <div style={{ display: 'grid', placeItems: 'center', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '1rem' }}>
                            {['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF', '#EC008C', '#01A0AD', '#FFA500', '#800080', '#A52A2A', '#808080', '#FFC0CB'].map(color => (
                                <div
                                    key={color}
                                    onClick={() => addLayer('background', { color })}
                                    style={{
                                        backgroundColor: color,
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        cursor: 'pointer',
                                        border: '2px solid #ddd',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                        transition: 'transform 0.2s'
                                    }}
                                    title={color}
                                />
                            ))}
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Color Personalizado</label>
                            <input
                                type="color"
                                style={{ width: '100%', height: '45px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #ddd' }}
                                onChange={(e) => addLayer('background', { color: e.target.value })}
                            />
                        </div>
                    </div>
                );
            case 'image':
                return (
                    <div className="tool-panel">
                        <h4 style={{ marginBottom: '1rem', fontWeight: '700' }}>Subir Imagen</h4>
                        <div
                            style={{
                                border: '2px dashed #01A0AD',
                                padding: '2rem',
                                textAlign: 'center',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                marginBottom: '1rem',
                                background: '#f0fbff'
                            }}
                            onClick={() => document.getElementById('image-upload').click()}
                        >
                            <i className="fas fa-cloud-upload-alt" style={{ fontSize: '2.5rem', color: '#01A0AD', marginBottom: '0.5rem', display: 'block' }}></i>
                            <p style={{ color: '#01A0AD', fontWeight: 'bold', margin: 0 }}>Haz clic para subir imagen</p>
                            <input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleImageUpload}
                            />
                        </div>
                        {selectedLayer && selectedLayer.type === 'image' && (
                            <div>
                                <h5 style={{ marginBottom: '0.5rem' }}>Editar Imagen</h5>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Opacidad</label>
                                    <input
                                        type="range"
                                        min="0" max="1" step="0.1"
                                        value={selectedLayer.opacity || 1}
                                        onChange={(e) => updateSelectedLayer({ opacity: parseFloat(e.target.value) })}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'text':
                return (
                    <div className="tool-panel">
                        <button className="btn btn-primary" onClick={handleAddText} style={{ width: '100%', marginBottom: '1rem' }}>
                            <i className="fas fa-plus"></i> Agregar Texto
                        </button>

                        {selectedLayer && selectedLayer.type === 'text' && (
                            <div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600', fontSize: '0.85rem' }}>Texto</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        style={{ width: '100%' }}
                                        value={selectedLayer.text}
                                        onChange={(e) => updateSelectedLayer({ text: e.target.value })}
                                    />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600', fontSize: '0.85rem' }}>Fuente</label>
                                    <select
                                        className="form-input"
                                        style={{ width: '100%' }}
                                        value={selectedLayer.fontFamily}
                                        onChange={(e) => updateSelectedLayer({ fontFamily: e.target.value })}
                                    >
                                        <option value="Montserrat">Montserrat</option>
                                        <option value="Quicksand">Quicksand</option>
                                        <option value="Arial">Arial</option>
                                        <option value="Times New Roman">Times New Roman</option>
                                    </select>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600', fontSize: '0.85rem' }}>Tamaño</label>
                                    <input
                                        type="range"
                                        min="10" max="80" step="1"
                                        value={selectedLayer.fontSize || 24}
                                        onChange={(e) => updateSelectedLayer({ fontSize: parseInt(e.target.value) })}
                                        style={{ width: '100%' }}
                                    />
                                    <span style={{ fontSize: '0.8rem', color: '#666' }}>{selectedLayer.fontSize || 24}px</span>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600', fontSize: '0.85rem' }}>Color</label>
                                    <input
                                        type="color"
                                        value={selectedLayer.color}
                                        onChange={(e) => updateSelectedLayer({ color: e.target.value })}
                                        style={{ width: '100%', height: '40px', borderRadius: '5px' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => updateSelectedLayer({ bold: !selectedLayer.bold })}
                                        style={{
                                            flex: 1, padding: '0.5rem',
                                            background: selectedLayer.bold ? '#01A0AD' : 'white',
                                            color: selectedLayer.bold ? 'white' : '#333',
                                            border: '1px solid #ddd', borderRadius: '5px',
                                            fontWeight: 'bold', cursor: 'pointer'
                                        }}
                                    >B</button>
                                    <button
                                        onClick={() => updateSelectedLayer({ italic: !selectedLayer.italic })}
                                        style={{
                                            flex: 1, padding: '0.5rem',
                                            background: selectedLayer.italic ? '#01A0AD' : 'white',
                                            color: selectedLayer.italic ? 'white' : '#333',
                                            border: '1px solid #ddd', borderRadius: '5px',
                                            fontStyle: 'italic', cursor: 'pointer'
                                        }}
                                    >I</button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div style={{ background: '#F8F8F8', minHeight: '100vh' }}>
            <Head title="Personalizador - Celax" />

            {/* Header del Customizador con link al Inicio */}
            <div className="header-wrapper">
                <header className="header">
                    <div className="header-logo">
                        <Link href="/">
                            <img src="/storage/logos/celaxs-accesorios-para-celulares-fundas-iphone.png" alt="Celax Logo" style={{ height: '40px' }} />
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
                        <Link href="/" className="btn btn-primary">
                            <i className="fas fa-arrow-left" style={{ marginRight: '0.5rem' }}></i>
                            INICIO
                        </Link>
                    </div>
                </header>
            </div>

            {/* Step Indicator */}
            <StepIndicator
                currentStep={step}
                steps={['Marca', 'Modelo y Opción', 'Imagen', 'Envío y Pago']}
            />

            {/* ── PASO 4: Checkout a pantalla completa (dos columnas propias) ── */}
            {step === 4 && (
                <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
                    {/* Botón Anterior */}
                    <div style={{ marginBottom: '1rem' }}>
                        <button
                            onClick={() => setStep(3)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.5rem', borderRadius: '50px', border: '2px solid #01A0AD', background: 'transparent', color: '#01A0AD', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            <i className="fas fa-chevron-left"></i> ANTERIOR
                        </button>
                    </div>
                    <CheckoutForm
                        selectedBrand={selectedBrand}
                        selectedModel={selectedModel}
                        layers={layers}
                        updateLayer={updateLayer}
                        selectedLayerId={selectedLayerId}
                        setSelectedLayerId={setSelectedLayerId}
                        deleteLayer={deleteLayer}
                        getImageUrl={getImageUrl}
                    />
                </div>
            )}

            {/* ── PASOS 1-3: Layout dos columnas normal ── */}
            {step !== 4 && (
                <div className="customizer-container">
                    <div className="customizer-content">
                        {/* Panel Izquierdo - Herramientas */}
                        <div className="customizer-panel">

                            {/* Botones de navegación */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                                {step > 1 ? (
                                    <button
                                        onClick={() => setStep(step - 1)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.5rem', borderRadius: '50px', border: '2px solid #01A0AD', background: 'transparent', color: '#01A0AD', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                        <i className="fas fa-chevron-left"></i> ANTERIOR
                                    </button>
                                ) : <div></div>}

                                {step < 4 && (
                                    <button
                                        onClick={() => {
                                            if (step === 1 && !selectedBrand) return alert('Selecciona una marca');
                                            if (step === 2 && !selectedModel) return alert('Selecciona un modelo');
                                            setStep(step + 1);
                                        }}
                                        className="btn btn-primary"
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '50px', padding: '0.5rem 1.5rem' }}
                                    >
                                        SIGUIENTE <i className="fas fa-chevron-right"></i>
                                    </button>
                                )}
                            </div>

                            {/* Paso 1: Marca */}
                            {step === 1 && (
                                <>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>Selecciona la Marca</h2>
                                    <p style={{ color: '#666', marginBottom: '1.5rem', fontFamily: 'var(--font-secondary)' }}>Elige la marca de tu dispositivo.</p>
                                    <div className="brand-grid">
                                        {brands.map(brand => (
                                            <div
                                                key={brand.id}
                                                className={`brand-card ${selectedBrand?.id === brand.id ? 'selected' : ''}`}
                                                onClick={() => { setSelectedBrand(brand); setStep(2); }}
                                            >
                                                <img src={getImageUrl(brand.logo)} alt={brand.name} />
                                                <h3 style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>{brand.name}</h3>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* Paso 2: Modelo */}
                            {step === 2 && (
                                <>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>Escoge el Modelo</h2>
                                    <p style={{ color: '#666', marginBottom: '1.5rem', fontFamily: 'var(--font-secondary)' }}>Selecciona el modelo específico.</p>
                                    <div className="model-grid">
                                        {models.map(model => (
                                            <div
                                                key={model.id}
                                                className={`model-card ${selectedModel?.id === model.id ? 'selected' : ''}`}
                                                onClick={() => { setSelectedModel(model); setLayers([]); }}
                                            >
                                                <img src={getImageUrl(model.image_normal)} alt={model.name} />
                                                <h3 style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>{model.name}</h3>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* Paso 3: Diseño */}
                            {step === 3 && (
                                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem' }}>Personaliza tu Funda</h2>

                                    {/* Tabs */}
                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                                        {[
                                            { id: 'color', label: 'Fondo', icon: 'fa-palette' },
                                            { id: 'image', label: 'Imagen', icon: 'fa-image' },
                                            { id: 'text', label: 'Texto', icon: 'fa-font' }
                                        ].map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                style={{
                                                    flex: 1, padding: '0.6rem',
                                                    background: activeTab === tab.id ? '#01A0AD' : 'white',
                                                    color: activeTab === tab.id ? 'white' : '#555',
                                                    border: '1px solid #eee', borderRadius: '8px',
                                                    fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
                                                }}
                                            >
                                                <i className={`fas ${tab.icon}`}></i> {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    {renderTabContent()}

                                    <div style={{ marginTop: '1rem', flex: 1, overflowY: 'auto' }}>
                                        <LayersPanel
                                            layers={layers}
                                            setLayers={setLayers}
                                            selectedLayerId={selectedLayerId}
                                            setSelectedLayerId={setSelectedLayerId}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Paso 4: Pago */}
                            {step === 4 && (
                                <CheckoutForm
                                    selectedBrand={selectedBrand}
                                    selectedModel={selectedModel}
                                    layers={layers}
                                />
                            )}
                        </div>

                        {/* Panel Derecho - Vista Previa (40%) */}
                        <div className="preview-panel">
                            {selectedModel ? (
                                <div style={{ position: 'relative', width: '300px', height: '600px', background: 'white', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                                    <PreviewCanvas
                                        layers={layers}
                                        updateLayer={updateLayer}
                                        transparentImage={getImageUrl(selectedModel.image_transparent)}
                                        normalImage={step === 2 ? getImageUrl(selectedModel.image_normal) : getImageUrl(selectedModel.image_transparent)}
                                        selectedLayerId={selectedLayerId}
                                        setSelectedLayerId={setSelectedLayerId}
                                        onDeleteLayer={deleteLayer}
                                    />
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', color: '#aaa' }}>
                                    <i className="fas fa-mobile-alt" style={{ fontSize: '4rem', marginBottom: '1rem', display: 'block' }}></i>
                                    <p>Selecciona un modelo para ver la vista previa</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
