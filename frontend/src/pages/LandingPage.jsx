import React from 'react';
import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';

export default function LandingPage() {
  return (
    <div className="bg-white text-zinc-900 font-body-md min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-zinc-900 flex items-center justify-center font-bold text-sm">LL</div>
              <span className="font-bold tracking-wider uppercase text-sm">Lexis Legal</span>
            </div>
            
            {/* Main Menu */}
            <div className="hidden md:flex space-x-8">
              <a href="#use-cases" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">Use Cases</a>
              <a href="#how-it-works" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">How it Works</a>
              <a href="#ecosystem" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">The Ecosystem</a>
              <a href="#testimonials" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">Reviews</a>
              <a href="#faq" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">FAQ</a>
            </div>
            
            {/* Actions */}
            <div className="hidden md:flex items-center space-x-6">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="text-sm font-medium text-zinc-900 hover:text-zinc-600 transition-colors">Sign in</button>
                </SignInButton>
                <SignInButton mode="modal">
                  <button className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-full text-white bg-zinc-900 hover:bg-zinc-800 transition-colors">
                    Get Started
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link to="/chat" className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-full text-white bg-zinc-900 hover:bg-zinc-800 transition-colors">
                  Go to Dashboard
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-topo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-600 bg-zinc-100 mb-8">ACCESSIBLE LEGAL INTELLIGENCE</div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-zinc-900 mb-6 text-balance mx-auto max-w-4xl">
            Elite Legal Power, Accessible to Everyone
          </h1>
          <p className="mt-4 text-lg md:text-xl text-zinc-600 max-w-2xl mx-auto mb-10">
            Whether you are navigating a personal legal dispute or streamlining your law practice, Lexis Legal gives you instant, fact-checked answers and generates professional legal documents in seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <SignedIn>
              <Link to="/chat" className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-medium rounded-full text-white bg-zinc-900 hover:bg-zinc-800 transition-all w-full sm:w-auto shadow-sm">
                Ask a Legal Question
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-medium rounded-full text-white bg-zinc-900 hover:bg-zinc-800 transition-all w-full sm:w-auto shadow-sm">
                  Ask a Legal Question
                </button>
              </SignInButton>
            </SignedOut>
            <a href="#how-it-works" className="inline-flex items-center justify-center px-8 py-3.5 border border-zinc-200 text-base font-medium rounded-full text-zinc-900 bg-white hover:bg-zinc-50 transition-all w-full sm:w-auto shadow-sm">
              Explore Pro Features
            </a>
          </div>
        </div>
      </section>

      {/* Who We Are */}
      <section className="py-32 bg-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMCwhHcQO3mVaAAQ-s_KMZ7PmRHVjE3l6XsgP8V8nIXw4mVemm22VhrifNRksyJ7Yqk9D-olYC_RdKFo0GREHJDn0f9CCyumnLf0pltU3Tfx9koEOHXRUvSSzAeZDKTRYIGA8Wpx8_Oxk07fL40u4aDIo_cG8z3vIYFMAmoxSpdqfwo0Fl_m3c40HaUzwcqOrRFYuUB05BWiNnOj3MwgM9vMG-x1iD1dyoWSKCUxNj3vjmXTxycm4vSnt0MkRY8q9jAdCLdwRWYI4u" alt="Background texture" className="w-full h-full object-cover opacity-15" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-900 bg-white mb-8">Lexis Legal</div>
            <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-8">Stop guessing about your rights</h2>
            <p className="text-lg md:text-xl text-zinc-400 mb-16 text-balance leading-relaxed mx-auto max-w-3xl">
              Generic AI chatbots invent answers. Lexis Legal actually reads the law. We built a highly secure intelligence engine that searches through real legal libraries and your private documents to give you clarity and confidence.
            </p>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 flex items-center gap-4">
                <div className="w-14 h-14 bg-zinc-800 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">HALLUCINATION RATE</p>
                  <p className="text-3xl font-bold text-zinc-900">0.0%</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 flex items-center gap-4">
                <div className="w-14 h-14 bg-zinc-800 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">DOCUMENT DRAFTING</p>
                  <p className="text-3xl font-bold text-zinc-900">Instant</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 flex items-center gap-4">
                <div className="w-14 h-14 bg-zinc-800 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">DATA PRIVACY</p>
                  <p className="text-3xl font-bold text-zinc-900">AES-256</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Client Logo Grid */}
      <section className="py-24 bg-zinc-50 border-y border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 mb-4">Trusted by Everyday People and Legal Professionals</h2>
            <p className="text-base text-zinc-600">From individuals dealing with personal disputes to solo practitioners managing massive case files, our platform scales to your exact legal needs.</p>
          </div>
          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 bg-zinc-200 gap-[1px] border border-zinc-200">
            <div className="bg-zinc-50 py-12 px-8 flex items-center justify-center">
              <span className="text-xl font-bold text-zinc-400">Fact-Checked Answers</span>
            </div>
            <div className="bg-zinc-50 py-12 px-8 flex items-center justify-center">
              <span className="text-xl font-bold text-zinc-400 text-center">Bank-Grade Security</span>
            </div>
            <div className="bg-zinc-50 py-12 px-8 flex items-center justify-center">
              <span className="text-xl font-bold text-zinc-400">Instant PDF Generation</span>
            </div>
            <div className="bg-zinc-50 py-12 px-8 flex items-center justify-center">
              <span className="text-xl font-bold text-zinc-400">LaTeX Formatting</span>
            </div>
            <div className="bg-zinc-50 py-12 px-8 flex items-center justify-center">
              <span className="text-xl font-bold text-zinc-400">Private Databases</span>
            </div>
            <div className="bg-zinc-50 py-12 px-8 flex items-center justify-center">
              <span className="text-xl font-bold text-zinc-400">Real Precedents</span>
            </div>
            <div className="bg-zinc-50 py-12 px-8 flex items-center justify-center">
              <span className="text-xl font-bold text-zinc-400">Zero Latency</span>
            </div>
            <div className="bg-zinc-50 py-12 px-8 flex items-center justify-center">
              <span className="text-xl font-bold text-zinc-400">Deterministic AI</span>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-32 bg-white scroll-mt-20" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 items-start">
            {/* Sticky Header Col */}
            <div className="lg:col-span-5 lg:sticky lg:top-32">
              <div className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white bg-zinc-900 mb-6">HOW IT HELPS YOU</div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6 leading-tight text-balance">Clarity and power, without the hourly fees</h2>
              <p className="text-lg text-zinc-600 mb-8">Skip the confusing legal jargon and expensive consultations for basic research. We empower you to understand your situation, review contracts, and take definitive legal action.</p>
            </div>
            {/* Cards Col */}
            <div className="lg:col-span-7">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-zinc-50 rounded-3xl p-8 border border-zinc-100">
                  <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center mb-6 text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-900 mb-3">Fact-Checked Answers</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed">Our AI searches through actual legal codes and cites specific articles, so you know exactly where your answer comes from.</p>
                </div>
                <div className="bg-zinc-50 rounded-3xl p-8 border border-zinc-100">
                  <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center mb-6 text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-900 mb-3">Instant Document Generation</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed">Need a formal demand letter or a contract? Generate professional, ready-to-sign PDFs automatically.</p>
                </div>
                <div className="bg-zinc-50 rounded-3xl p-8 border border-zinc-100">
                  <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center mb-6 text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-900 mb-3">Total Privacy & Security</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed">Your legal issues are strictly your business. We use bank-level encryption so your data is never shared or leaked.</p>
                </div>
                <div className="bg-zinc-50 rounded-3xl p-8 border border-zinc-100">
                  <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center mb-6 text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-900 mb-3">Save Time & Money</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed">Get clarity on your legal situation in minutes, not weeks. Perfect for both individuals and busy lawyers.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Work & Vision */}
      <section className="py-32 bg-zinc-50 border-t border-zinc-100 scroll-mt-20" id="use-cases">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900">Common Questions</h2>
            <a href="#faq" className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-full text-white bg-zinc-900 hover:bg-zinc-800 transition-colors">FAQ</a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm flex flex-col h-full">
              <div className="w-full h-64 bg-zinc-200 rounded-2xl mb-8 overflow-hidden">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjmRCYM6LehEce0XoeKMVkE2EyDk0NLbLl1lhCd0G0Qw1egZuFlrFH9I7PPW-wJc1wioEd4hk00q-DFydk2c0gPnVe-NGZP1kUgmJk5ArEtWOVfEKRFrtIcTr8Hjzk3wWmQgR9ScXtXS-YEbD6E8SF0kON_TZGyeSN-dxYBxhElJg7NE4UX8d60lvfphMSNv9ffTdb2zNrxHtXSYZtOxFyQYHUcz6Las4jnU1kjqGXyhv49HRrGDfocxmsjyX0vmFpn3klzDviyNU5" alt="Legal documents" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">For Individuals & Businesses</h3>
              <p className="text-zinc-600 mb-6 leading-relaxed">Everything you need to know about using Lexis Legal safely and effectively.</p>
              <div className="mb-8">
                <h4 className="font-semibold text-zinc-900 mb-3">Outcome</h4>
                <ul className="space-y-2">
                  <li className="flex items-start text-sm text-zinc-600"><svg className="w-5 h-5 text-zinc-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg> Get plain-language answers to complex legal questions.</li>
                  <li className="flex items-start text-sm text-zinc-600"><svg className="w-5 h-5 text-zinc-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg> Instantly draft and format formal demand letters.</li>
                </ul>
              </div>
              <div className="mt-auto flex flex-col sm:flex-row gap-4">
                <SignedIn>
                  <Link to="/chat" className="inline-flex items-center justify-center px-6 py-3 bg-zinc-900 text-white text-sm font-medium rounded-full hover:bg-zinc-800 transition-colors w-full sm:w-auto text-center">Start Free Chat</Link>
                </SignedIn>
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="inline-flex items-center justify-center px-6 py-3 bg-zinc-900 text-white text-sm font-medium rounded-full hover:bg-zinc-800 transition-colors w-full sm:w-auto text-center">Start Free Chat</button>
                  </SignInButton>
                </SignedOut>
              </div>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm flex flex-col h-full">
              <div className="w-full h-64 bg-zinc-200 rounded-2xl mb-8 overflow-hidden">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCg76z89spcnXIFF-aXkXW_xbayykE4aSTGFw8Y6qiG_Id_yfeN2lntjIYTKTyoqMT7jemcti18UZCnI9zFebd82I_ZEhhya_8Pp4fKb4Zs4r3Z_XQ7vyH8Sqb0a7c7cAkCyyKjfSeSWcCmd2u2-WNvhkizaQkdV-XLtTRPwIVJf8qG66KZH7bWTxAwwD6PhH2PXYiswOz63JhDhSCE_NBIGXDKnuH-4zgBOF0ZZUPFs_M9jIDr1N2v4d7r6hNbpqo3MG883JiAv6YZ" alt="Legal documents" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">For Legal Professionals</h3>
              <p className="text-zinc-600 mb-6 leading-relaxed">Everything you need to know about using Lexis Legal safely and effectively.</p>
              <div className="mb-8">
                <h4 className="font-semibold text-zinc-900 mb-3">Outcome</h4>
                <ul className="space-y-2">
                  <li className="flex items-start text-sm text-zinc-600"><svg className="w-5 h-5 text-zinc-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg> Interrogate private documents securely via our DMS.</li>
                  <li className="flex items-start text-sm text-zinc-600"><svg className="w-5 h-5 text-zinc-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg> Export to our Cursor-style Accept/Reject editor.</li>
                </ul>
              </div>
              <div className="mt-auto flex flex-col sm:flex-row gap-4">
                <SignedIn>
                  <Link to="/database" className="inline-flex items-center justify-center px-6 py-3 bg-zinc-900 text-white text-sm font-medium rounded-full hover:bg-zinc-800 transition-colors w-full sm:w-auto text-center">Open Workspace</Link>
                </SignedIn>
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="inline-flex items-center justify-center px-6 py-3 bg-zinc-900 text-white text-sm font-medium rounded-full hover:bg-zinc-800 transition-colors w-full sm:w-auto text-center">Join for Free</button>
                  </SignInButton>
                </SignedOut>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Everything You Need */}
      <section className="py-32 bg-white border-t border-zinc-100 scroll-mt-20" id="ecosystem">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div className="lg:sticky lg:top-32">
              <div className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white bg-zinc-900 mb-6">THE ECOSYSTEM</div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6 leading-tight text-balance">Built for the public. Powerful enough for professionals.</h2>
              <p className="text-lg text-zinc-600">A complete, secure environment to take you from your very first legal question to a finalized, beautifully formatted document.</p>
            </div>
            <div className="space-y-4">
              <div className="bg-zinc-900 rounded-3xl p-8 flex gap-6 hover:bg-zinc-800 transition-colors cursor-pointer">
                <div className="flex-shrink-0 text-white">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path></svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">AI Legal Assistant</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">Ask questions naturally. The engine cross-references real laws and cites its sources, eliminating the guesswork.</p>
                </div>
              </div>
              <div className="bg-zinc-900 rounded-3xl p-8 flex gap-6 hover:bg-zinc-800 transition-colors cursor-pointer">
                <div className="flex-shrink-0 text-white">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path></svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Private Legal Database</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">Upload your own leases, contracts, or case files. Our RAG system analyzes your specific documents in total privacy.</p>
                </div>
              </div>
              <div className="bg-zinc-900 rounded-3xl p-8 flex gap-6 hover:bg-zinc-800 transition-colors cursor-pointer">
                <div className="flex-shrink-0 text-white">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path></svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Smart Document Editor</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">Review and edit AI-suggested clauses in a clean interface before compiling your final, court-ready PDF.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 bg-white bg-topo border-t border-zinc-100 scroll-mt-20" id="testimonials">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-zinc-900 mb-8">USER SUCCESS</div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6 max-w-3xl mx-auto text-balance">Empowering people and practitioners</h2>
          <p className="text-zinc-600 mb-16 max-w-2xl mx-auto">See how Vellum Law is changing the way people interact with the legal system.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-zinc-50 rounded-2xl p-8 text-left relative flex flex-col h-full border border-zinc-100">
              <div className="flex items-start gap-4 mb-6">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuA_0tx6DpJyx1mb4_iXSYIkYvd7Uf4v03tz-qwqjKf8A-kkZZgNVzc2Zb44gJyBcZuyeidcKNXr87cwUVijvoTe3LjjfjWWh3dD43XqEmO_I26VbcSQTvqH0Qlf8KvtOmNqb0c3uQXHHX5ci8ZEksB8kk0FCW7sF_wwkd8e_2QcrwpdtSE9erIMebgSa5ITbncy2URd6eFylpqHxlns-2nbUGiiJx7gbw7vzSvCjQki9dQSvqWidJ3-A0jzE3VxnIcOcRSc7_ou8W3V" alt="Avatar" className="w-12 h-12 rounded-full flex-shrink-0" />
                <p className="text-zinc-900 font-medium text-lg leading-snug">"I was terrified when my landlord sent me a notice. Vellum Law explained my rights clearly and helped me draft a formal response letter in 5 minutes."</p>
              </div>
              <div className="mt-auto flex justify-between items-end">
                <div>
                  <p className="font-bold text-zinc-900 text-sm">Amine T.</p>
                  <p className="text-zinc-500 text-xs">Small Business Owner</p>
                </div>
                <svg className="w-5 h-5 text-zinc-400" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path></svg>
              </div>
            </div>
            <div className="bg-zinc-50 rounded-2xl p-8 text-left relative flex flex-col h-full border border-zinc-100">
              <div className="flex items-start gap-4 mb-6">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDba89v3poaByL1XrVcXpo8RUn6Y4SJJ_QNIpuaatgudihyvyocRS0gf1aS96QDjSPXUrkGP56bPAAbLcIT9bL_eSRHr5rPZZwV8LH352OJyL5yxHewmY4-6nIbAHBKSPYKFSeDYWKeHcYV8Eq4u9LQW9BOENEVb2m2chMy13VEukwnWXKsbaamtkN1tkHDQD-sGUlC6-g_ohLtrVPxfliOMAmYls_S1VESB7M9rMlTeSK3bNeiE2cerryZj4ev-cGF-G-Tpcem78jQ" alt="Avatar" className="w-12 h-12 rounded-full flex-shrink-0" />
                <p className="text-zinc-900 font-medium text-lg leading-snug">"As a solo lawyer, I don't have a team of paralegals. Uploading a 200-page dossier and instantly finding contradictions has saved me countless billable hours."</p>
              </div>
              <div className="mt-auto flex justify-between items-end">
                <div>
                  <p className="font-bold text-zinc-900 text-sm">Sarah D.</p>
                  <p className="text-zinc-500 text-xs">Independent Attorney</p>
                </div>
                <svg className="w-5 h-5 text-zinc-400" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path></svg>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-4">
            <button className="w-10 h-10 rounded-full border border-zinc-300 flex items-center justify-center text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
            </button>
            <button className="w-10 h-10 rounded-full border border-zinc-300 flex items-center justify-center text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
            </button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-32 bg-zinc-50 border-t border-zinc-100 scroll-mt-20" id="faq">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-zinc-900 mb-8">FAQ</div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">Common Questions</h2>
          <p className="text-zinc-600 mb-16">Everything you need to know about using Vellum Law safely and effectively.</p>
          <div className="text-left">
            <div className="border-b border-zinc-200 py-6 flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                <h3 className="text-lg font-medium text-zinc-900 group-hover:text-zinc-600 transition-colors">Is Vellum Law a replacement for an actual lawyer?</h3>
              </div>
              <div className="w-6 h-6 rounded-full bg-zinc-300 flex items-center justify-center text-white flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
              </div>
            </div>
            <div className="border-b border-zinc-200 py-6 flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                <h3 className="text-lg font-medium text-zinc-900 group-hover:text-zinc-600 transition-colors">How do I know the legal answers are accurate?</h3>
              </div>
              <div className="w-6 h-6 rounded-full bg-zinc-300 flex items-center justify-center text-white flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
              </div>
            </div>
            <div className="border-b border-zinc-200 py-6 flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                <h3 className="text-lg font-medium text-zinc-900 group-hover:text-zinc-600 transition-colors">Is my uploaded private data safe?</h3>
              </div>
              <div className="w-6 h-6 rounded-full bg-zinc-300 flex items-center justify-center text-white flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
              </div>
            </div>
            <div className="border-b border-zinc-200 py-6 flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">4</div>
                <h3 className="text-lg font-medium text-zinc-900 group-hover:text-zinc-600 transition-colors">Can I customize the generated PDFs?</h3>
              </div>
              <div className="w-6 h-6 rounded-full bg-zinc-300 flex items-center justify-center text-white flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-950 text-white py-12 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col gap-2">
            <span className="font-bold tracking-wider uppercase text-lg">Vellum Law</span>
            <p className="text-xs text-zinc-500 max-w-xs">© 2026 Vellum Law. Empowering you with accessible legal intelligence.</p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-zinc-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Security Architecture</a>
            <a href="#" className="hover:text-white transition-colors">Regulatory Compliance</a>
            <a href="#" className="hover:text-white transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
