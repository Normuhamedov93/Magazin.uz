import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useContext(AuthContext);

  if (isAuthenticated && user?.role === "admin") {
    return children;
  }

  return <Navigate to="/login" replace />;
};

export default AdminRoute;
