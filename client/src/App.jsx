import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Room from './pages/Room';
import Docs from './pages/Docs';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/docs/:slug" element={<Docs />} />
        <Route path="/:roomId" element={<Room />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
