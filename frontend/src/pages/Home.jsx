// src/pages/Home.jsx
import React, { useContext } from "react";
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Paper,
  useTheme,
  Stack
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { ParticleBackground } from "../components/home/ParticleBackground";
import { TbChartLine, TbCloudUpload, TbCpu, TbShieldLock, TbRocket } from "react-icons/tb";
import { GradientText } from "../components/home/GradientText";

const AnimatedButton = motion(Button);

const LiveDemoPreview = () => {
  const theme = useTheme();
  const imageSrc =
    theme.palette.mode === "dark"
      ? "assets/dashboard-preview-dark.png"
      : "assets/dashboard-preview-light.png";

  return (
    <motion.div
      style={{
        position: "relative",
        perspective: 1000
      }}
      initial={{ rotateY: 30, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ duration: 1.2, delay: 0.3 }}
    >
      <Box
        sx={{
          background: theme.custom.livePreview,
          borderRadius: 6,
          p: 2,
          border: `1px solid ${theme.custom.paperBorder}`,
          boxShadow: "0 24px 24px rgba(0,0,0,0.4)",
          backdropFilter: "blur(12px)",
          transformStyle: "preserve-3d"
        }}
      >
        <Box
          component="img"
          src={imageSrc}
          sx={{ width: "100%", borderRadius: 4 }}
        />
      </Box>
    </motion.div>
  );
};

const FeatureGridSection = () => {
  const theme = useTheme();

  const features = [
    {
      icon: <TbCloudUpload size="2em" />,
      title: "Загрузка и фильтрация",
      text: "Загрузка, вычисление статистик и формирование выборки.",
      key: "upload"
    },
    {
      icon: <TbCpu size="2em" />,
      title: "AI Прогноз",
      text: "Интерактивное взаимодействие с моделями прогнозирования.",
      key: "ai"
    },
    {
      icon: <TbChartLine size="2em" />,
      title: "Аналитика",
      text: "Удобный инструмент для визуализации, надстройки и предобработки данных.",
      key: "analytics"
    },
    {
      icon: <TbShieldLock size="2em" />,
      title: "Система сессий",
      text: "Сохранение сессий для зарегистрированных пользователей.",
      key: "session"
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
                    background: theme.custom.paperBackground,
                    border: `1px solid ${theme.custom.paperBorder}`,
                    borderRadius: 4,
                    backdropFilter: "blur(12px)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: `0 16px 48px ${theme.custom.featureGradients[feature.key]}50`
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
                      background: `${theme.custom.featureGradients[feature.key]}10)`,
                      borderRadius: 3,
                      position: "relative",
                      "&:before": {
                        content: '""',
                        position: "absolute",
                        inset: -1,
                        background: theme.custom.featureGradients[feature.key],
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

const CTASection = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const theme = useTheme();

  return (
    <Box sx={{ py: 15, position: "relative" }}>
      <Container maxWidth="md">
        <Box
          sx={{
            textAlign: "center",
            p: 6,
            borderRadius: 6,
            background: theme.custom.livePreview,
            border: `1px solid ${theme.custom.paperBorder}`,
            boxShadow: `0 24px 64px ${theme.custom.mainColor}`,
            backdropFilter: "blur(12px)"
          }}
        >
          <Typography variant="h3" sx={{ mb: 3, fontWeight: 700 }}>
            Начните анализировать уже сегодня
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "text.secondary",
              fontSize: "1.25rem",
              mb: 6
            }}
          >
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
              fontSize: "1.1rem",
              fontWeight: 600,
              background: theme.custom.primaryGradient,
              boxShadow: `0 8px 32px ${theme.custom.mainColor}`
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
  const theme = useTheme();

  return (
    <Box sx={{ position: "relative", overflow: "hidden", p: 4}}>
      <Canvas
        camera={{ position: [0, 0, 1] }}
        style={{ position: "fixed", top: 0, left: 0 }}
      >
        <ParticleBackground />
      </Canvas>

      <Container sx={{ position: "relative", zIndex: 1, pt: 20 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <GradientText variant="h1">
                TimeFlow
                <Box component="span" sx={{ display: "block" }}>
                  Analytics
                </Box>
              </GradientText>

              <Typography
                variant="h6"
                sx={{
                  color: "text.secondary",
                  my: 4,
                  fontSize: "1.25rem",
                  backdropFilter: "blur(4px)",
                  background: theme.custom.livePreview,
                  p: 3,
                  borderRadius: 4,
                  border: `1px solid ${theme.custom.paperBorder}`
                }}
              >
                Загружайте, преобразуйте сырые данные и используйте их для прогноза.
                <Box component="span" sx={{ color: "primary.main", fontWeight: 600 }}>
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
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    background: theme.custom.primaryGradient,
                    boxShadow: `0 8px 32px ${theme.custom.mainColor}`,
                    "&:hover": {
                      boxShadow: `0 12px 48px ${theme.custom.secColor}`
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
                    "&:hover": { borderWidth: 2 }
                  }}
                >
                  Демонстрация
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
