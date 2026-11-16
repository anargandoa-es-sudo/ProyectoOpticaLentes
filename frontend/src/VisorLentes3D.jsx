import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, RoundedBox } from '@react-three/drei';

function LentesInteractivos({ colorMontura, tipoCristal, formaAro, autoRotar }) {
  const grupoRef = useRef();

  useFrame((state, delta) => {
    if (grupoRef.current && autoRotar) {
      grupoRef.current.rotation.y += delta * 0.45;
    }
  });

  // Propiedades físicas dinámicas del cristal según filtro elegido
  const estilosCristal = {
    transparente: { color: '#e0f2fe', opacity: 0.22, roughness: 0.05 },
    luz_azul: { color: '#60a5fa', opacity: 0.35, roughness: 0.08 },
    polarizado: { color: '#0f172a', opacity: 0.78, roughness: 0.1 },
    ambar: { color: '#f59e0b', opacity: 0.42, roughness: 0.08 },
  };

  const cristalActual = estilosCristal[tipoCristal] || estilosCristal.transparente;

  const renderAro = (lado) => {
    const posX = lado === 'izq' ? -0.68 : 0.68;

    if (formaAro === 'rectangular') {
      return (
        <group position={[posX, 0, 0]}>
          {/* Marco Rectangular */}
          <RoundedBox args={[1.05, 0.68, 0.09]} radius={0.08} smoothness={4}>
            <meshStandardMaterial color={colorMontura} metalness={0.75} roughness={0.22} />
          </RoundedBox>
          {/* Cristal Rectangular */}
          <RoundedBox args={[0.92, 0.55, 0.1]} radius={0.06} smoothness={4}>
            <meshPhysicalMaterial
              color={cristalActual.color}
              transparent
              opacity={cristalActual.opacity}
              roughness={cristalActual.roughness}
              metalness={0.1}
              clearcoat={1}
            />
          </RoundedBox>
        </group>
      );
    }

    if (formaAro === 'aviador') {
      return (
        <group position={[posX, -0.04, 0]} scale={[1.08, 1.15, 1]}>
          <mesh>
            <torusGeometry args={[0.48, 0.045, 20, 48]} />
            <meshStandardMaterial color={colorMontura} metalness={0.85} roughness={0.18} />
          </mesh>
          <mesh>
            <circleGeometry args={[0.46, 48]} />
            <meshPhysicalMaterial
              color={cristalActual.color}
              transparent
              opacity={cristalActual.opacity}
              roughness={cristalActual.roughness}
              side={2}
              clearcoat={1}
            />
          </mesh>
        </group>
      );
    }

    // Por defecto: Redondo Clásico
    return (
      <group position={[posX, 0, 0]}>
        <mesh>
          <torusGeometry args={[0.48, 0.055, 20, 48]} />
          <meshStandardMaterial color={colorMontura} metalness={0.75} roughness={0.22} />
        </mesh>
        <mesh>
          <circleGeometry args={[0.46, 48]} />
          <meshPhysicalMaterial
            color={cristalActual.color}
            transparent
            opacity={cristalActual.opacity}
            roughness={cristalActual.roughness}
            side={2}
            clearcoat={1}
          />
        </mesh>
      </group>
    );
  };

  return (
    <group ref={grupoRef} position={[0, 0.1, 0]}>
      {/* Aro Izquierdo y Derecho */}
      {renderAro('izq')}
      {renderAro('der')}

      {/* Puente Nasal */}
      <mesh position={[0, 0.08, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.032, 0.032, 0.42, 16]} />
        <meshStandardMaterial color={colorMontura} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Barra superior extra si es estilo Aviador */}
      {formaAro === 'aviador' && (
        <mesh position={[0, 0.36, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.025, 0.025, 1.35, 16]} />
          <meshStandardMaterial color={colorMontura} metalness={0.85} roughness={0.2} />
        </mesh>
      )}

      {/* Patilla Izquierda */}
      <mesh position={[-1.18, 0.05, -0.78]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.025, 1.55, 16]} />
        <meshStandardMaterial color={colorMontura} metalness={0.75} roughness={0.25} />
      </mesh>

      {/* Patilla Derecha */}
      <mesh position={[1.18, 0.05, -0.78]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.025, 1.55, 16]} />
        <meshStandardMaterial color={colorMontura} metalness={0.75} roughness={0.25} />
      </mesh>
    </group>
  );
}

export default function VisorLentes3D({
  colorMontura = '#1e293b',
  tipoCristal = 'transparente',
  formaAro = 'redondo',
}) {
  const [autoRotar, setAutoRotar] = useState(true);

  return (
    <div
      style={{
        width: '100%',
        height: '330px',
        background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)',
        borderRadius: '14px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          right: '12px',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            background: 'rgba(15, 23, 42, 0.72)',
            color: '#e2e8f0',
            padding: '5px 11px',
            borderRadius: '999px',
            fontSize: '12px',
          }}
        >
          🖱️ Arrastra para rotar 360° • Rueda para Zoom
        </span>

        <button
          type="button"
          onClick={() => setAutoRotar(!autoRotar)}
          style={{
            pointerEvents: 'auto',
            background: autoRotar ? '#2563eb' : 'rgba(15, 23, 42, 0.85)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '999px',
            padding: '5px 12px',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          {autoRotar ? '⏸ Pausar Giro' : '▶ Auto-Girar'}
        </button>
      </div>

      <Canvas camera={{ position: [0, 0.35, 3.2], fov: 45 }}>
        <ambientLight intensity={0.65} />
        <directionalLight position={[5, 8, 5]} intensity={1.3} />
        <pointLight position={[-4, 3, 4]} intensity={0.6} color="#93c5fd" />
        <LentesInteractivos
          colorMontura={colorMontura}
          tipoCristal={tipoCristal}
          formaAro={formaAro}
          autoRotar={autoRotar}
        />
        <ContactShadows position={[0, -0.75, 0]} opacity={0.45} scale={6} blur={2.4} />
        <Environment preset="city" />
        <OrbitControls enablePan={false} minDistance={2} maxDistance={5.5} />
      </Canvas>
    </div>
  );
}