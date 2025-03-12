import logo1 from './assets/images/logo1.png';
import PlayerRoster from './components/PlayerRoster';
import MatchHistory from './components/MatchHistory';
import GenerateFixtures from './components/GenerateFixtures';
import Analytics from './components/Analytics';
import HomePage from './components/Home';
import CalendarPage from "@/pages/CalendarPage";
import { Routes, Route, Link } from 'react-router-dom';
import LandingPage from './pages/LandingPage';

// Create a new Layout component for the header
const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen flex-col">
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-4 flex h-20C items-center justify-between">
        <div className="flex items-center gap-2 mr-8">
          <img src={logo1} alt="Logo" className="h-32 w-32" />
          <span className="font-bold whitespace-nowrap">Cwmbran Badminton Sports Club</span>
        </div>
        <nav className="flex items-center space-x-8 mx-auto">
          <Link to="/" className="px-4 py-2 hover:text-primary">Home</Link>
          <Link to="/players" className="px-4 py-2 hover:text-primary">Players</Link>
          <Link to="/history" className="px-4 py-2 hover:text-primary">History</Link>
          <Link to="/fixtures" className="px-4 py-2 hover:text-primary">Fixtures</Link>
          <Link to="/analytics" className="px-4 py-2 hover:text-primary">Analytics</Link>
          <Link to="/calendar" className="px-4 py-2 hover:text-primary">Calendar</Link>
        </nav>
        <div className="w-[200px]"></div>
      </div>
    </header>
    <main className="flex-1">
      {children}
    </main>
  </div>
);

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/landing" element={<LandingPage />} />
        
        {/* Route-based navigation */}
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/players" element={<Layout><PlayerRoster /></Layout>} />
        <Route path="/history" element={<Layout><MatchHistory /></Layout>} />
        <Route path="/fixtures" element={<Layout><GenerateFixtures /></Layout>} />
        <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
        <Route path="/calendar" element={<Layout><CalendarPage /></Layout>} />
      </Routes>
    </div>
  );
}