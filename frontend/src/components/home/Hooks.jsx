import React, { useRef } from "react";
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Paper,
  useTheme
} from "@mui/material";
import { motion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { TbCloudUpload, TbCpu, TbChartLine, TbShieldLock, TbRocket } from "react-icons/tb";
import * as random from "maath/random/dist/maath-random.esm";

// Создаём анимированную кнопку на базе framer-motion и MUI Button
const AnimatedButton = motion(Button);

// Компонент для 3D-демонстрации (интерактивная визуализация)
const InteractiveChart = () => {
  return (
    <Canvas style={{ height: "400px", background: "transparent" }}>
      <PointsSection />
    </Canvas>
  );
};

// Компонент с точками, который крутится
const PointsSection = () => {
  const ref = useRef();
  // Генерируем случайные координаты для точек
  const points = random.inSphere(new Float32Array(500), { radius: 1.5 });

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attachObject={["attributes", "position"]}
          count={points.length / 3}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <pointMaterial attach="material" color="#10A37F" size={0.05} />
    </points>
  );
};

export const FeatureGridSection = () => {
  const features = [
    {
      icon: <TbCloudUpload size="2em" />,
      title: "Smart Data Ingestion",
      text: "Automated data type detection and missing value imputation",
      gradient: "linear-gradient(135deg, #10A37F 0%, #00FF88 100%)"
    },
    {
      icon: <TbCpu size="2em" />,
      title: "AI Forecasting Engine",
      text: "Hybrid models combining Transformer and LSTM architectures",
      gradient: "linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)"
    },
    {
      icon: <TbChartLine size="2em" />,
      title: "Interactive Analytics",
      text: "3D visualization with multi-touch gesture support",
      gradient: "linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)"
    },
    {
      icon: <TbShieldLock size="2em" />,
      title: "Military-grade Security",
      text: "GDPR compliant with AES-256 encryption",
      gradient: "linear-gradient(135deg, #9F7AEA 0%, #FEE140 100%)"
    }
  ];

  return (
    <Box sx={{ py: 15, position: "relative" }}>
      <Container maxWidth="xl">
        <Grid container spacing={6}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={3} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <Paper
                  sx={{
                    p: 4,
                    height: "100%",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 4,
                    backdropFilter: "blur(12px)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: `0 16px 48px ${feature.gradient}30`
                    }
                  }}
                >
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      mb: 3,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: `${feature.gradient}10`,
                      borderRadius: 3,
                      position: "relative",
                      "&:before": {
                        content: '""',
                        position: "absolute",
                        inset: -1,
                        background: feature.gradient,
                        borderRadius: "inherit",
                        zIndex: -1,
                        filter: "blur(12px)",
                        opacity: 0.3
                      }
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" sx={{ color: "text.secondary" }}>
                    {feature.text}
                  </Typography>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export const LiveDemoSection = () => {
  return (
    <Box sx={{ py: 15, position: "relative" }}>
      <Container maxWidth="xl">
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Typography variant="h3" sx={{ mb: 4, fontWeight: 700 }}>
                Real-time Forecasting Demo
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "text.secondary",
                  fontSize: "1.25rem",
                  lineHeight: 1.6,
                  mb: 6
                }}
              >
                Interact with our live demo to experience the power of AI-driven
                predictions. Adjust parameters and see results update in real-time.
              </Typography>
              <Button
                variant="outlined"
                size="large"
                endIcon={<TbRocket />}
                sx={{
                  px: 6,
                  py: 2.5,
                  borderRadius: 3,
                  borderWidth: 2,
                  fontSize: "1.1rem",
                  fontWeight: 600
                }}
              >
                Launch Interactive Demo
              </Button>
            </motion.div>
          </Grid>
          <Grid item xs={12} md={6}>
            <InteractiveChart />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export const CTASection = () => {
  return (
    <Box sx={{ py: 15, position: "relative" }}>
      <Container maxWidth="md">
        <Box
          sx={{
            textAlign: "center",
            p: 6,
            borderRadius: 6,
            background:
              "linear-gradient(135deg, rgba(16,163,127,0.1) 0%, rgba(16,22,35,0.8) 100%)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 24px 64px rgba(16,163,127,0.2)",
            backdropFilter: "blur(12px)"
          }}
        >
          <Typography variant="h3" sx={{ mb: 3, fontWeight: 700 }}>
            Start Your AI Journey Today
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "text.secondary",
              fontSize: "1.25rem",
              mb: 6
            }}
          >
            Join thousands of data scientists and businesses transforming their
            operations with AI.
          </Typography>
          <AnimatedButton
            variant="contained"
            size="large"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            sx={{
              px: 8,
              py: 2.5,
              borderRadius: 3,
              fontSize: "1.1rem",
              fontWeight: 600,
              background:
                "linear-gradient(135deg, #10A37F 0%, #00FF88 100%)",
              boxShadow: "0 8px 32px rgba(16,163,127,0.3)"
            }}
          >
            Get Started Free
          </AnimatedButton>
        </Box>
      </Container>
    </Box>
  );
};
