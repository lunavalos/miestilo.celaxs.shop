import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

const CANVAS_W = 300;
const CANVAS_H = 600;
const HANDLE_SIZE = 10;
const ROTATE_DIST = 28;

const PreviewCanvas = forwardRef(({
    layers,
    updateLayer,
    transparentImage,
    normalImage,
    selectedLayerId,
    setSelectedLayerId,
    onDeleteLayer,
}, ref) => {
    const canvasRef = useRef(null);
    const bufferRef = useRef(null);
    const clipBufferRef = useRef(null);
    const [overlayImg, setOverlayImg] = useState(null);
    const [maskImg, setMaskImg] = useState(null);
    const [interaction, setInteraction] = useState(null);
    const [loading, setLoading] = useState(true);

    // Exponer método para captura
    useImperativeHandle(ref, () => ({
        getScreenshot: () => {
            const canvas = canvasRef.current;
            if (!canvas) return null;
            return canvas.toDataURL('image/png');
        }
    }));

    // Inicializar buffers una sola vez
    useEffect(() => {
        if (!bufferRef.current) {
            bufferRef.current = document.createElement('canvas');
            bufferRef.current.width = CANVAS_W;
            bufferRef.current.height = CANVAS_H;
        }
        if (!clipBufferRef.current) {
            clipBufferRef.current = document.createElement('canvas');
            clipBufferRef.current.width = CANVAS_W;
            clipBufferRef.current.height = CANVAS_H;
        }
    }, []);

    // Cargar imagen normal (overlay con contorno)
    useEffect(() => {
        if (normalImage) {
            setLoading(true);
            const img = new Image();
            const absoluteUrl = normalImage.startsWith('http') ? normalImage : window.location.origin + normalImage;
            img.onload = () => {
                setOverlayImg(img);
                setLoading(false);
            };
            img.onerror = () => {
                console.error('Error cargando contorno:', absoluteUrl);
                setOverlayImg(null);
                setLoading(false);
            };
            img.src = absoluteUrl;
        } else {
            setOverlayImg(null);
        }
    }, [normalImage]);

    // Cargar imagen de máscara (transparente)
    useEffect(() => {
        if (transparentImage) {
            const img = new Image();
            const absoluteUrl = transparentImage.startsWith('http') ? transparentImage : window.location.origin + transparentImage;
            img.onload = () => setMaskImg(img);
            img.onerror = () => { console.error('Error cargando máscara:', absoluteUrl); setMaskImg(null); };
            img.src = absoluteUrl;
        } else {
            setMaskImg(null);
        }
    }, [transparentImage]);

    // ── DIBUJAR ──────────────────────────────────────────────────────
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !bufferRef.current || !clipBufferRef.current) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const bctx = bufferRef.current.getContext('2d', { willReadFrequently: true });
        const cctx = clipBufferRef.current.getContext('2d', { willReadFrequently: true });

        // 1. REINICIO TOTAL DE ESTADOS
        ctx.globalCompositeOperation = 'source-over';
        bctx.globalCompositeOperation = 'source-over';
        cctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        bctx.globalAlpha = 1;
        cctx.globalAlpha = 1;

        // Limpiar
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
        bctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
        cctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

        // Fondo blanco base (fuera de la funda)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        if (loading && !overlayImg) {
            ctx.fillStyle = '#9ca3af';
            ctx.textAlign = 'center';
            ctx.font = '16px Montserrat';
            ctx.fillText('Cargando modelo...', CANVAS_W / 2, CANVAS_H / 2);
            return;
        }

        // 2. Calcular dimensiones (Contain)
        let rect = { x: 0, y: 0, w: CANVAS_W, h: CANVAS_H };
        if (overlayImg) {
            const scale = Math.min(CANVAS_W / overlayImg.width, CANVAS_H / overlayImg.height);
            rect.w = overlayImg.width * scale;
            rect.h = overlayImg.height * scale;
            rect.x = (CANVAS_W - rect.w) / 2;
            rect.y = (CANVAS_H - rect.h) / 2;
        }

        // 3. Dibujar modelo base como referencia (Paso 2 o fondo del Paso 3)
        if (overlayImg) {
            ctx.drawImage(overlayImg, rect.x, rect.y, rect.w, rect.h);
        }

        // 4. Dibujar TODO el diseño en el buffer de forma secuencial
        // Orden: Background (0) -> Imagen/Texto (1, 2, 3...)
        for (const layer of layers) {
            if (!layer.visible) continue;
            bctx.save();
            bctx.globalAlpha = layer.opacity ?? 1;

            if (layer.type === 'background') {
                bctx.fillStyle = layer.color || '#ffffff';
                bctx.fillRect(0, 0, CANVAS_W, CANVAS_H); // Llenamos todo el buffer de color
            } else if (layer.type === 'image' && layer.imgObject) {
                const cx = layer.x + layer.width / 2;
                const cy = layer.y + layer.height / 2;
                bctx.translate(cx, cy);
                bctx.rotate((layer.rotation || 0) * Math.PI / 180);
                bctx.drawImage(layer.imgObject, -layer.width / 2, -layer.height / 2, layer.width, layer.height);
            } else if (layer.type === 'text') {
                const cx = layer.x + layer.width / 2;
                const cy = layer.y + layer.height / 2;
                bctx.translate(cx, cy);
                bctx.rotate((layer.rotation || 0) * Math.PI / 180);
                const fontStr = `${layer.italic ? 'italic ' : ''}${layer.bold ? 'bold ' : ''}${layer.fontSize || 24}px "${layer.fontFamily || 'Arial'}"`;
                bctx.font = fontStr;
                bctx.fillStyle = layer.color || '#000000';
                bctx.textAlign = 'center';
                bctx.textBaseline = 'middle';
                bctx.fillText(layer.text || '', 0, 0);
            }
            bctx.restore();
        }

        // 5. Composición Final (Solo si hay diseños)
        if (layers.length > 0 && maskImg && overlayImg) {
            // A. Recortar diseño con la máscara
            cctx.drawImage(maskImg, rect.x, rect.y, rect.w, rect.h);
            cctx.globalCompositeOperation = 'source-in';
            cctx.drawImage(bufferRef.current, 0, 0);

            // B. Dibujar diseño recortado sobre el canvas principal
            ctx.drawImage(clipBufferRef.current, 0, 0);

            // C. Proyectar sombras/detalles REALES (Multiply)
            ctx.save();
            ctx.globalCompositeOperation = 'multiply';
            ctx.drawImage(overlayImg, rect.x, rect.y, rect.w, rect.h);
            ctx.restore();
        } else if (layers.length > 0 && !maskImg) {
            // Fallback: Si no hay máscara, dibujar buffer directamente
            ctx.drawImage(bufferRef.current, 0, 0);
        }

        // 6. Transformer (Siempre arriba)
        const selectedLayer = layers.find(l => l.id === selectedLayerId);
        if (selectedLayer && selectedLayer.visible && selectedLayer.type !== 'background') {
            drawTransformer(ctx, selectedLayer);
        }

    }, [layers, selectedLayerId, overlayImg, maskImg, loading]);

    // ── TRANSFORMER ──────────────────────────────────────────────────
    const drawTransformer = (ctx, layer) => {
        const { x, y, width, height, rotation = 0 } = layer;
        const cx = x + width / 2;
        const cy = y + height / 2;
        const hw = width / 2;
        const hh = height / 2;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotation * Math.PI / 180);

        // Borde de selección
        ctx.strokeStyle = '#01A0AD';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(-hw, -hh, width, height);
        ctx.setLineDash([]);

        // Handles de esquinas (resize)
        [[-hw, -hh], [hw, -hh], [-hw, hh], [hw, hh]].forEach(([hx, hy]) => {
            ctx.fillStyle = 'white';
            ctx.strokeStyle = '#01A0AD';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.rect(hx - HANDLE_SIZE / 2, hy - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
            ctx.fill();
            ctx.stroke();
        });

        // Línea al handle de rotación
        ctx.strokeStyle = '#01A0AD';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -hh);
        ctx.lineTo(0, -hh - ROTATE_DIST);
        ctx.stroke();

        // Círculo de rotación
        ctx.fillStyle = '#01A0AD';
        ctx.beginPath();
        ctx.arc(0, -hh - ROTATE_DIST, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('↻', 0, -hh - ROTATE_DIST);

        // Botón eliminar (esquina superior izquierda)
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(-hw, -hh, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('×', -hw, -hh);

        ctx.restore();
    };

    // ── UTILIDADES ───────────────────────────────────────────────────
    const getCanvasPos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = CANVAS_W / rect.width;
        const scaleY = CANVAS_H / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    const rotatePoint = (px, py, cx, cy, angleDeg) => {
        const angle = -angleDeg * Math.PI / 180;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const dx = px - cx;
        const dy = py - cy;
        return {
            x: cx + dx * cos - dy * sin,
            y: cy + dx * sin + dy * cos
        };
    };

    const getHitHandle = (layer, px, py) => {
        const { x, y, width, height, rotation = 0 } = layer;
        const cx = x + width / 2;
        const cy = y + height / 2;
        const hw = width / 2;
        const hh = height / 2;

        const local = rotatePoint(px, py, cx, cy, rotation);
        const lx = local.x - cx;
        const ly = local.y - cy;

        // Botón eliminar
        if (Math.sqrt((lx + hw) ** 2 + (ly + hh) ** 2) <= 12) return 'delete';

        // Handle de rotación
        if (Math.sqrt(lx ** 2 + (ly + hh + ROTATE_DIST) ** 2) <= 12) return 'rotate';

        // Handles de esquinas
        const corners = [
            { name: 'tl', hx: -hw, hy: -hh },
            { name: 'tr', hx: hw, hy: -hh },
            { name: 'bl', hx: -hw, hy: hh },
            { name: 'br', hx: hw, hy: hh },
        ];
        for (const c of corners) {
            if (Math.abs(lx - c.hx) <= HANDLE_SIZE + 2 && Math.abs(ly - c.hy) <= HANDLE_SIZE + 2) {
                return c.name;
            }
        }

        // Interior
        if (lx >= -hw && lx <= hw && ly >= -hh && ly <= hh) return 'move';

        return null;
    };

    // ── EVENTOS ──────────────────────────────────────────────────────
    const handleMouseDown = (e) => {
        const pos = getCanvasPos(e);

        // Verificar handle en capa seleccionada
        const selLayer = layers.find(l => l.id === selectedLayerId);
        if (selLayer && selLayer.type !== 'background') {
            const handle = getHitHandle(selLayer, pos.x, pos.y);
            if (handle === 'delete') {
                if (onDeleteLayer) onDeleteLayer(selLayer.id);
                return;
            }
            if (handle) {
                setInteraction({
                    type: handle === 'move' ? 'move' : handle === 'rotate' ? 'rotate' : 'resize',
                    handle,
                    layerId: selLayer.id,
                    startX: pos.x,
                    startY: pos.y,
                    startLayer: { ...selLayer }
                });
                return;
            }
        }

        // Buscar capa clickeada
        for (const layer of layers) {
            if (!layer.visible || layer.locked || layer.type === 'background') continue;
            const handle = getHitHandle(layer, pos.x, pos.y);
            if (handle) {
                setSelectedLayerId(layer.id);
                if (handle === 'move') {
                    setInteraction({
                        type: 'move',
                        handle: 'move',
                        layerId: layer.id,
                        startX: pos.x,
                        startY: pos.y,
                        startLayer: { ...layer }
                    });
                }
                return;
            }
        }

        setSelectedLayerId(null);
    };

    const handleMouseMove = (e) => {
        if (!interaction) return;
        const pos = getCanvasPos(e);
        const { type, handle, layerId, startX, startY, startLayer } = interaction;
        const dx = pos.x - startX;
        const dy = pos.y - startY;

        if (type === 'move') {
            updateLayer(layerId, {
                x: startLayer.x + dx,
                y: startLayer.y + dy
            });

        } else if (type === 'rotate') {
            const cx = startLayer.x + startLayer.width / 2;
            const cy = startLayer.y + startLayer.height / 2;
            const startAngle = Math.atan2(startY - cy, startX - cx);
            const currentAngle = Math.atan2(pos.y - cy, pos.x - cx);
            const delta = (currentAngle - startAngle) * (180 / Math.PI);
            updateLayer(layerId, { rotation: (startLayer.rotation || 0) + delta });

        } else if (type === 'resize') {
            const angle = (startLayer.rotation || 0) * Math.PI / 180;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            // Proyectar delta al espacio local de la capa
            const localDx = dx * cos + dy * sin;
            const localDy = -dx * sin + dy * cos;

            let newW = startLayer.width;
            let newH = startLayer.height;
            let newX = startLayer.x;
            let newY = startLayer.y;

            if (handle === 'br') {
                newW = Math.max(20, startLayer.width + localDx);
                newH = Math.max(20, startLayer.height + localDy);
            } else if (handle === 'tr') {
                newW = Math.max(20, startLayer.width + localDx);
                newH = Math.max(20, startLayer.height - localDy);
                newY = startLayer.y + startLayer.height - newH;
            } else if (handle === 'bl') {
                newW = Math.max(20, startLayer.width - localDx);
                newH = Math.max(20, startLayer.height + localDy);
                newX = startLayer.x + startLayer.width - newW;
            } else if (handle === 'tl') {
                newW = Math.max(20, startLayer.width - localDx);
                newH = Math.max(20, startLayer.height - localDy);
                newX = startLayer.x + startLayer.width - newW;
                newY = startLayer.y + startLayer.height - newH;
            }

            updateLayer(layerId, { x: newX, y: newY, width: newW, height: newH });
        }
    };

    const handleMouseUp = () => setInteraction(null);

    const getCursor = () => {
        if (!interaction) return 'default';
        if (interaction.type === 'move') return 'grabbing';
        if (interaction.type === 'rotate') return 'crosshair';
        return 'nwse-resize';
    };

    return (
        <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            style={{
                width: '100%',
                height: '100%',
                cursor: getCursor(),
                borderRadius: '20px',
                display: 'block'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        />
    );
});

export default PreviewCanvas;
