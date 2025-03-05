import React, {useRef} from "react";
import * as THREE from "three";
import {useFrame} from "@react-three/fiber";
import {PointMaterial, Points} from "@react-three/drei";
import * as random from 'maath/random/dist/maath-random.esm';
import {Box} from "@mui/material";
import {motion} from "framer-motion";

const lineVariants = {
  hidden: { opacity: 0 },
  visible: (i) => ({
    opacity: 0.2,
    transition: {
      delay: i * 0.2,
      duration: 2,
      repeat: Infinity,
      repeatType: 'reverse'
    }
  })
};

export const ParticleBackground = (props) => {
  const ref = useRef();
  const [sphere] = React.useState(() => random.inSphere(new Float32Array(6000), { radius: 1.5 }));

  useFrame((state, delta) => {
    ref.current.rotation.x -= delta / 10;
    ref.current.rotation.y -= delta / 15;
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


export const ParticleBackground1 = (props) => {
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
      positions[i + 1] = Math.sin(ix * 3 + time * 0.1) * Math.cos(iz * 3 + time * 0.5) * 0.7;
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


export const ParticleBackground3 = (props) => {
  const ref = useRef();
  const initialPositions = useRef();

  // Увеличиваем количество частиц и добавляем начальное смещение по Y
  const [particles] = React.useState(() => {
    const positions = random.inBox(new Float32Array(15000 * 3), {
      sides: [6, 1.5, 6]
    });
    initialPositions.current = positions.slice();
    return positions;
  });

  useFrame((state, delta) => {
    if (!ref.current) return;

    const positions = ref.current.geometry.attributes.position.array;
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < positions.length; i += 3) {
      const ix = initialPositions.current[i];
      const iy = initialPositions.current[i + 1];
      const iz = initialPositions.current[i + 2];

      // Плавная комбинированная анимация с уменьшенной амплитудой
      positions[i] = ix + Math.sin(time * 0.5 + iz) * 0.15;
      positions[i + 1] = iy + Math.cos(time * 0.6 + ix) * 0.12;
      positions[i + 2] = iz + Math.sin(time * 0.4 + iy) * 0.15;
    }

    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <Points ref={ref} positions={particles} stride={3} frustumCulled={false} {...props}>
      <PointMaterial
        transparent
        color="#4A7C6F" // Приглушенный цвет
        opacity={0.65}
        size={0.01} // Увеличиваем размер частиц
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
};


export const ParticleBackground4 = () => {
  // Вычисляем случайные значения один раз при монтировании
  const lines = React.useMemo(() => {
    return [...Array(12)].map((_, i) => ({
      width: `${Math.random() * 30 + 20}%`,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      rotate: `${Math.random() * 360}deg`,
      key: i
    }));
  }, []);

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0
      }}
    >
      {lines.map((line, i) => (
        <motion.div
          key={line.key}
          custom={i}
          variants={lineVariants}
          initial="hidden"
          animate="visible"
          style={{
            position: 'absolute',
            background: `linear-gradient(90deg, rgba(16,163,127,0) 0%, #10A37F 50%, rgba(16,163,127,0) 100%)`,
            height: '1px',
            width: line.width,
            left: line.left,
            top: line.top,
            transform: `rotate(${line.rotate})`
          }}
        />
      ))}
    </Box>
  );
};