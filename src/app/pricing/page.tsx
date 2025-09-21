import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Stethoscope,
  CheckCircle,
  X,
  Star,
  Users,
  Building2,
  ArrowRight,
  Play,
  Calculator,
  DollarSign,
  Clock,
  Shield,
  Headphones,
  Monitor,
  BarChart3,
  Zap,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Twitter,
  Github
} from 'lucide-react'

export const metadata = {
  title: "Pricing - Healthscribe.pro",
  description: "Transparent pricing for AI-powered medical transcription services. Choose the plan that fits your healthcare practice needs."
}

export default function Pricing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-teal-600/20" />
      <div className="absolute inset-0 bg-black/5" />
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/10 border-b border-white/20">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-75" />
                <div className="relative h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Stethoscope className="h-7 w-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  Healthscribe Pro
                </h1>
                <p className="text-xs text-blue-200/80">AI Medical Transcription</p>
              </div>
            </Link>

            <div className="hidden lg:flex items-center space-x-8">
              <Link href="/" className="text-white/80 hover:text-white transition-colors font-medium">Home</Link>
              <Link href="/about" className="text-white/80 hover:text-white transition-colors font-medium">About</Link>
              <Link href="/services" className="text-white/80 hover:text-white transition-colors font-medium">Services</Link>
              <Link href="/pricing" className="text-white hover:text-white transition-colors font-medium">Pricing</Link>
              <Link href="/contact" className="text-white/80 hover:text-white transition-colors font-medium">Contact</Link>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="text-white hover:bg-white/10 border-white/20">
                  Sign In
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/25">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-blue-500/20 text-blue-300 border-blue-400/30 px-4 py-2">
              <Calculator className="h-4 w-4 mr-2" />
              Transparent Pricing
            </Badge>

            <h1 className="text-6xl md:text-7xl font-bold mb-8">
              <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                Simple,
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                Transparent
              </span>
              <br />
              <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Pricing
              </span>
            </h1>

            <p className="text-xl text-blue-100/80 leading-relaxed max-w-3xl mx-auto">
              Choose the perfect plan for your healthcare practice. All plans include our core AI transcription features with different usage limits and support levels.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Toggle */}
      <section className="pb-16">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className="text-white font-medium">Monthly</span>
            <Switch />
            <span className="text-blue-200/70 font-medium">Annual</span>
            <Badge className="bg-green-500/20 text-green-300 border-green-400/30 ml-2">
              Save 20%
            </Badge>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Basic Plan */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/20 hover:bg-white/10 transition-all relative">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-white text-2xl mb-2">Basic</CardTitle>
                <CardDescription className="text-blue-200/70 text-base">
                  Perfect for individual practitioners
                </CardDescription>
                <div className="pt-4">
                  <div className="text-4xl font-bold text-white">$29</div>
                  <div className="text-blue-200/70">per month</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Real-time transcription
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    50 transcription hours/month
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    99.2% accuracy guarantee
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    HIPAA compliant
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Email support
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Standard templates
                  </li>
                </ul>
                <Link href="/dashboard" className="w-full block">
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 mt-6">
                    Start Free Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Professional Plan - Most Popular */}
            <Card className="bg-white/5 backdrop-blur-xl border-2 border-purple-400/50 hover:bg-white/10 transition-all relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30 px-4 py-2">
                  <Star className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-white text-2xl mb-2">Professional</CardTitle>
                <CardDescription className="text-blue-200/70 text-base">
                  Ideal for small to medium practices
                </CardDescription>
                <div className="pt-4">
                  <div className="text-4xl font-bold text-white">$79</div>
                  <div className="text-blue-200/70">per month</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Everything in Basic
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    200 transcription hours/month
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Priority support
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Custom templates
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Batch processing
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Analytics dashboard
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    API access
                  </li>
                </ul>
                <Link href="/dashboard" className="w-full block">
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 mt-6">
                    Start Free Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/20 hover:bg-white/10 transition-all relative">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-white text-2xl mb-2">Enterprise</CardTitle>
                <CardDescription className="text-blue-200/70 text-base">
                  For large healthcare organizations
                </CardDescription>
                <div className="pt-4">
                  <div className="text-4xl font-bold text-white">$199</div>
                  <div className="text-blue-200/70">per month</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Everything in Professional
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Unlimited transcription hours
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    24/7 phone support
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Dedicated account manager
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    EMR system integration
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Custom AI training
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    SLA guarantee
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    On-premise deployment option
                  </li>
                </ul>
                <Link href="/contact" className="w-full block">
                  <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 mt-6">
                    Contact Sales
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-24 border-y border-white/10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              Detailed <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">Feature Comparison</span>
            </h2>
          </div>

          <Card className="bg-white/5 backdrop-blur-xl border border-white/20">
            <CardContent className="p-8">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-4 px-6 text-white font-semibold">Features</th>
                      <th className="text-center py-4 px-6 text-white font-semibold">Basic</th>
                      <th className="text-center py-4 px-6 text-white font-semibold">Professional</th>
                      <th className="text-center py-4 px-6 text-white font-semibold">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-2">
                    <tr className="border-b border-white/5">
                      <td className="py-4 px-6 text-white/80 font-medium">Transcription Hours</td>
                      <td className="text-center py-4 px-6 text-blue-200/70">50/month</td>
                      <td className="text-center py-4 px-6 text-blue-200/70">200/month</td>
                      <td className="text-center py-4 px-6 text-blue-200/70">Unlimited</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-4 px-6 text-white/80 font-medium">Real-time Transcription</td>
                      <td className="text-center py-4 px-6">
                        <CheckCircle className="h-5 w-5 text-green-400 mx-auto" />
                      </td>
                      <td className="text-center py-4 px-6">
                        <CheckCircle className="h-5 w-5 text-green-400 mx-auto" />
                      </td>
                      <td className="text-center py-4 px-6">
                        <CheckCircle className="h-5 w-5 text-green-400 mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-4 px-6 text-white/80 font-medium">Batch Processing</td>
                      <td className="text-center py-4 px-6">
                        <X className="h-5 w-5 text-red-400 mx-auto" />
                      </td>
                      <td className="text-center py-4 px-6">
                        <CheckCircle className="h-5 w-5 text-green-400 mx-auto" />
                      </td>
                      <td className="text-center py-4 px-6">
                        <CheckCircle className="h-5 w-5 text-green-400 mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-4 px-6 text-white/80 font-medium">Custom Templates</td>
                      <td className="text-center py-4 px-6">
                        <X className="h-5 w-5 text-red-400 mx-auto" />
                      </td>
                      <td className="text-center py-4 px-6">
                        <CheckCircle className="h-5 w-5 text-green-400 mx-auto" />
                      </td>
                      <td className="text-center py-4 px-6">
                        <CheckCircle className="h-5 w-5 text-green-400 mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-4 px-6 text-white/80 font-medium">Priority Support</td>
                      <td className="text-center py-4 px-6">
                        <X className="h-5 w-5 text-red-400 mx-auto" />
                      </td>
                      <td className="text-center py-4 px-6">
                        <CheckCircle className="h-5 w-5 text-green-400 mx-auto" />
                      </td>
                      <td className="text-center py-4 px-6">
                        <CheckCircle className="h-5 w-5 text-green-400 mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-4 px-6 text-white/80 font-medium">Analytics Dashboard</td>
                      <td className="text-center py-4 px-6">
                        <X className="h-5 w-5 text-red-400 mx-auto" />
                      </td>
                      <td className="text-center py-4 px-6">
                        <CheckCircle className="h-5 w-5 text-green-400 mx-auto" />
                      </td>
                      <td className="text-center py-4 px-6">
                        <CheckCircle className="h-5 w-5 text-green-400 mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-4 px-6 text-white/80 font-medium">API Access</td>
                      <td className="text-center py-4 px-6">
                        <X className="h-5 w-5 text-red-400 mx-auto" />
                      </td>
                      <td className="text-center py-4 px-6">
                        <CheckCircle className="h-5 w-5 text-green-400 mx-auto" />
                      </td>
                      <td className="text-center py-4 px-6">
                        <CheckCircle className="h-5 w-5 text-green-400 mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-4 px-6 text-white/80 font-medium">24/7 Support</td>
                      <td className="text-center py-4 px-6">
                        <X className="h-5 w-5 text-red-400 mx-auto" />
                      </td>
                      <td className="text-center py-4 px-6">
                        <X className="h-5 w-5 text-red-400 mx-auto" />
                      </td>
                      <td className="text-center py-4 px-6">
                        <CheckCircle className="h-5 w-5 text-green-400 mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-4 px-6 text-white/80 font-medium">EMR Integration</td>
                      <td className="text-center py-4 px-6">
                        <X className="h-5 w-5 text-red-400 mx-auto" />
                      </td>
                      <td className="text-center py-4 px-6">
                        <X className="h-5 w-5 text-red-400 mx-auto" />
                      </td>
                      <td className="text-center py-4 px-6">
                        <CheckCircle className="h-5 w-5 text-green-400 mx-auto" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              Frequently Asked <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">Questions</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="bg-white/5 backdrop-blur-xl border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">Can I change my plan anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-200/70">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and billing is prorated accordingly.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">What happens if I exceed my hours?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-200/70">
                  If you exceed your monthly hours, you'll be charged at our overage rate of $0.50 per additional hour for Basic and Professional plans.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">Is there a free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-200/70">
                  Yes! We offer a 14-day free trial with full access to all features. No credit card required to get started.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-200/70">
                  We accept all major credit cards, ACH transfers, and wire transfers for annual plans. Enterprise customers can also pay via invoice.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl border border-white/20">
            <CardContent className="p-16 text-center">
              <h2 className="text-4xl font-bold text-white mb-6">
                Ready to Get
                <span className="block bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                  Started?
                </span>
              </h2>
              <p className="text-xl text-blue-200/80 mb-8 max-w-3xl mx-auto">
                Join thousands of healthcare professionals who have already transformed their documentation workflow with Healthscribe Pro.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard">
                  <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-xl shadow-blue-500/25 gap-2 px-8 py-4 text-lg font-semibold">
                    <Play className="h-5 w-5" />
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 backdrop-blur gap-2 px-8 py-4 text-lg">
                    <Phone className="h-5 w-5" />
                    Talk to Sales
                  </Button>
                </Link>
              </div>
              <p className="text-blue-200/60 mt-6">
                14-day free trial • No credit card required • Cancel anytime
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 backdrop-blur">
        <div className="container mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Link href="/" className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Stethoscope className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Healthscribe Pro</span>
              </Link>
              <p className="text-blue-200/70">
                The most advanced AI-powered medical transcription platform for healthcare professionals.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-blue-200/70">
                <li><Link href="/services" className="hover:text-white transition-colors">Services</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">API</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-blue-200/70">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Press</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-blue-200/70">
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/legal/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/legal/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <Separator className="my-8 bg-white/10" />

          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-blue-200/60">
              © 2024 Healthscribe Pro. All rights reserved.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="text-blue-200/60 hover:text-white transition-colors">
                <Globe className="h-5 w-5" />
              </a>
              <a href="#" className="text-blue-200/60 hover:text-white transition-colors">
                <Mail className="h-5 w-5" />
              </a>
              <a href="#" className="text-blue-200/60 hover:text-white transition-colors">
                <Phone className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
