import React, { useContext, useEffect } from "react";
import {
  Box, Button, Container, Grid, Typography, Paper, useTheme,
  styled
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { FloatingLinesBackground } from "../components/AnimatedBackground";
import { TbChartLine, TbCloudUpload, TbCpu, TbShieldLock } from "react-icons/tb";

const AnimatedButton = motion(Button);

const FeatureCard = styled(Paper)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  padding: theme.spacing(4),
  backgroundColor: 'rgba(255,255,255,0.03)',
  borderRadius: '24px',
  border: '1px solid rgba(255,255,255,0.1)',
  backdropFilter: 'blur(12px)',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
    '&:before': {
      opacity: 1,
    }
  },
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(135deg, ${theme.palette.primary.main}20 0%, transparent 100%)`,
    opacity: 0,
    transition: 'opacity 0.4s',
  }
}));

const Home = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const controls = useAnimation();
  const [ref, inView] = useInView({ threshold: 0.1 });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  const handleStart = () => {
    navigate(user ? "/dashboard" : "/register");
  };

  const features = [
    { icon: <TbCloudUpload />, title: "Загрузка данных",
      text: "Поддержка CSV/XLSX форматов с интеллектуальным анализом структуры данных" },
    { icon: <TbCpu />, title: "AI Анализ",
      text: "Автоматический подбор моделей Prophet, ARIMA, LSTM на основе ваших данных" },
    { icon: <TbChartLine />, title: "Визуализация",
      text: "Интерактивные 3D-графики с возможностью детализации и сравнения прогнозов" },
    { icon: <TbShieldLock />, title: "Безопасность",
      text: "End-to-end шифрование данных и двухфакторная аутентификация" }
  ];

  return (
    <Box sx={{
      background: theme.palette.background.default,
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Анимированный фон с плавающими линиями */}
      <FloatingLinesBackground />

      {/* Hero секция */}
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        pt: 12
      }}>
        <Container maxWidth="xl">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Typography variant="h2" sx={{
                  fontWeight: 700,
                  lineHeight: 1.2,
                  mb: 3,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, #00ff88 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Прогнозирование временных рядов следующего поколения
                </Typography>
                <Typography variant="h6" sx={{
                  color: 'text.secondary',
                  mb: 4,
                  fontSize: '1.25rem'
                }}>
                  Используйте силу искусственного интеллекта для точных прогнозов.
                  От анализа данных до готовых предсказаний — единая платформа для ваших задач.
                </Typography>
                <AnimatedButton
                  variant="contained"
                  color="primary"
                  onClick={handleStart}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  sx={{
                    borderRadius: '16px',
                    px: 6,
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: `0 8px 32px ${theme.palette.primary.main}40`
                  }}
                >
                  {user ? "Перейти в аналитику" : "Начать бесплатно"}
                </AnimatedButton>
              </motion.div>
            </Grid>

            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                style={{ position: 'relative' }}
              >
                {/* Анимированная иллюстрация графиков */}
                <Box sx={{
                  background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, #1A1A1A 100%)`,
                  borderRadius: '32px',
                  p: 3,
                  boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <Box component="img" src="/assets/dashboard-preview.png"
                    sx={{ width: '100%', borderRadius: '24px' }} />
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}10 0%, transparent 100%)`,
                    pointerEvents: 'none'
                  }} />
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Блок возможностей */}
      <Box ref={ref} sx={{ py: 12, position: 'relative' }}>
        <Container maxWidth="xl">
          <Typography variant="h3" sx={{
            textAlign: 'center',
            mb: 8,
            fontWeight: 700
          }}>
            Преимущества платформы
          </Typography>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={3} key={index}>
                <motion.div
                  initial="hidden"
                  animate={controls}
                  variants={{
                    visible: { opacity: 1, y: 0 },
                    hidden: { opacity: 0, y: 50 }
                  }}
                  transition={{ delay: index * 0.1 }}
                >
                  <FeatureCard>
                    <Box sx={{
                      fontSize: 48,
                      color: theme.palette.primary.main,
                      mb: 3,
                      transition: 'transform 0.4s',
                      '& svg': { width: '1em', height: '1em' }
                    }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" sx={{
                      color: 'text.secondary',
                      lineHeight: 1.6
                    }}>
                      {feature.text}
                    </Typography>
                  </FeatureCard>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA секция */}
      <Box sx={{ py: 12, textAlign: 'center', position: 'relative' }}>
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Typography variant="h3" sx={{
              fontWeight: 700,
              mb: 3
            }}>
              Начните прогнозировать уже сегодня
            </Typography>
            <Typography variant="h6" sx={{
              color: 'text.secondary',
              mb: 5,
              fontSize: '1.25rem'
            }}>
              Присоединяйтесь к тысячам аналитиков и компаний, использующих нашу платформу
            </Typography>
            <AnimatedButton
              variant="contained"
              color="primary"
              size="large"
              onClick={handleStart}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              sx={{
                px: 8,
                py: 2,
                fontSize: '1.1rem',
                borderRadius: '16px',
                fontWeight: 600
              }}
            >
              {user ? "Продолжить анализ" : "Попробовать бесплатно"}
            </AnimatedButton>
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;