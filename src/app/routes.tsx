import Login from "../pages/Login"
import MapHome from "../pages/MapHome"
import { BrowserRouter, Routes, Route } from "react-router-dom"

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<MapHome />} />
      </Routes>
    </BrowserRouter>
  )
}