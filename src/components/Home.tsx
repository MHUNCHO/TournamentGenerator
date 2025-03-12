import { Trophy, Users, Calendar, BarChart, Shield, MessageSquare, ChevronRight, PlayCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import logo1 from '../assets/images/logo1.png';
import logobg from '../assets/images/logobg.png';

export default function Home() {
  return (
    <div className="flex-1 -mt-[64px] w-full overflow-x-hidden pt-16">
      {/* Hero Section */}
      <section className="relative w-full">
        <div className="absolute inset-0 z-0">
          <img
            src={logobg}
            alt="Background"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center gap-4 pb-8 pt-24 md:pb-12 md:pt-28 lg:py-32">
          <div className="flex flex-col items-center gap-4 text-center">
            <img
              src={logo1}
              alt="Badminton Club Logo"
              className="h-64 w-64 object-contain"
            />
            <h1 className="text-3xl font-bold leading-tight tracking-tighter text-white md:text-5xl lg:text-6xl lg:leading-[1.1]">
              Welcome to Cwmbran Badminton Sports Club
            </h1>
            <p className="max-w-[750px] text-lg text-gray-200 sm:text-xl">
              Manage tournaments, track stats, and connect with players. Your all-in-one platform for competitive badminton.
            </p>
          </div>
          <div className="flex flex-col gap-4 min-[400px]:flex-row">
            <Button size="lg" variant="default" className="gap-2 bg-white text-primary hover:bg-gray-100">
              Get Started
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="gap-2 border-white text-white bg-transparent hover:bg-white/10">
              Watch Demo
              <PlayCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full bg-slate-50 py-8 dark:bg-transparent md:py-12 lg:py-24">
        <div className="container px-4 md:px-6">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-6xl">Features</h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Everything you need to manage your badminton club, tournaments, and player statistics.
            </p>
          </div>
          
          <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3 mt-8">
            <Card>
              <CardHeader>
                <Trophy className="h-12 w-12 text-primary mb-2" />
                <CardTitle>Tournaments</CardTitle>
              </CardHeader>
              <CardContent>
                Create and manage tournaments with automated brackets and real-time scoring updates.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-12 w-12 text-primary mb-2" />
                <CardTitle>Player Profiles</CardTitle>
              </CardHeader>
              <CardContent>
                Track player statistics, match history, and performance analytics.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Calendar className="h-12 w-12 text-primary mb-2" />
                <CardTitle>Match History</CardTitle>
              </CardHeader>
              <CardContent>
                View complete match history and track player performance over time.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart className="h-12 w-12 text-primary mb-2" />
                <CardTitle>Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                Comprehensive analytics for players, matches, and tournaments.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mb-2" />
                <CardTitle>Fixtures</CardTitle>
              </CardHeader>
              <CardContent>
                Generate and manage tournament fixtures efficiently.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MessageSquare className="h-12 w-12 text-primary mb-2" />
                <CardTitle>Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                Manage team members, roles, and responsibilities effectively.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}