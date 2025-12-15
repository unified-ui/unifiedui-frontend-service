import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../authConfig";
import "./LoginButton.css";

export const LoginButton = () => {
  const { instance } = useMsal();

  const handleLogin = async () => {
    try {
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      console.error("Login fehlgeschlagen:", error);
    }
  };

  return (
    <button className="login-button" onClick={handleLogin}>
      Einloggen mit Microsoft
    </button>
  );
};
