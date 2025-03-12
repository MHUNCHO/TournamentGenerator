import { useNavigate } from 'react-router-dom';
import logoBg from '@/assets/images/logobg.png';
import logo2 from '@/assets/images/logo1.png';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div 
      className="h-screen w-screen flex flex-col items-center justify-center cursor-pointer"
      onClick={() => navigate('/')}
      style={{
        backgroundImage: `url(${logoBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#000', // Fallback color while image loads
      }}
    >
      <img 
        src={logo2} 
        alt="Logo" 
        className="w-[32rem] h-[32rem] object-contain"
      />
    </div>
  );
} 