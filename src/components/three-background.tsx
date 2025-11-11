'use client';

import { useEffect, useRef } from 'react';

export function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let animationFrameId: number;
    let scene: any, camera: any, renderer: any;
    let particles: any;
    let destinations: any[] = [];

    const init = async () => {
      const THREE = await import('three');

      // Scene setup
      scene = new THREE.Scene();

      // Camera setup
      camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        1,
        2000
      );
      camera.position.z = 500;

      // Renderer setup
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      containerRef.current?.appendChild(renderer.domElement);

      // Simple particles (stars)
      const particlesGeometry = new THREE.BufferGeometry();
      const particlesCount = 1500;
      const posArray = new Float32Array(particlesCount * 3);

      for (let i = 0; i < particlesCount * 3; i += 3) {
        posArray[i] = (Math.random() - 0.5) * 2000;
        posArray[i + 1] = (Math.random() - 0.5) * 2000;
        posArray[i + 2] = (Math.random() - 0.5) * 2000;
      }

      particlesGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(posArray, 3)
      );

      const particlesMaterial = new THREE.PointsMaterial({
        size: 1.5,
        color: 0x3b82f6,
        transparent: true,
        opacity: 0.6,
      });

      particles = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particles);

      // Add a few glowing destination orbs
      for (let i = 0; i < 8; i++) {
        const geometry = new THREE.SphereGeometry(2, 16, 16);
        const material = new THREE.MeshBasicMaterial({
          color: 0x06b6d4,
          transparent: true,
          opacity: 0.6,
        });
        const orb = new THREE.Mesh(geometry, material);
        orb.position.set(
          (Math.random() - 0.5) * 1000,
          (Math.random() - 0.5) * 600,
          (Math.random() - 0.5) * 800
        );
        scene.add(orb);
        destinations.push(orb);
      }

      // Window resize handler
      const onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };

      window.addEventListener('resize', onWindowResize);

      // Simple animation loop
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        // Slow rotation
        particles.rotation.y += 0.0003;

        // Gentle pulsing of destinations
        destinations.forEach((orb: any, i: number) => {
          const pulse = Math.sin(Date.now() * 0.001 + i) * 0.3 + 1;
          orb.scale.set(pulse, pulse, pulse);
        });

        renderer.render(scene, camera);
      };

      animate();

      // Cleanup
      return () => {
        window.removeEventListener('resize', onWindowResize);
        cancelAnimationFrame(animationFrameId);
        renderer.dispose();
        particlesGeometry.dispose();
        particlesMaterial.dispose();
        containerRef.current?.removeChild(renderer.domElement);
      };
    };

    const cleanup = init();

    return () => {
      cleanup.then((cleanupFn) => cleanupFn?.());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10"
      style={{ background: 'linear-gradient(to bottom, #0a0a0a, #1a1a2e)' }}
    />
  );
}
