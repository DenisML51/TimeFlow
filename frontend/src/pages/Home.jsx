import React, { useContext, useEffect } from "react";
import {
  Box, Button, Container, Grid, Typography, Paper, useTheme,
  styled, useMediaQuery
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { FloatingLinesBackground} from "../components/AnimatedBackground";
import { TbChartLine, TbCloudUpload, TbCpu, TbShieldLock } from "react-icons/tb";

const AnimatedButton = motion(Button);

const FeatureIconWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  '&:before': {
    content: '""',
    position: 'absolute',
    width: '60px',
    height: '60px',
    background: `radial-gradient(${theme.palette.primary.main} 0%, transparent 70%)`,
    filter: 'blur(20px)',
    opacity: 0,
    transition: 'opacity 0.3s'
  },
  '&:hover:before': {
    opacity: 0.3
  }
}));

const FeatureCard = ({ icon, title, text, index }) => {
  const theme = useTheme();
  const controls = useAnimation();
  const [ref, inView] = useInView({ threshold: 0.2 });

  useEffect(() => {
    if (inView) {
      controls.start({ opacity: 1, y: 0 });
    }
  }, [controls, inView]);

  return (
    <Grid item xs={12} md={3} key={index}>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 50 }}
        animate={controls}
        transition={{ delay: index * 0.1 }}
      >
        <Paper
          sx={{
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
              '&:before': { opacity: 1 }
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
          }}
        >
          <FeatureIconWrapper>
            <Box
              component={motion.div}
              sx={{
                fontSize: 48,
                color: theme.palette.primary.main,
                mb: 3,
                transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'inline-block'
              }}
              whileHover={{ rotate: 15, scale: 1.2 }}
            >
              {icon}
            </Box>
          </FeatureIconWrapper>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            {title}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
            {text}
          </Typography>
        </Paper>
      </motion.div>
    </Grid>
  );
};

const StatsSection = () => {
  const stats = [
    { value: '99.9%', label: 'Точность прогнозов' },
    { value: '15K+', label: 'Ежедневных анализов' },
    { value: '200+', label: 'Компаний-партнеров' }
  ];

  return (
    <Box sx={{ py: 12, background: 'rgba(255,255,255,0.03)', position: 'relative' }}>
      <Container maxWidth="xl">
        <Grid container spacing={4} justifyContent="center">
          {stats.map((stat, i) => (
            <Grid item key={i} xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                viewport={{ once: true }}
                style={{ textAlign: 'center' }}
              >
                <Typography variant="h2" color="primary" sx={{ fontWeight: 700 }}>
                  {stat.value}
                </Typography>
                <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                  {stat.label}
                </Typography>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

  const handleStart = () => {
    navigate(user ? "/dashboard" : "/register");
  };

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden' }}>
      <FloatingLinesBackground />


      {/* Hero Section */}
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', pt: 12 }}>
        <Container maxWidth="xl">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Typography variant="h2" sx={{
                  fontSize: isMobile ? '2.5rem' : '3.5rem',
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
                    boxShadow: `0 8px 32px ${theme.palette.primary.main}40`,
                    position: 'relative',
                    overflow: 'hidden',
                    '&:after': {
                      content: '""',
                      position: 'absolute',
                      top: '-50%',
                      left: '-50%',
                      right: '-50%',
                      bottom: '-50%',
                      background: `linear-gradient(45deg, transparent 40%, 
                        ${theme.palette.primary.main} 100%)`,
                      opacity: 0.3,
                      transform: 'rotate(30deg)',
                      transition: '0.4s',
                    },
                    '&:hover:after': {
                      transform: 'rotate(30deg) translateX(200%)',
                    }
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
                <Box sx={{
                  position: 'relative',
                  '&:hover:after': { opacity: 1 },
                  '&:after': {
                    content: '""',
                    position: 'absolute',
                    top: '-20px',
                    left: '-20px',
                    right: '-20px',
                    bottom: '-20px',
                    background: `radial-gradient(${theme.palette.primary.main} 0%, transparent 70%)`,
                    opacity: 0,
                    transition: 'opacity 0.4s',
                    zIndex: -1
                  }
                }}>
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
                    {/* {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        animate={{
                          y: [0, -20, 0],
                          scale: [1, 1.2, 1]
                        }}
                        transition={{
                          duration: 4 + i,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        style={{
                          position: 'absolute',
                          background: theme.palette.primary.main,
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          top: `${30 + i * 15}%`,
                          left: `${50 + i * 10}%`,
                          filter: 'blur(1px)'
                        }}
                      />
                    ))} */}
                  </Box>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <StatsSection />

      {/* Features Section */}
      <Box sx={{ py: 12, position: 'relative' }}>
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
              <FeatureCard key={index} index={index} {...feature} />
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: 12, position: 'relative' }}>
        <Container maxWidth="md">
          <Box
            component={motion.div}
            initial={{ scale: 0.9 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            sx={{
              background: 'linear-gradient(45deg, rgba(16,163,127,0.1) 0%, rgba(0,0,0,0) 100%)',
              borderRadius: 8,
              py: 8,
              px: 4,
              textAlign: 'center'
            }}
          >
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 3 }}>
              Начните прогнозировать уже сегодня
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.secondary', mb: 5, fontSize: '1.25rem' }}>
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
                borderRadius: '24px',
                fontWeight: 700,
                position: 'relative',
                overflow: 'hidden',
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  right: '-50%',
                  bottom: '-50%',
                  background: `linear-gradient(45deg, transparent 40%, 
                    ${theme.palette.primary.main} 100%)`,
                  opacity: 0.3,
                  transform: 'rotate(30deg)',
                  transition: '0.4s',
                },
                '&:hover:after': {
                  transform: 'rotate(30deg) translateX(200%)',
                }
              }}
            >
              {user ? "Продолжить анализ" : "Попробовать бесплатно"}
            </AnimatedButton>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;