import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Stethoscope,
  Mic,
  FileText,
  Clock,
  Shield,
  CheckCircle,
  Brain,
  Users,
  Building2,
  ArrowRight,
  Play,
  Download,
  Upload,
  Settings,
  Headphones,
  Monitor,
  BarChart3,
  Lock,
  Star,
  Zap,
  Globe,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Twitter,
  Github,
  Timer,
  Target,
  Award,
  Heart
} from 'lucide-react'

export const metadata = {
  title: "Services - Healthscribe.pro",
  description: "Professional AI-powered medical transcription services for healthcare professionals. HIPAA-compliant, 99.2% accurate, and lightning-fast."
}

export default function Services() {
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
              <Link href="/services" className="text-white hover:text-white transition-colors font-medium">Services</Link>
              <Link href="/pricing" className="text-white/80 hover:text-white transition-colors font-medium">Pricing</Link>
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
              <FileText className="h-4 w-4 mr-2" />
              Our Services
            </Badge>

            <h1 className="text-6xl md:text-7xl font-bold mb-8">
              <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                Complete
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                Medical
              </span>
              <br />
              <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Transcription
              </span>
              <br />
              <span className="bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent">
                Solutions
              </span>
            </h1>

            <p className="text-xl text-blue-100/80 leading-relaxed max-w-3xl mx-auto">
              From real-time transcription to comprehensive documentation management, we provide end-to-end solutions for healthcare professionals. All powered by advanced AI and backed by enterprise-grade security.
            </p>
          </div>
        </div>
      </section>

      {/* Core Services */}
      <section className="py-24 border-y border-white/10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              Core <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">Transcription Services</span>
            </h2>
            <p className="text-xl text-blue-200/80 max-w-3xl mx-auto">
              Our comprehensive suite of AI-powered transcription services designed specifically for healthcare professionals
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="bg-white/5 backdrop-blur-xl border border-white/20 hover:bg-white/10 transition-all group">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <Mic className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-xl mb-1">Real-Time Transcription</CardTitle>
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30">Most Popular</Badge>
                  </div>
                </div>
                <CardDescription className="text-blue-200/70 text-base">
                  Instant transcription during consultations, procedures, and patient interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Live transcription during appointments
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Medical terminology recognition
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Multi-speaker identification
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Noise reduction and audio enhancement
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Integration with EMR systems
                  </li>
                </ul>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-white">Starting at $29/month</span>
                  <Link href="/dashboard">
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                      Try Now <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border border-white/20 hover:bg-white/10 transition-all group">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <Upload className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-xl mb-1">Batch Processing</CardTitle>
                    <Badge className="bg-green-500/20 text-green-300 border-green-400/30">Bulk Upload</Badge>
                  </div>
                </div>
                <CardDescription className="text-blue-200/70 text-base">
                  Upload multiple audio files for efficient batch processing and transcription
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Upload multiple files simultaneously
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Priority processing queue
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Bulk export and download
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Automated file organization
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Progress tracking dashboard
                  </li>
                </ul>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-white">Starting at $49/month</span>
                  <Link href="/dashboard">
                    <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                      Upload Files <Upload className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Specialty Services */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              Specialty <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">Services</span>
            </h2>
            <p className="text-xl text-blue-200/80 max-w-3xl mx-auto">
              Specialized transcription services tailored to specific medical specialties and use cases
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-white/5 backdrop-blur-xl border border-white/20 hover:bg-white/10 transition-all">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                  <Heart className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-white text-xl mb-2">Cardiology</CardTitle>
                <CardDescription className="text-blue-200/70">
                  Specialized transcription for cardiac procedures, consultations, and reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-white/80">
                    <div className="w-2 h-2 bg-purple-400 rounded-full" />
                    Echocardiogram reports
                  </li>
                  <li className="flex items-center gap-2 text-white/80">
                    <div className="w-2 h-2 bg-purple-400 rounded-full" />
                    Cardiac consultation notes
                  </li>
                  <li className="flex items-center gap-2 text-white/80">
                    <div className="w-2 h-2 bg-purple-400 rounded-full" />
                    Stress test interpretations
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border border-white/20 hover:bg-white/10 transition-all">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-4">
                  <Brain className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-white text-xl mb-2">Neurology</CardTitle>
                <CardDescription className="text-blue-200/70">
                  Expert transcription for neurological assessments and procedures
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-white/80">
                    <div className="w-2 h-2 bg-orange-400 rounded-full" />
                    EEG interpretation reports
                  </li>
                  <li className="flex items-center gap-2 text-white/80">
                    <div className="w-2 h-2 bg-orange-400 rounded-full" />
                    Neurological evaluations
                  </li>
                  <li className="flex items-center gap-2 text-white/80">
                    <div className="w-2 h-2 bg-orange-400 rounded-full" />
                    Cognitive assessment notes
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border border-white/20 hover:bg-white/10 transition-all">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-white text-xl mb-2">Psychiatry</CardTitle>
                <CardDescription className="text-blue-200/70">
                  Sensitive and accurate transcription for mental health documentation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-white/80">
                    <div className="w-2 h-2 bg-teal-400 rounded-full" />
                    Therapy session notes
                  </li>
                  <li className="flex items-center gap-2 text-white/80">
                    <div className="w-2 h-2 bg-teal-400 rounded-full" />
                    Psychiatric evaluations
                  </li>
                  <li className="flex items-center gap-2 text-white/80">
                    <div className="w-2 h-2 bg-teal-400 rounded-full" />
                    Treatment progress notes
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Additional Services */}
      <section className="py-24 border-y border-white/10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              Additional <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">Services</span>
            </h2>
            <p className="text-xl text-blue-200/80 max-w-3xl mx-auto">
              Comprehensive support services to enhance your transcription workflow
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white/5 backdrop-blur-xl border border-white/20 hover:bg-white/10 transition-all text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Settings className="h-6 w-6 text-blue-300" />
                </div>
                <CardTitle className="text-white text-lg">Custom Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-200/70 text-sm">
                  Create and use custom documentation templates for your specialty
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border border-white/20 hover:bg-white/10 transition-all text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-6 w-6 text-green-300" />
                </div>
                <CardTitle className="text-white text-lg">Analytics Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-200/70 text-sm">
                  Track usage, accuracy rates, and productivity metrics
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border border-white/20 hover:bg-white/10 transition-all text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-6 w-6 text-purple-300" />
                </div>
                <CardTitle className="text-white text-lg">EMR Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-200/70 text-sm">
                  Direct integration with major Electronic Medical Record systems
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border border-white/20 hover:bg-white/10 transition-all text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Headphones className="h-6 w-6 text-orange-300" />
                </div>
                <CardTitle className="text-white text-lg">24/7 Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-200/70 text-sm">
                  Round-the-clock technical support and customer service
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Service Comparison */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              Compare Our <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">Services</span>
            </h2>
          </div>

          <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-4">Basic</h3>
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">$29/month</div>
                  <p className="text-blue-200/70 mb-6">Perfect for individual practitioners</p>
                  <ul className="space-y-3 text-left">
                    <li className="flex items-center gap-3 text-white/80">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      Real-time transcription
                    </li>
                    <li className="flex items-center gap-3 text-white/80">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      50 hours/month
                    </li>
                    <li className="flex items-center gap-3 text-white/80">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      Email support
                    </li>
                  </ul>
                </div>

                <div className="text-center relative">
                  <Badge className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-purple-500/20 text-purple-300 border-purple-400/30">
                    Most Popular
                  </Badge>
                  <h3 className="text-2xl font-bold text-white mb-4">Professional</h3>
                  <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">$79/month</div>
                  <p className="text-blue-200/70 mb-6">Ideal for small practices</p>
                  <ul className="space-y-3 text-left">
                    <li className="flex items-center gap-3 text-white/80">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      Everything in Basic
                    </li>
                    <li className="flex items-center gap-3 text-white/80">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      200 hours/month
                    </li>
                    <li className="flex items-center gap-3 text-white/80">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      Priority support
                    </li>
                    <li className="flex items-center gap-3 text-white/80">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      Custom templates
                    </li>
                  </ul>
                </div>

                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-4">Enterprise</h3>
                  <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">$199/month</div>
                  <p className="text-blue-200/70 mb-6">For large healthcare organizations</p>
                  <ul className="space-y-3 text-left">
                    <li className="flex items-center gap-3 text-white/80">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      Everything in Professional
                    </li>
                    <li className="flex items-center gap-3 text-white/80">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      Unlimited hours
                    </li>
                    <li className="flex items-center gap-3 text-white/80">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      24/7 phone support
                    </li>
                    <li className="flex items-center gap-3 text-white/80">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      EMR integration
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl border border-white/20">
            <CardContent className="p-16 text-center">
              <h2 className="text-4xl font-bold text-white mb-6">
                Ready to Transform Your
                <span className="block bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                  Documentation Workflow?
                </span>
              </h2>
              <p className="text-xl text-blue-200/80 mb-8 max-w-3xl mx-auto">
                Join thousands of healthcare professionals who save hours every week with our AI-powered transcription services.
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
                    Schedule Demo
                  </Button>
                </Link>
              </div>
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
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
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
                <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/legal/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/legal/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
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
