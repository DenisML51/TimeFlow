// src/pages/Home.jsx
import React, { useContext, useRef } from "react";
import {
  Box, Button, Container, Grid, Typography, Paper, useTheme, Stack
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { motion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import {ParticleBackground} from "../components/home/ParticleBackground";
import { TbChartLine, TbCloudUpload, TbCpu, TbShieldLock, TbRocket } from "react-icons/tb";
import { GradientText } from "../components/home/GradientText";

const AnimatedButton = motion(Button);

const LiveDemoPreview = () => {
  const theme = useTheme();

  return (
    <motion.div
      style={{
        position: 'relative',
        perspective: 1000
      }}
      initial={{ rotateY: 30, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ duration: 1.2, delay: 0.3 }}
    >
      <Box sx={{
        background: 'linear-gradient(145deg, rgba(16,163,127,0.1) 0%, rgba(16,22,35,0.8) 100%)',
        borderRadius: 6,
        p: 3,
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(12px)',
        transformStyle: 'preserve-3d'
      }}>
        <Box component="img" src="assets/dashboard-preview.png"
          sx={{ width: '100%', borderRadius: 4 }} />

        <motion.div
          style={{
            position: 'absolute',
            top: '30%',
            left: '20%',
            width: '60%',
            height: 2,
            background: theme.palette.primary.main,
            transformOrigin: 'left center'
          }}
          animate={{
            scaleX: [0, 1, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </Box>
    </motion.div>
  );
};

const FeatureGridSection = () => {
  const features = [
    {
      icon: <TbCloudUpload size="2em" />,
      title: "Загрузка и фильтрация",
      text: "Загрузка, вычисление статистик и формирование выборки.",
      gradient: "linear-gradient(135deg, #10A37F 0%, #00FF88 100%)"
    },
    {
      icon: <TbCpu size="2em" />,
      title: "AI Прогноз",
      text: "Интерактивное взаимодействие с моделями прогнозирования.",
      gradient: "linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)"
    },
    {
      icon: <TbChartLine size="2em" />,
      title: "Аналитика",
      text: "Удобный инструмент для визуализации, надстройки и предобработки данных.",
      gradient: "linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)"
    },
    {
      icon: <TbShieldLock size="2em" />,
      title: "Система сессий",
      text: "Сохранение сессий для зарегистрированных пользователей.",
      gradient: "linear-gradient(135deg, #9F7AEA 0%, #FEE140 100%)"
    }
  ];

  return (
    <Box sx={{ py: 15, position: 'relative' }}>
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
                <Paper sx={{
                  p: 4,
                  height: '100%',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 4,
                  backdropFilter: 'blur(12px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: `0 16px 48px ${feature.gradient}30`
                  }
                }}>
                  <Box sx={{
                    width: 64,
                    height: 64,
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `${feature.gradient}10)`,
                    borderRadius: 3,
                    position: 'relative',
                    '&:before': {
                      content: '""',
                      position: 'absolute',
                      inset: -1,
                      background: feature.gradient,
                      borderRadius: 'inherit',
                      zIndex: -1,
                      filter: 'blur(12px)',
                      opacity: 0.3
                    }
                  }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
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

const CTASection = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  return (
    <Box sx={{ py: 15, position: 'relative' }}>
      <Container maxWidth="md">
        <Box sx={{
          textAlign: 'center',
          p: 6,
          borderRadius: 6,
          background: 'linear-gradient(135deg, rgba(16,163,127,0.1) 0%, rgba(16,22,35,0.8) 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 64px rgba(16,163,127,0.2)',
          backdropFilter: 'blur(12px)'
        }}>
          <Typography variant="h3" sx={{ mb: 3, fontWeight: 700 }}>
            Начните анализировать уже сегодня
          </Typography>
          <Typography variant="body1" sx={{
            color: 'text.secondary',
            fontSize: '1.25rem',
            mb: 6
          }}>
            Изспользуйте современные методы анализа и прогнозирования временных рядов
          </Typography>
          <AnimatedButton
            variant="contained"
            size="large"
            onClick={() => navigate(user ? "/dashboard" : "/register")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            sx={{
              px: 8,
              py: 2.5,
              borderRadius: 3,
              fontSize: '1.1rem',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #10A37F 0%, #00FF88 100%)',
              boxShadow: '0 8px 32px rgba(16,163,127,0.3)'
            }}
          >
            {user ? "Начать анализ" : "Зарегистрироваться"}
          </AnimatedButton>
        </Box>
      </Container>
    </Box>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden' }}>
      <Canvas camera={{ position: [0, 0, 1] }} style={{ position: 'fixed', top: 0, left: 0 }}>
        <ParticleBackground />
      </Canvas>

      <Container sx={{ position: 'relative', zIndex: 1, pt: 20 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <GradientText variant="h1">
                TimeFlow
                <Box component="span" sx={{ display: 'block' }}>
                  Analytics
                </Box>
              </GradientText>

              <Typography variant="h6" sx={{
                color: 'text.secondary',
                my: 4,
                fontSize: '1.25rem',
                backdropFilter: 'blur(4px)',
                background: 'rgba(255,255,255,0.05)',
                p: 3,
                borderRadius: 4,
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                Загружайте, преобразуйте сырые данные и используйте их для прогноза.
                <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>
                  {" "}Начните анализ за 30 секунд.
                </Box>
              </Typography>

              <Stack direction="row" spacing={3} alignItems="center">
                <AnimatedButton
                  variant="contained"
                  size="large"
                  onClick={() => navigate(user ? "/dashboard" : "/register")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  sx={{
                    px: 6,
                    py: 2.5,
                    borderRadius: 3,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #10A37F 0%, #00FF88 100%)',
                    boxShadow: '0 8px 32px rgba(16,163,127,0.3)',
                    '&:hover': {
                      boxShadow: '0 12px 48px rgba(16,163,127,0.5)'
                    }
                  }}
                >
                  {user ? "Начать анализ" : "Зарегистрироваться"}
                </AnimatedButton>

                <Button
                  variant="outlined"
                  size="large"
                  endIcon={<TbRocket />}
                  onClick={() => navigate("/demo")}
                  sx={{
                    px: 4,
                    py: 2,
                    borderRadius: 3,
                    borderWidth: 2,
                    '&:hover': { borderWidth: 2 }
                  }}
                >
                  Watch Demo
                </Button>
              </Stack>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={6}>
            <LiveDemoPreview />
          </Grid>
        </Grid>
      </Container>

      <FeatureGridSection />
      <CTASection />
    </Box>
  );
};

export default Home;