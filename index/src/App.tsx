import React from 'react'
import { ArrowRight, Calendar } from 'lucide-react'

export default function App() {
  const weeks = [
    {
      number: 1,
      title: 'Resolution Tracker',
      path: '/w1/',
      description: 'AI-powered resolution management with Claude',
      status: 'active',
      url: 'daily-brief-nu.vercel.app/w1/'
    },
    {
      number: 2,
      title: 'Week 2 Project',
      path: '/w2/',
      description: 'Coming next...',
      status: 'coming',
      url: 'daily-brief-nu.vercel.app/w2/'
    },
    {
      number: 3,
      title: 'Week 3 Project',
      path: '/w3/',
      description: 'Coming next...',
      status: 'coming',
      url: 'daily-brief-nu.vercel.app/w3/'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-bold">Daily Brief</h1>
          </div>
          <p className="text-slate-400">Weekly projects and experiments</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Intro Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Welcome to Daily Brief</h2>
          <p className="text-slate-300 text-lg mb-4">
            A collection of weekly projects exploring full-stack development, AI integration, and modern web technologies.
          </p>
          <p className="text-slate-400">
            Each week brings a new challenge and a new tool to build with.
          </p>
        </section>

        {/* Weeks Grid */}
        <section>
          <h2 className="text-2xl font-bold mb-8">Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {weeks.map((week) => (
              <div
                key={week.number}
                className={`group rounded-lg border transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 ${
                  week.status === 'active'
                    ? 'border-blue-500/50 bg-slate-800/50 hover:bg-slate-800/80'
                    : 'border-slate-700 bg-slate-900/50 hover:bg-slate-900/80'
                }`}
              >
                <div className="p-6">
                  {/* Week Number and Status */}
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-semibold text-slate-400">
                      Week {week.number}
                    </span>
                    {week.status === 'active' && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-full">
                        Active
                      </span>
                    )}
                    {week.status === 'coming' && (
                      <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs font-semibold rounded-full">
                        Coming
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold mb-2 group-hover:text-blue-300 transition-colors">
                    {week.title}
                  </h3>

                  {/* Description */}
                  <p className="text-slate-400 text-sm mb-6">
                    {week.description}
                  </p>

                  {/* Link */}
                  {week.status === 'active' ? (
                    <a
                      href={week.path}
                      className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold transition-colors group/link"
                    >
                      Visit Project
                      <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                    </a>
                  ) : (
                    <div className="text-slate-500 text-sm">Not available yet</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Info Section */}
        <section className="mt-16 p-6 border border-slate-700 rounded-lg bg-slate-900/50">
          <h3 className="text-lg font-semibold mb-3">About This Project</h3>
          <ul className="space-y-2 text-slate-400 text-sm">
            <li>✨ Each week explores a different concept</li>
            <li>🚀 Full-stack development with modern tools</li>
            <li>🤖 AI integration using Claude API</li>
            <li>📚 Learning by building</li>
          </ul>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 mt-16 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-slate-500 text-sm">
          <p>Daily Brief © 2026 | A journey of weekly experiments</p>
        </div>
      </footer>
    </div>
  )
}
