'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('worldwide');

  useEffect(() => {
    fetchEvents();
  }, [selectedRegion]);

  async function fetchEvents() {
    setLoading(true);
    try {
      const res = await fetch(`/api/events?region=${selectedRegion}`);
      const data = await res.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <header className="mb-16 text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span>Live Intelligence Feed</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-slate-400">
            AI Festivals & Summits
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">
            Discover the world's most innovative artificial intelligence gatherings, hackathons, and conferences in one premium destination.
          </p>
        </header>

        {/* Filters */}
        <div className="mb-12 flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center space-x-4">
            <label className="text-slate-400 font-medium">Region Focus:</label>
            <div className="flex bg-slate-800 p-1 rounded-xl">
              {['worldwide', 'middle-east', 'africa'].map((region) => (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${selectedRegion === region
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                >
                  {region.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>
          <div className="text-slate-400 text-sm">
            Showing <span className="text-white font-bold">{events.length}</span> verified events
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-slate-900/50 rounded-2xl border border-slate-800"></div>
            ))}
          </div>
        )}

        {/* Events Grid */}
        {!loading && (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <div
                key={event.url}
                className="group relative bg-slate-900/40 hover:bg-slate-900/60 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 p-8 flex flex-col overflow-hidden"
              >
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/10 transition-colors"></div>

                <div className="flex justify-between items-start mb-6">
                  <span className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                    {event.category || 'Event'}
                  </span>
                  <div className="flex items-center space-x-1 text-emerald-400 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>{event.aiConfidence}% AI Conf.</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 group-hover:text-indigo-400 transition-colors line-clamp-2">
                  {event.name}
                </h3>

                <div className="space-y-4 mb-8 flex-grow">
                  <div className="flex items-start space-x-3 text-slate-400">
                    <span className="text-xl">📅</span>
                    <div>
                      <p className="text-slate-200 font-medium">{event.dates}</p>
                      <p className="text-xs">Event duration</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 text-slate-400">
                    <span className="text-xl">📍</span>
                    <div>
                      <p className="text-slate-200 font-medium line-clamp-1">{event.address}</p>
                      <p className="text-xs">Location</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 text-slate-400">
                    <span className="text-xl">💰</span>
                    <span className="text-slate-200 font-medium">{event.price || 'Check App'}</span>
                  </div>
                </div>

                <a
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 active:scale-[0.98] text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/20"
                >
                  <span>View Details</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && events.length === 0 && (
          <div className="text-center py-24 rounded-3xl bg-slate-900/30 border border-dashed border-slate-800">
            <div className="text-6xl mb-6">🔍</div>
            <h3 className="text-2xl font-bold text-white mb-2">No signals found</h3>
            <p className="text-slate-400">We couldn't find any events for this region. Try expanding your search.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="relative border-t border-slate-800 py-12 text-center text-slate-500 text-sm">
        <p>© 2026 AI Festivals Discovery Platform. Hardened Production Ready.</p>
      </footer>
    </div>
  );
}
