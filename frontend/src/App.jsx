import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Overview from './pages/Overview';
import LearningPlan from './pages/LearningPlan';
import Mentor from './pages/Mentor';
import Simulation from './pages/Simulation';
import Monitoring from './pages/Monitoring';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Overview />} />
                    <Route path="learning" element={<LearningPlan />} />
                    <Route path="mentor" element={<Mentor />} />
                    <Route path="simulation" element={<Simulation />} />
                    <Route path="monitoring" element={<Monitoring />} />
                </Route>

                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
