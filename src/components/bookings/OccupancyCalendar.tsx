'use client';
import { useState } from 'react';
import type { Booking } from '@/types';

type Props = { bookings: Booking[] };

export function OccupancyCalendar({ bookings }: Props) {
  const [current, setCurrent] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const bookedDays = new Set<string>();
  bookings.forEach((b) => {
    if (b.status === 'cancelled') return;
    const start = new Date(b.check_in);
    const end = new Date(b.check_out);
    const d = new Date(start);
    while (d < end) {
      bookedDays.add(d.toISOString().split('T')[0]);
      d.setDate(d.getDate() + 1);
    }
  });

  const year = current.getFullYear();
  const month = current.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();

  const cells: (number | null)[] = [...Array(firstWeekday).fill(null)];
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  function label(d: Date) {
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() =>
            setCurrent((d) => {
              const n = new Date(d);
              n.setMonth(n.getMonth() - 1);
              return n;
            })
          }
          className="px-2 text-gray-500 hover:text-gray-900"
        >
          ‹
        </button>
        <span className="text-sm font-medium text-gray-900">
          {label(current)}
        </span>
        <button
          onClick={() =>
            setCurrent((d) => {
              const n = new Date(d);
              n.setMonth(n.getMonth() + 1);
              return n;
            })
          }
          className="px-2 text-gray-500 hover:text-gray-900"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="py-1 font-medium text-gray-500">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const booked = bookedDays.has(iso);
          return (
            <div
              key={day}
              className={`rounded-md py-1 text-sm ${booked ? 'bg-blue-100 font-medium text-blue-800' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
