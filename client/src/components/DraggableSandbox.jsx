// render this as the page then test to see if writing and dragging works.
import interact from 'interactjs';
import { useCallback, useEffect, useRef, useState } from 'react';
// import imageSample from '../assets/images/NUSpace_blue.png'
// import imageSample from '../assets/images/icon_yellow.png'

export default function DraggableSandbox({ onUpdate, imageSample }) {
    // Track dynamic width/height based on the intrinsic image size
    // Start with a desired initial height (60px) and compute width once image loads
    const DESIRED_INITIAL_HEIGHT = 60;
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const boxRef = useRef(null);
    const [hovered, setHovered] = useState(false);
    const [initialActive, setInitialActive] = useState(true);
    const imgRef = useRef(null);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    // const [pos, setPos] = useState({ x: 40, y: 50 });


    console.log("dimensions ", dimensions);

    useEffect(() => {
        if (!boxRef.current) return;

        interact(boxRef.current).draggable({
            listeners: {
                move(event) {
                    setPos(prev => {
                        let x = prev.x + event.dx;
                        let y = prev.y + event.dy;
                        onUpdate?.({ x, y, width: boxRef.current.offsetWidth, height: boxRef.current.offsetHeight });
                        return { x, y };
                    });
                }
            }
        });
    }, []);

    // When the image loads, adopt its natural size for the draggable box
    const syncNaturalSize = useCallback(() => {
        if (!imgRef.current) return;
        const natW = imgRef.current.naturalWidth || 100;
        const natH = imgRef.current.naturalHeight || 100;
        // Scale width to maintain aspect ratio while forcing height to DESIRED_INITIAL_HEIGHT
        const scaledWidth = Math.round((natW / natH) * DESIRED_INITIAL_HEIGHT);
        setDimensions({ width: scaledWidth, height: DESIRED_INITIAL_HEIGHT });
        onUpdate?.({ x: 0, y: 0, width: scaledWidth, height: DESIRED_INITIAL_HEIGHT });
    }, [onUpdate]);

    useEffect(() => {
        if (!imgRef.current) return;
        const img = imgRef.current;
        if (img.complete) {
            syncNaturalSize();
        } else {
            img.addEventListener('load', syncNaturalSize);
        }
        return () => img.removeEventListener('load', syncNaturalSize);
    }, [syncNaturalSize]);

    useEffect(() => {
        if (!boxRef.current) return;

        interact(boxRef.current)
            .draggable({
                listeners: {
                    move(event) {
                        const target = event.target;
                        let x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                        let y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

                        target.style.transform = `translate(${x}px, ${y}px)`;
                        target.setAttribute('data-x', x);
                        target.setAttribute('data-y', y);

                        onUpdate?.({ x, y, width: target.offsetWidth, height: target.offsetHeight });
                    }
                }
            })
            .resizable({
                edges: { left: true, right: true, bottom: true, top: true },
                modifiers: [
                    // Maintain aspect ratio based on the current element size (updated when image loads)
                    interact.modifiers.aspectRatio({ ratio: 'preserve' })
                ],
                listeners: {
                    move(event) {
                        const target = event.target;
                        let x = parseFloat(target.getAttribute('data-x')) || 0;
                        let y = parseFloat(target.getAttribute('data-y')) || 0;

                        // The modifier ensures height matches width ratio automatically
                        const newW = event.rect.width;
                        const newH = event.rect.height;
                        target.style.width = `${newW}px`;
                        target.style.height = `${newH}px`;
                        setDimensions({ width: newW, height: newH });

                        // translate when resizing from top/left
                        x += event.deltaRect.left;
                        y += event.deltaRect.top;

                        target.style.transform = `translate(${x}px, ${y}px)`;
                        target.setAttribute('data-x', x);
                        target.setAttribute('data-y', y);

                        onUpdate?.({ x, y, width: newW, height: newH });
                    }
                }
            });

        // Cleanup
        return () => {
            if (boxRef.current) interact(boxRef.current).unset();
        };
    }, []);

    // useEffect(() => {
    //     setPos({ x: 0, y: 0 });
    //     setDimensions({ width: 0, height: 0 });
    //     setInitialActive(true);
    //     setHovered(false);

    //     if (boxRef.current) {
    //         boxRef.current.setAttribute('data-x', 0);
    //         boxRef.current.setAttribute('data-y', 0);
    //         boxRef.current.style.transform = 'translate(0px, 0px)';
    //     }
    // }, [imageSample]);

    return (
        <div
            data-tooltip-id="global-tooltip"
            data-tooltip-content={initialActive ? "Drag to move, resize handles to adjust size" : ""}
            ref={boxRef}
            className={`hover:border-2 hover:border-dashed hover:border-red-500 cursor-move rounded ${initialActive ? 'border-2 border-dashed border-red-500' : ''}${hovered && !initialActive ? ' border-2 border-dashed border-red-500' : ''}`}
            onMouseEnter={() => {
                setHovered(true);
                if (initialActive) setInitialActive(false);
            }}
            onMouseLeave={() => setHovered(false)}
            style={{
                width: `${dimensions.width}px`,
                height: `${dimensions.height}px`,
                background: '',
                position: 'absolute',
                top: pos.y,
                left: pos.x,
                zIndex: 10
            }}>
            <img
                ref={imgRef}
                className="draggable resizable w-full h-full object-contain select-none pointer-events-none"
                src={imageSample}
                alt="watermark"
                draggable={false}
            />
        </div>
    );
}
