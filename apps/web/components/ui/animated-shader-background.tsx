"use client";
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { cn } from "@/lib/utils";

export const AnimatedShaderBackground = ({ className }: { className?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: 'low-power',
    });
    renderer.setPixelRatio(1);

    const updateSize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      if (material.uniforms.iResolution) {
        material.uniforms.iResolution.value.set(w, h);
      }
    };

    const material = new THREE.ShaderMaterial({
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      },
      vertexShader: `void main() { gl_Position = vec4(position, 1.0); }`,
      fragmentShader: `
        uniform float iTime;
        uniform vec2 iResolution;

        #define NUM_OCTAVES 2

        float rand(vec2 n) {
          return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
        }

        float noise(vec2 p) {
          vec2 ip = floor(p);
          vec2 u = fract(p);
          u = u*u*(3.0-2.0*u);
          return mix(
            mix(rand(ip), rand(ip+vec2(1,0)), u.x),
            mix(rand(ip+vec2(0,1)), rand(ip+vec2(1,1)), u.x), u.y
          );
        }

        float fbm(vec2 x) {
          float v = 0.0;
          float a = 0.3;
          vec2 shift = vec2(100);
          mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
          for (int i = 0; i < NUM_OCTAVES; ++i) {
            v += a * noise(x);
            x = rot * x * 2.0 + shift;
            a *= 0.4;
          }
          return v;
        }

        void main() {
          vec2 shake = vec2(sin(iTime*1.2)*0.005, cos(iTime*2.1)*0.005);
          vec2 p = ((gl_FragCoord.xy + shake*iResolution.xy) - iResolution.xy*0.5) / iResolution.y * mat2(6,-4,4,6);
          vec2 v;
          vec4 o = vec4(0.0);

          float f = 2.0 + fbm(p + vec2(iTime*5.0, 0.0)) * 0.5;

          for (float i = 0.0; i < 20.0; i++) {
            v = p + cos(i*i + (iTime + p.x*0.08)*0.025 + i*vec2(13,11))*3.5
              + vec2(sin(iTime*3.0+i)*0.003, cos(iTime*3.5-i)*0.003);
            float tailNoise = fbm(v + vec2(iTime*0.5, i)) * 0.3 * (1.0 - i/20.0);
            vec4 col = vec4(
              0.02 + 0.03*sin(i*0.2 + iTime*0.4),
              0.02 + 0.03*cos(i*0.3 + iTime*0.5),
              0.12 + 0.12*sin(i*0.4 + iTime*0.3),
              1.0
            );
            o += col * exp(sin(i*i + iTime*0.8)) / length(max(v, vec2(v.x*f*0.015, v.y*1.5)))
              * (1.0 + tailNoise*0.8) * smoothstep(0.0, 1.0, i/20.0) * 0.6;
          }

          o = tanh(pow(o / 100.0, vec4(1.6)));
          gl_FragColor = vec4(o.rgb * 1.3, 1.0);
        }
      `,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    scene.add(new THREE.Mesh(geometry, material));
    container.appendChild(renderer.domElement);
    updateSize();

    const TARGET_INTERVAL = 1000 / 30;
    let frameId: number;
    let lastTime = 0;

    const animate = (timestamp: number) => {
      frameId = requestAnimationFrame(animate);
      const elapsed = timestamp - lastTime;
      if (elapsed < TARGET_INTERVAL) return;
      lastTime = timestamp - (elapsed % TARGET_INTERVAL);
      material.uniforms.iTime.value += 0.016;
      renderer.render(scene, camera);
    };
    frameId = requestAnimationFrame(animate);

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frameId);
      } else {
        lastTime = 0;
        frameId = requestAnimationFrame(animate);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('resize', updateSize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', updateSize);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("pointer-events-none fixed inset-0 z-0", className)}
    />
  );
};
