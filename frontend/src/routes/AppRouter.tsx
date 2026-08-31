import { Route, Routes } from "react-router-dom";

import MainLayout from "../components/layout/MainLayout";

import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import NotFound from "../pages/NotFound/NotFound";
import CreatePet from "../pages/CreatePet/CreatePet";
import PetDetail from "../pages/PetDetail/PetDetail";

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/publicar" element={<CreatePet />} />
        <Route path="/pets/:id" element={<PetDetail />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}