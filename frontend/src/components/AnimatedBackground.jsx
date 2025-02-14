// components/AnimatedBackground.js
import React from 'react';
import { motion } from 'framer-motion';
import { Box } from "@mui/material";

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

export const FloatingLinesBackground = () => {
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
