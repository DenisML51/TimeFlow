import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PointMaterial, Points } from "@react-three/drei";
import * as random from 'maath/random/dist/maath-random.esm';

export const ParticleBackground2 = (props) => {
  const ref = useRef();
  const initialPositions = useRef();

  // Инициализация частиц в плоской плоскости
  const [sphere] = React.useState(() => {
    const positions = random.inBox(new Float32Array(6000 * 3), { sides: [8, 0.01, 8] });
    initialPositions.current = positions.slice();
    return positions;
  });

  useFrame((state, delta) => {
    if (!ref.current) return;

    const positions = ref.current.geometry.attributes.position.array;
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < positions.length; i += 3) {
      // Берем начальные координаты из первоначального расположения
      const ix = initialPositions.current[i];
      const iz = initialPositions.current[i + 2];

      // Создаем волнообразное движение с использованием синусоидальных функций
      positions[i + 1] = Math.sin(ix * 2 + time) * Math.cos(iz * 2 + time * 0.5) * 0.7;
    }

    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
      <PointMaterial
        transparent
        color="#10A37F"
        size={0.005}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </Points>
  );
};


