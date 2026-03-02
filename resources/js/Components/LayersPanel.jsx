import React from 'react';

export default function LayersPanel({ layers, setLayers, selectedLayerId, setSelectedLayerId }) {

    const toggleVisibility = (id) => {
        setLayers(layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
    };

    const toggleLock = (id) => {
        setLayers(layers.map(l => l.id === id ? { ...l, locked: !l.locked } : l));
    };

    const deleteLayer = (id) => {
        setLayers(layers.filter(l => l.id !== id));
        if (selectedLayerId === id) setSelectedLayerId(null);
    };

    const handleDragStart = (e, index) => {
        e.dataTransfer.setData('layerIndex', index);
    };

    const handleDrop = (e, index) => {
        const draggedIndex = e.dataTransfer.getData('layerIndex');
        if (draggedIndex === '') return;

        const newLayers = [...layers];
        const [movedLayer] = newLayers.splice(draggedIndex, 1);
        newLayers.splice(index, 0, movedLayer);

        setLayers(newLayers);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    return (
        <div className="layers-panel">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
                </svg>
                Capas
            </h3>

            <div className="layers-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {layers.slice().reverse().map((layer, reverseIndex) => {
                    const index = layers.length - 1 - reverseIndex;
                    return (
                        <div
                            key={layer.id}
                            className={`layer-item ${selectedLayerId === layer.id ? 'selected' : ''}`}
                            draggable={!layer.locked}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragOver={handleDragOver}
                            onClick={() => setSelectedLayerId(layer.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0.75rem',
                                background: selectedLayerId === layer.id ? '#f0f9fa' : 'white',
                                border: selectedLayerId === layer.id ? '1px solid var(--color-primary)' : '1px solid #eee',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {/* Drag Handle */}
                            <div style={{ cursor: 'grab', marginRight: '0.5rem', color: '#ccc' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="8" y1="6" x2="21" y2="6"></line>
                                    <line x1="8" y1="12" x2="21" y2="12"></line>
                                    <line x1="8" y1="18" x2="21" y2="18"></line>
                                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                                </svg>
                            </div>

                            {/* Thumbnail */}
                            <div style={{ width: '40px', height: '40px', background: '#eee', borderRadius: '4px', overflow: 'hidden', marginRight: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {layer.type === 'image' && (
                                    <img src={layer.src} alt="Layer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                )}
                                {layer.type === 'text' && (
                                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: layer.color }}>T</span>
                                )}
                                {layer.type === 'background' && (
                                    <div style={{ width: '100%', height: '100%', background: layer.color }}></div>
                                )}
                            </div>

                            {/* Name */}
                            <div style={{ flex: 1, fontWeight: '500', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {layer.name || (layer.type === 'image' ? 'Imagen' : layer.type === 'text' ? 'Texto' : 'Fondo')}
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleLock(layer.id); }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: layer.locked ? '#EC008C' : '#999' }}
                                    title={layer.locked ? "Desbloquear" : "Bloquear"}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        {layer.locked ? (
                                            <>
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                            </>
                                        ) : (
                                            <>
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                                <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                                            </>
                                        )}
                                    </svg>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleVisibility(layer.id); }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: layer.visible ? '#666' : '#ccc' }}
                                    title={layer.visible ? "Ocultar" : "Mostrar"}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        {layer.visible ? (
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        ) : (
                                            <>
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                                <line x1="1" y1="1" x2="23" y2="23"></line>
                                            </>
                                        )}
                                        {layer.visible && <circle cx="12" cy="12" r="3"></circle>}
                                    </svg>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d4f' }}
                                    title="Eliminar"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {layers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#999', fontSize: '0.9rem', border: '1px dashed #ddd', borderRadius: '5px' }}>
                    No hay capas añadidas
                </div>
            )}
        </div>
    );
}
