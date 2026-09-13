import React, { useRef, useEffect } from 'react';
import { Renderer, Program, Triangle, Mesh } from 'ogl';
import './RippleGrid.css';

export interface RippleGridProps {
  enableRainbow?: boolean;
  gridColor?: string;
  rippleIntensity?: number;
  gridSize?: number;
  gridThickness?: number;
  fadeDistance?: number;
  vignetteStrength?: number;
  glowIntensity?: number;
  opacity?: number;
  gridRotation?: number;
  mouseInteraction?: boolean;
  mouseInteractionRadius?: number;
  lightMode?: boolean;
  perspective?: number;
  moveSpeed?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const RippleGrid: React.FC<RippleGridProps> = ({
  enableRainbow = false,
  gridColor = '#ffffff',
  rippleIntensity = 0.05,
  gridSize = 10.0,
  gridThickness = 15.0,
  fadeDistance = 1.5,
  vignetteStrength = 2.0,
  glowIntensity = 0.1,
  opacity = 1.0,
  gridRotation = 0,
  mouseInteraction = true,
  mouseInteractionRadius = 1,
  lightMode = false,
  perspective = 0.0,
  moveSpeed = 0.2,
  className = '',
  style,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mousePositionRef = useRef({ x: 0.5, y: 0.5 });
  const targetMouseRef = useRef({ x: 0.5, y: 0.5 });
  const mouseInfluenceRef = useRef(0);
  const uniformsRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255]
        : [1, 1, 1];
    };

    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio, 2),
      alpha: true
    });
    const gl = renderer.gl;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';
    gl.canvas.style.display = 'block';
    containerRef.current.appendChild(gl.canvas);

    const vert = `
attribute vec2 position;
varying vec2 vUv;
void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
}`;

    const frag = `precision highp float;
uniform float iTime;
uniform vec2 iResolution;
uniform bool enableRainbow;
uniform vec3 gridColor;
uniform float rippleIntensity;
uniform float gridSize;
uniform float gridThickness;
uniform float fadeDistance;
uniform float vignetteStrength;
uniform float glowIntensity;
uniform float opacity;
uniform float gridRotation;
uniform bool mouseInteraction;
uniform vec2 mousePosition;
uniform float mouseInfluence;
uniform float mouseInteractionRadius;
uniform bool lightMode;
uniform float perspective;
uniform float moveSpeed;
varying vec2 vUv;

float pi = 3.141592;

mat2 rotate(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;

    if (gridRotation != 0.0) {
        uv = rotate(gridRotation * pi / 180.0) * uv;
    }

    vec2 gridUv = uv;
    if (perspective > 0.0) {
        float z = 1.0 - uv.y * perspective * 0.75;
        z = max(z, 0.12);
        gridUv = vec2(uv.x / z, uv.y / z);
    }

    // Continuous smooth grid movement forward
    gridUv.y -= iTime * moveSpeed;

    vec2 rippleUv = gridUv;
    if (rippleIntensity > 0.0) {
        float dist = length(gridUv);
        float func = sin(pi * (iTime * 1.5 - dist));
        rippleUv += gridUv * func * rippleIntensity;

        if (mouseInteraction && mouseInfluence > 0.0) {
            vec2 mouseUv = (mousePosition * 2.0 - 1.0);
            mouseUv.x *= iResolution.x / iResolution.y;
            float mouseDist = length(gridUv - mouseUv);
            float influence = mouseInfluence * exp(-mouseDist * mouseDist / (mouseInteractionRadius * mouseInteractionRadius));
            float mouseWave = sin(pi * (iTime * 2.0 - mouseDist * 3.0)) * influence;
            rippleUv += normalize(gridUv - mouseUv) * mouseWave * rippleIntensity * 0.3;
        }
    }

    vec2 a = sin(gridSize * 0.5 * pi * rippleUv - pi / 2.0);
    vec2 b = abs(a);

    float aaWidth = 0.5;
    vec2 smoothB = vec2(
        smoothstep(0.0, aaWidth, b.x),
        smoothstep(0.0, aaWidth, b.y)
    );

    float pulse = rippleIntensity > 0.0 ? (0.8 + 0.5 * sin(pi * iTime)) : 1.0;
    float c = 0.0;
    // Crisp grid lines only (no background shadow haze)
    c += exp(-gridThickness * smoothB.x * pulse);
    c += exp(-gridThickness * smoothB.y);

    if (glowIntensity > 0.0) {
        c += glowIntensity * exp(-gridThickness * 0.5 * smoothB.x);
        c += glowIntensity * exp(-gridThickness * 0.5 * smoothB.y);
    }

    // Spotlight only lights up grid lines - does not paint a dark shadow blob on background
    if (mouseInteraction && mouseInfluence > 0.0) {
        vec2 mouseUv = (mousePosition * 2.0 - 1.0);
        mouseUv.x *= iResolution.x / iResolution.y;
        float mouseDist = length(uv - mouseUv);
        float spotlight = exp(-mouseDist * mouseDist * 3.8 / (mouseInteractionRadius * mouseInteractionRadius));
        c += c * spotlight * mouseInfluence * 1.4;
    }

    float dist = length(uv);
    float ddd = exp(-2.0 * clamp(pow(dist, fadeDistance), 0.0, 1.0));
    
    vec2 vignetteCoords = vUv - 0.5;
    float vignetteDistance = length(vignetteCoords);
    float vignette = 1.0 - pow(vignetteDistance * 2.0, vignetteStrength);
    vignette = clamp(vignette, 0.0, 1.0);

    float depthFade = 1.0;
    if (perspective > 0.0) {
        depthFade = clamp(1.0 - uv.y * 0.65, 0.0, 1.0);
    }
    
    vec3 t;
    if (enableRainbow) {
        t = vec3(
            uv.x * 0.5 + 0.5 * sin(iTime),
            uv.y * 0.5 + 0.5 * cos(iTime),
            pow(cos(iTime), 4.0)
        ) + 0.5;
    } else {
        t = gridColor;
    }

    float finalFade = ddd * vignette * depthFade;
    float gridAlpha = clamp(c, 0.0, 1.0) * finalFade * opacity;
    // Completely transparent background between lines - zero shadow
    gl_FragColor = vec4(t, gridAlpha);
}
`;

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: [1, 1] },
      enableRainbow: { value: enableRainbow },
      gridColor: { value: hexToRgb(gridColor) },
      rippleIntensity: { value: rippleIntensity },
      gridSize: { value: gridSize },
      gridThickness: { value: gridThickness },
      fadeDistance: { value: fadeDistance },
      vignetteStrength: { value: vignetteStrength },
      glowIntensity: { value: glowIntensity },
      opacity: { value: opacity },
      gridRotation: { value: gridRotation },
      mouseInteraction: { value: mouseInteraction },
      mousePosition: { value: [0.5, 0.5] },
      mouseInfluence: { value: 0 },
      mouseInteractionRadius: { value: mouseInteractionRadius },
      lightMode: { value: lightMode },
      perspective: { value: perspective },
      moveSpeed: { value: moveSpeed }
    };

    uniformsRef.current = uniforms;

    const geometry = new Triangle(gl);
    const program = new Program(gl, { vertex: vert, fragment: frag, uniforms });
    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth || 300;
      const h = containerRef.current.clientHeight || 300;
      renderer.setSize(w, h);
      uniforms.iResolution.value = [w, h];
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseInteraction || !containerRef.current) return;
      mouseInfluenceRef.current = 1.0;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / (rect.width || 1);
      const y = 1.0 - (e.clientY - rect.top) / (rect.height || 1); // Flip Y coordinate
      targetMouseRef.current = { x, y };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!mouseInteraction || !containerRef.current || e.touches.length === 0) return;
      mouseInfluenceRef.current = 1.0;
      const rect = containerRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      const x = (touch.clientX - rect.left) / (rect.width || 1);
      const y = 1.0 - (touch.clientY - rect.top) / (rect.height || 1);
      targetMouseRef.current = { x, y };
    };

    const handleMouseEnter = () => {
      if (!mouseInteraction) return;
      mouseInfluenceRef.current = 1.0;
    };

    const handleMouseLeave = () => {
      if (!mouseInteraction) return;
      mouseInfluenceRef.current = 0.0;
    };

    window.addEventListener('resize', resize);
    const ro = new ResizeObserver(() => resize());
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }

    if (mouseInteraction && containerRef.current) {
      containerRef.current.addEventListener('mousemove', handleMouseMove);
      containerRef.current.addEventListener('mouseenter', handleMouseEnter);
      containerRef.current.addEventListener('mouseleave', handleMouseLeave);
      containerRef.current.addEventListener('touchmove', handleTouchMove, { passive: true });
      containerRef.current.addEventListener('touchstart', handleMouseEnter, { passive: true });
      containerRef.current.addEventListener('touchend', handleMouseLeave, { passive: true });
    }
    resize();

    let animationFrameId: number;
    const render = (t: number) => {
      uniforms.iTime.value = t * 0.001;

      const lerpFactor = 0.1;
      mousePositionRef.current.x += (targetMouseRef.current.x - mousePositionRef.current.x) * lerpFactor;
      mousePositionRef.current.y += (targetMouseRef.current.y - mousePositionRef.current.y) * lerpFactor;

      const currentInfluence = uniforms.mouseInfluence.value;
      const targetInfluence = mouseInfluenceRef.current;
      uniforms.mouseInfluence.value += (targetInfluence - currentInfluence) * 0.05;

      uniforms.mousePosition.value = [mousePositionRef.current.x, mousePositionRef.current.y];

      renderer.render({ scene: mesh });
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    const container = containerRef.current;
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      ro.disconnect();
      if (mouseInteraction && container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseenter', handleMouseEnter);
        container.removeEventListener('mouseleave', handleMouseLeave);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchstart', handleMouseEnter);
        container.removeEventListener('touchend', handleMouseLeave);
      }
      renderer.gl.getExtension('WEBGL_lose_context')?.loseContext();
      if (container && gl.canvas && container.contains(gl.canvas)) {
        container.removeChild(gl.canvas);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!uniformsRef.current) return;

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255]
        : [1, 1, 1];
    };

    uniformsRef.current.enableRainbow.value = enableRainbow;
    uniformsRef.current.gridColor.value = hexToRgb(gridColor);
    uniformsRef.current.rippleIntensity.value = rippleIntensity;
    uniformsRef.current.gridSize.value = gridSize;
    uniformsRef.current.gridThickness.value = gridThickness;
    uniformsRef.current.fadeDistance.value = fadeDistance;
    uniformsRef.current.vignetteStrength.value = vignetteStrength;
    uniformsRef.current.glowIntensity.value = glowIntensity;
    uniformsRef.current.opacity.value = opacity;
    uniformsRef.current.gridRotation.value = gridRotation;
    uniformsRef.current.mouseInteraction.value = mouseInteraction;
    uniformsRef.current.mouseInteractionRadius.value = mouseInteractionRadius;
    uniformsRef.current.lightMode.value = lightMode;
    uniformsRef.current.perspective.value = perspective;
    uniformsRef.current.moveSpeed.value = moveSpeed;
  }, [
    enableRainbow,
    gridColor,
    rippleIntensity,
    gridSize,
    gridThickness,
    fadeDistance,
    vignetteStrength,
    glowIntensity,
    opacity,
    gridRotation,
    mouseInteraction,
    mouseInteractionRadius,
    lightMode,
    perspective,
    moveSpeed
  ]);

  return (
    <div
      ref={containerRef}
      className={`ripple-grid-container ${className}`}
      style={style}
    />
  );
};

export default RippleGrid;
