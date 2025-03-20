import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { PointMaterial, Points } from "@react-three/drei";
import * as random from "maath/random/dist/maath-random.esm";
import { Box, alpha } from "@mui/material";
import { motion } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import { Html } from '@react-three/drei';
import { keyframes } from '@mui/system';

const lineVariants = {
  hidden: { opacity: 0 },
  visible: (i) => ({
    opacity: 0.2,
    transition: {
      delay: i * 0.2,
      duration: 2,
      repeat: Infinity,
      repeatType: "reverse",
    },
  }),
};

export const ParticleBackground = (props) => {
  const theme = useTheme();
  const ref = useRef();
  const [sphere] = React.useState(() =>
    random.inSphere(new Float32Array(1000), { radius: 1 })
  );

  useFrame((state, delta) => {
    ref.current.rotation.x -= delta / 10;
    ref.current.rotation.y -= delta / 15;
  });

  return (
    <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
      <PointMaterial
        transparent
        color={theme.palette.primary.secondary }
        size={0.005}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </Points>
  );
};

export const ParticleBackground22 = (props) => {
  const theme = useTheme();
  const groupRef = useRef();
  const materialRef = useRef();
  // Увеличен радиус для более современного распределения
  const [sphere] = React.useState(() =>
    random.inSphere(new Float32Array(6000), { radius: 2.0 })
  );

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.x -= delta / 10;
      groupRef.current.rotation.y -= delta / 15;
    }
    if (materialRef.current) {
      // Плавное пульсирование размера частиц
      materialRef.current.size = 0.005 + 0.003 * Math.sin(state.clock.elapsedTime * 2);
    }
  });

  return (
    <Points ref={groupRef} positions={sphere} stride={3} frustumCulled={false} {...props}>
      <PointMaterial
        ref={materialRef}
        transparent
        color={theme.palette.primary.secondary}
        size={0.005}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
};


export const ParticleBackground7865 = () => {
    const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;
  return (
    // Html с пропсом fullscreen рендерит содержимое как полноэкранный overlay
    <Html fullscreen>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
          background: 'linear-gradient(270deg, #4a90e2, #50e3c2, #ff6b6b, #ffe66d)',
          backgroundSize: '800% 800%',
          animation: `${gradientAnimation} 20s ease infinite`,
        }}
      />
    </Html>
  );
};


export const ParticleBackground2 = (props) => {
  const theme = useTheme();
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
      const ix = initialPositions.current[i];
      const iz = initialPositions.current[i + 2];

      positions[i + 1] = Math.sin(ix * 3 + time * 0.1) * Math.cos(iz * 3 + time * 0.5) * 0.7;
    }

    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
      <PointMaterial
        transparent
        color={theme.palette.primary.main}
        size={0.005}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </Points>
  );
};

export const ParticleBackground4 = (props) => {
  const theme = useTheme();
  const ref = useRef();
  const initialPositions = useRef();

  // Увеличиваем количество частиц и добавляем начальное смещение по Y
  const [particles] = React.useState(() => {
    const positions = random.inBox(new Float32Array(15000 * 3), {
      sides: [6, 1.5, 6],
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
        color={theme.palette.primary.secondary}
        opacity={0.65}
        size={0.01}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
};

export const ParticleBackground5 = () => {
  const theme = useTheme();
  // Вычисляем случайные значения один раз при монтировании
  const lines = React.useMemo(
    () =>
      [...Array(12)].map((_, i) => ({
        width: `${Math.random() * 30 + 20}%`,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        rotate: `${Math.random() * 360}deg`,
        key: i,
      })),
    []
  );

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 0,
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
            position: "absolute",
            background: `linear-gradient(90deg, ${alpha(
              theme.palette.primary.main,
              0
            )} 0%, ${theme.palette.primary.main} 50%, ${alpha(
              theme.palette.primary.main,
              0
            )} 100%)`,
            height: "1px",
            width: line.width,
            left: line.left,
            top: line.top,
            transform: `rotate(${line.rotate})`,
          }}
        />
      ))}
    </Box>
  );
};
