'use client';

import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        setEvents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name?.toLowerCase().includes(search.toLowerCase()) ||
      event.topics?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || event.region === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#050510] text-gray-100 font-sans selection:bg-purple-500/30">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
          <div>
            <h1 className="text-5xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-purple-400 tracking-tight mb-4">
              AI Festivals <span className="text-purple-500">.</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl font-medium">
              Discover the most prestigious Artificial Intelligence events, summits, and festivals worldwide.
              <span className="hidden md:inline"> Curated, validated, and updated daily.</span>
            </p>
          </div>

          <div className="flex flex-col gap-4 min-w-[300px]">
            <div className="relative group">
              <input
                type="text"
                placeholder="Search events, topics..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all backdrop-blur-xl group-hover:border-white/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              </div>
            </div>

            <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md">
              {['all', 'middle-east', 'africa', 'worldwide'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${filter === f ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {f.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-[400px] rounded-3xl bg-white/5 animate-pulse border border-white/5"></div>
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event, idx) => (
              <div
                key={idx}
                className="group relative bg-[#0a0a1a]/80 backdrop-blur-2xl border border-white/10 rounded-[32px] overflow-hidden hover:border-purple-500/50 transition-all duration-500 flex flex-col hover:-translate-y-2"
              >
                <div className="p-8 flex-1">
                  <div className="flex items-center justify-between mb-6">
                    <span className="px-4 py-1.5 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold tracking-wider uppercase border border-purple-500/20">
                      {event.category || 'Event'}
                    </span>
                    <span className="text-gray-500 text-xs font-medium">#{idx + 1}</span>
                  </div>

                  <h3 className="text-2xl font-bold mb-4 line-clamp-2 leading-tight group-hover:text-purple-300 transition-colors">
                    {event.name}
                  </h3>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                      <span className="text-sm">{event.dates || 'Upcoming'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                      <span className="text-sm truncate">{event.address || 'Global'}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-8">
                    {(event.topics || '').split(',').slice(0, 3).map((tag, tIdx) => (
                      <span key={tIdx} className="text-[10px] font-bold tracking-widest uppercase text-gray-500 border border-white/5 px-3 py-1 rounded-md">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-6 pt-0 mt-auto">
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-purple-500 hover:text-white transition-all duration-300 shadow-xl shadow-white/5"
                  >
                    View Details
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.02]">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><circle cx="12" cy="12" r="10" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
            </div>
            <h3 className="text-2xl font-bold mb-2">No events found</h3>
            <p className="text-gray-500">Try adjusting your filters or search keywords.</p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-24 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-gray-500 text-sm">
          <p>© 2026 AI Festivals Explorer. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
