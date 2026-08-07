'use client';

import Link from 'next/link';
import {
  FileText,
  Sparkles,
  Zap,
  Shield,
  ArrowRight,
  MessageSquare,
  UploadCloud,
} from 'lucide-react';
import ParticlesBackground from '@/components/ParticlesBackground';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const primaryHref = user ? '/dashboard' : '/signup';

  return (
    <main className="relative min-h-screen overflow-hidden">
      <ParticlesBackground />

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              DocXtract
            </span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard" className="text-sm btn-primary py-2 px-4 !rounded-lg">
                Go to Dashboard <ArrowRight className="inline w-3 h-3 ml-1" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Log in
                </Link>
                <Link href="/signup" className="text-sm btn-primary py-2 px-4 !rounded-lg">
                  Get Started <ArrowRight className="inline w-3 h-3 ml-1" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 pt-20 pb-20 text-center">
        <div className="animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-8">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span className="text-sm text-indigo-300 font-medium">
              AI-Powered Document Intelligence
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
            <span className="bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent">
              Upload, Understand
            </span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
              & Chat With Your Docs
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Upload PDFs, Word docs and more — DocXtract extracts, embeds, and lets
            you manage and chat with your documents. Fast, secure, and personal to you.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link href={primaryHref} className="btn-primary text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              {user ? 'Open Dashboard' : 'Create Free Account'}
            </Link>
            {!user && (
              <Link href="/login" className="btn-secondary text-lg">
                I already have an account
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-4 pb-20">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          Everything you need for your{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            documents
          </span>
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: UploadCloud,
              title: 'Upload & Manage',
              desc: 'Upload PDFs, Word docs, and text files. Rename or delete anytime from your personal dashboard.',
              color: 'from-amber-500 to-orange-600',
            },
            {
              icon: Shield,
              title: 'Private & Secure',
              desc: 'Every account is protected with JWT authentication — only you can see your documents.',
              color: 'from-emerald-500 to-teal-600',
            },
            {
              icon: MessageSquare,
              title: 'Chat With Your Docs',
              desc: 'Ask questions and get answers grounded in your own uploaded content.',
              color: 'from-indigo-500 to-purple-600',
            },
          ].map((feat, i) => (
            <div
              key={i}
              className="glass-card p-6 hover:bg-white/[0.08] transition-all duration-300 group"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
              >
                <feat.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feat.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 backdrop-blur-xl py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600 flex items-center justify-center gap-2">
          <FileText className="w-4 h-4" />
          Built with Next.js, Express & MongoDB Atlas
        </div>
      </footer>
    </main>
  );
}
