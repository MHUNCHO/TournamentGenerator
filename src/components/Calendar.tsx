import { useState, useEffect } from 'react';
import { Calendar as CalendarComponent, Calendar as DatePicker } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

interface Event {
  id: number;
  title: string;
  date: Date;
  type: string;  // e.g., 'match', 'tournament', etc.
  description: string;
  location: string;
}

export default function Calendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    location: '',
    type: '',
    description: '',
    date: new Date()
  });

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/events');
        if (!response.ok) throw new Error('Failed to fetch events');
        const data = await response.json();
        setEvents(data.map((event: any) => ({
          ...event,
          date: new Date(event.date)
        })));
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();
  }, [isDialogOpen]); // Refetch when dialog closes (new event added)

  // Get the week's dates based on selected date
  const weekDates = date ? eachDayOfInterval({
    start: startOfWeek(date, { weekStartsOn: 1 }), // Start on Monday
    end: endOfWeek(date, { weekStartsOn: 1 })
  }) : [];

  const handleAddEvent = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newEvent,
          date: newEvent.date
        }),
      });

      if (!response.ok) throw new Error('Failed to add event');
      
      setNewEvent({ title: '', location: '', type: '', description: '', date: new Date() });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  // Function to check if a date has events
  const hasEvents = (day: Date) => {
    return events.some(event => 
      event.date.toDateString() === day.toDateString()
    );
  };

  return (
    <div className="flex gap-6">
      {/* Calendar Section */}
      <div className="w-[350px]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Calendar</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Event
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Event</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="date">Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newEvent.date ? format(newEvent.date, 'PPP') : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <DatePicker
                            mode="single"
                            selected={newEvent.date}
                            onSelect={(date) => setNewEvent(prev => ({ ...prev, date: date || new Date() }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter event title"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={newEvent.location}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Enter event location"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="type">Type</Label>
                      <Input
                        id="type"
                        value={newEvent.type}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value }))}
                        placeholder="Enter event type"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={newEvent.description}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter event description"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddEvent}>
                      Add Event
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <CardDescription>Select a date to view events</CardDescription>
          </CardHeader>
          <CardContent>
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              modifiers={{
                hasEvent: (date) => hasEvents(date),
              }}
              modifiersStyles={{
                hasEvent: {
                  backgroundColor: "rgb(187, 247, 208)",  // Tailwind green-200
                  fontWeight: "bold",
                }
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Events Section - Horizontal Weekly View */}
      <div className="flex-1">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Events</CardTitle>
            <CardDescription>
              {date && `Week of ${format(weekDates[0], 'dd MMM')} - ${format(weekDates[6], 'dd MMM yyyy')}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-4">
              {weekDates.map(day => (
                <div key={day.toString()} className="min-w-[130px]">
                  <h3 className="font-medium mb-2 text-sm">
                    {format(day, 'EEE, MMM d')}
                  </h3>
                  <div className="space-y-2">
                    {events
                      .filter(event => event.date.toDateString() === day.toDateString())
                      .map(event => (
                        <Card key={event.id} className="p-2 bg-[rgb(187,247,208)]">
                          <div className="space-y-1">
                            <h4 className="font-medium text-sm">{event.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              {event.type} • {event.location}
                            </p>
                            {event.description && (
                              <p className="text-xs">{event.description}</p>
                            )}
                          </div>
                        </Card>
                      ))}
                    {events.filter(event => 
                      event.date.toDateString() === day.toDateString()
                    ).length === 0 && (
                      <p className="text-xs text-muted-foreground">No events</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 