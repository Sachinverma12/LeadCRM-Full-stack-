'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, Loader2, Send, ArrowRight, Sparkles, Shield, Clock, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function HomePage() {
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!form.name.trim()) newErrors.name = 'Name is required'
    if (!form.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setError('')
    setSuccess(false)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Something went wrong')
      }
      setSuccess(true)
      setForm({ name: '', email: '', company: '', message: '' })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  const features = [
    { icon: Clock, title: 'Fast Response', description: 'Our team typically responds within 24 hours' },
    { icon: Users, title: 'Expert Team', description: 'Get help from experienced professionals' },
    { icon: Shield, title: 'Secure & Private', description: 'Your data is encrypted and protected' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700/50 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-white">LC</span>
            </div>
            <h1 className="text-xl font-bold text-white">LeadCRM</h1>
          </div>
          <Link href="/login" className="text-sm text-slate-300 hover:text-white transition-colors">
            Staff Login →
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left: Hero Content */}
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-4">
                <Sparkles className="w-3 h-3" />
                Lead Management Platform
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
                Get in touch
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">with us</span>
              </h2>
              <p className="text-lg text-slate-300 leading-relaxed">
                Fill out the form and our expert team will get back to you within 24 hours. We are here to help you grow your business.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">{feature.title}</h3>
                    <p className="text-sm text-slate-400">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Form */}
          <div className="bg-white/5 rounded-2xl p-6 md:p-8 border border-slate-700/50 backdrop-blur-sm">
            {success ? (
              <div className="text-center py-12 space-y-4 animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-semibold text-white">Thank you!</h3>
                <p className="text-slate-300">We received your message and will get back to you shortly.</p>
                <button
                  onClick={() => setSuccess(false)}
                  className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
                >
                  Submit another <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Your Name *"
                    required
                    value={form.name}
                    onChange={e => {
                      setForm({...form, name: e.target.value})
                      setErrors(prev => ({...prev, name: ''}))
                    }}
                    className={cn(
                      "w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200",
                      errors.name ? "border-red-500/50 focus:ring-red-500" : "border-slate-600 focus:bg-slate-800/70"
                    )}
                  />
                  {errors.name && <p className="flex items-center gap-1 mt-1 text-xs text-red-400"><AlertCircle className="w-3 h-3" />{errors.name}</p>}
                </div>

                <div>
                  <input
                    type="email"
                    placeholder="Email Address *"
                    required
                    value={form.email}
                    onChange={e => {
                      setForm({...form, email: e.target.value})
                      setErrors(prev => ({...prev, email: ''}))
                    }}
                    className={cn(
                      "w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200",
                      errors.email ? "border-red-500/50 focus:ring-red-500" : "border-slate-600 focus:bg-slate-800/70"
                    )}
                  />
                  {errors.email && <p className="flex items-center gap-1 mt-1 text-xs text-red-400"><AlertCircle className="w-3 h-3" />{errors.email}</p>}
                </div>

                <input
                  type="text"
                  placeholder="Company"
                  value={form.company}
                  onChange={e => setForm({...form, company: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-600 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 focus:bg-slate-800/70"
                />

                <textarea
                  rows={3}
                  placeholder="How can we help you?"
                  value={form.message}
                  onChange={e => setForm({...form, message: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-600 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all duration-200 focus:bg-slate-800/70"
                />

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 animate-in slide-in-from-top-2 duration-200">
                    <p className="text-red-400 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 text-white font-semibold transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
