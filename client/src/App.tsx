import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Login } from "./pages/Login/Login";
import { Dash } from "./pages/Dash/Dash";
import { TeamRoom } from "./pages/TeamRoom/TeamRoom";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="login" element={<Login />} />
          <Route path="/teams/:id" element={<TeamRoom />} />
          <Route path="/" element={<Dash />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
