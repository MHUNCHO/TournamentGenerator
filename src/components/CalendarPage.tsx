import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Event {
  date: Date;
  title: string;
  type: 'tournament' | 'practice' | 'friendly';
}

// Sample events
const events: Event[] = [
  {
    date: new Date(2024, 2, 15),
    title: 'Club Tournament',
    type: 'tournament',
  },
  {
    date: new Date(2024, 2, 20),
    title: 'Practice Session',
    type: 'practice',
  },
  {
    date: new Date(2024, 2, 25),
    title: 'Friendly Match',
    type: 'friendly',
  },
];

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Get events for the selected date
  const selectedDateEvents = events.filter(
    (event) =>
      selectedDate &&
      event.date.toDateString() === selectedDate.toDateString()
  );

  // Function to get className for dates with events
  const getDayClassName = (date: Date) => {
    const hasEvent = events.some(
      (event) => event.date.toDateString() === date.toDateString()
    );
    return hasEvent ? 'bg-primary/10 font-bold' : '';
  };

  return (
    <div className="grid gap-6 md:grid-cols-[380px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
            modifiersClassNames={{
              selected: 'bg-primary text-primary-foreground',
            }}
            modifiers={{
              event: (date) =>
                events.some(
                  (event) => event.date.toDateString() === date.toDateString()
                ),
            }}
            components={{
              DayContent: ({ date }) => (
                <div className={getDayClassName(date)}>{date.getDate()}</div>
              ),
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Events for{' '}
            {selectedDate?.toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDateEvents.length > 0 ? (
            <div className="space-y-4">
              {selectedDateEvents.map((event, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium leading-none">
                      {event.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {event.date.toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <Badge
                    variant={
                      event.type === 'tournament'
                        ? 'default'
                        : event.type === 'practice'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No events scheduled for this date.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}