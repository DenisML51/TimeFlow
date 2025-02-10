import React from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import axios from "axios";

const clientId = "your-google-client-id"; // Замените на ваш Google Client ID

const GoogleLoginButton = () => {
  const handleSuccess = async (response) => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/auth/google/callback", {
        headers: { Authorization: `Bearer ${response.credential}` },
      });

      localStorage.setItem("token", res.data.access_token);
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Ошибка авторизации через Google:", error);
    }
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => console.log("Ошибка входа через Google")}
      />
    </GoogleOAuthProvider>
  );
};

export default GoogleLoginButton;
