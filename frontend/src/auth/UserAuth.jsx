import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/user.context";
import axios from "../config/axios";

const UserAuth = ({ children }) => {
  const { user, setUser } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    let isActive = true;

    axios
      .get("/users/profile")
      .then((res) => {
        if (isActive) {
          setUser(res.data.user);
          setLoading(false);
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        if (isActive) {
          navigate("/login", { replace: true });
        }
      });

    return () => {
      isActive = false;
    };
  }, [navigate, setUser, user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};

export default UserAuth;
