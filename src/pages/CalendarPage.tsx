import Calendar from "@/components/Calendar";

export default function CalendarPage() {
  return (
    <div className="container px-4 md:px-6 pt-8 space-y-4">
      <h2 className="text-2xl font-bold">Calendar</h2>
      <p className="text-muted-foreground">
        View and manage upcoming events
      </p>
      <Calendar />
    </div>
  );
} 