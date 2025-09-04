import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Mic, 
  Zap, 
  Shield, 
  Clock, 
  FileText, 
  Users,
  ArrowRight,
  CheckCircle,
  BarChart3,
  Lock,
  Star,
  Award,
  Brain,
  Stethoscope,
  FileHeart,
  Activity,
  Download,
  Play,
  Globe,
  Phone,
  Mail,
  MapPin,
  Building2,
  UserCheck,
  Timer,
  Headphones,
  Monitor,
  CloudUpload,
  Sparkles,
  Layers,
  TrendingUp,
  Heart,
  Target,
  Briefcase
} from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-teal-600/20" />
      <div className="absolute inset-0 bg-black/5" />
      
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/10 border-b border-white/20">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
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
            </div>
            
            <div className="hidden lg:flex items-center space-x-8">
              <a href="#features" className="text-white/80 hover:text-white transition-colors font-medium">Features</a>
              <a href="#solutions" className="text-white/80 hover:text-white transition-colors font-medium">Solutions</a>
              <a href="#testimonials" className="text-white/80 hover:text-white transition-colors font-medium">Reviews</a>
              <a href="#pricing" className="text-white/80 hover:text-white transition-colors font-medium">Pricing</a>
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
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20">
                  <Sparkles className="h-4 w-4 text-blue-300" />
                  <span className="text-white/90 font-medium">Trusted by 500+ Healthcare Facilities</span>
                </div>
                
                <h1 className="text-6xl md:text-7xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                    AI-Powered
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                    Medical
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                    Transcription
                  </span>
                </h1>
                
                <p className="text-xl text-blue-100/80 leading-relaxed max-w-xl">
                  Transform audio dictations into perfectly formatted medical documents in under 45 seconds. 
                  HIPAA-compliant with 99.2% accuracy powered by advanced AI.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/dashboard">
                  <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-xl shadow-blue-500/25 gap-2 px-8 py-4 text-lg font-semibold">
                    <Play className="h-5 w-5" />
                    Start Free Trial
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 backdrop-blur gap-2 px-8 py-4 text-lg">
                  <Monitor className="h-5 w-5" />
                  Watch Demo
                </Button>
              </div>

              <div className="flex items-center gap-8 pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {['MD', 'RN', 'DR', 'PA'].map((title, i) => (
                      <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 border-3 border-white/20 flex items-center justify-center text-xs font-bold text-white backdrop-blur">
                        {title}
                      </div>
                    ))}
                  </div>
                  <span className="text-blue-200/80 font-medium">2,500+ medical professionals</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1,2,3,4,5].map((i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-white font-semibold">4.9/5 rating</span>
                </div>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-3xl blur-3xl" />
              <Card className="relative bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full" />
                      <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                      <div className="w-3 h-3 bg-green-400 rounded-full" />
                    </div>
                    <span className="text-white/70 font-medium">Healthscribe Pro Dashboard</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Mic className="h-5 w-5 text-blue-300" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">Consultation_Dr_Martinez.mp3</p>
                        <p className="text-blue-200/60 text-xs">Processing... 89% complete</p>
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30">Active</Badge>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full" style={{width: '89%'}} />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-green-300" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">Surgery_Report_Dr_Kim.wav</p>
                        <p className="text-green-200/60 text-xs">Completed in 42 seconds</p>
                      </div>
                      <Badge className="bg-green-500/20 text-green-300 border-green-400/30">Complete</Badge>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-white/5 to-white/10 rounded-xl border border-white/20">
                    <p className="text-white/60 text-xs font-medium mb-2">TRANSCRIPTION PREVIEW</p>
                    <div className="text-sm text-white/90 leading-relaxed">
                      <span className="font-semibold text-blue-300">CHIEF COMPLAINT:</span> Patient presents with acute chest pain...
                      <br />
                      <span className="font-semibold text-blue-300">ASSESSMENT:</span> 65-year-old male with...
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Floating Stats */}
              <div className="absolute -top-6 -right-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-xl">
                <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">99.2%</div>
                <div className="text-white/60 text-sm font-medium">Accuracy</div>
              </div>
              
              <div className="absolute -bottom-6 -left-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-xl">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">42s</div>
                <div className="text-white/60 text-sm font-medium">Avg. Time</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 border-y border-white/10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Trusted by Leading Healthcare Organizations</h2>
            <p className="text-blue-200/80">Join thousands of medical professionals worldwide</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 items-center">
            {[
              { name: "Johns Hopkins", icon: "🏥" },
              { name: "Mayo Clinic", icon: "⚕️" },
              { name: "Cleveland Clinic", icon: "🏥" },
              { name: "Kaiser Permanente", icon: "⚕️" },
              { name: "Mount Sinai", icon: "🏥" },
              { name: "NYU Langone", icon: "⚕️" }
            ].map((org, i) => (
              <div key={i} className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/5 backdrop-blur border border-white/10 hover:bg-white/10 transition-all">
                <div className="text-4xl">{org.icon}</div>
                <div className="text-white/80 text-sm font-medium text-center">{org.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-blue-500/20 text-blue-300 border-blue-400/30 px-4 py-2">
              <Sparkles className="h-4 w-4 mr-2" />
              Advanced Features
            </Badge>
            <h2 className="text-5xl font-bold text-white mb-6">
              Everything You Need for
              <span className="block bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                Medical Transcription
              </span>
            </h2>
            <p className="text-xl text-blue-200/80 max-w-3xl mx-auto">
              Powered by cutting-edge AI technology, designed specifically for healthcare professionals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-white/5 backdrop-blur-xl border border-white/20 hover:bg-white/10 transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity" />
                  <div className="relative h-14 w-14 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <Brain className="h-7 w-7 text-white" />
                  </div>
                </div>
                <CardTitle className="text-white text-xl mb-2">AI-Powered Accuracy</CardTitle>
                <CardDescription className="text-blue-200/70">
                  Advanced OpenAI Whisper with medical-specific training for 99.2% accuracy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-white/80">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    Medical terminology recognition
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    Accent and dialect adaptation
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    Continuous learning improvement
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border border-white/20 hover:bg-white/10 transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity" />
                  <div className="relative h-14 w-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <Timer className="h-7 w-7 text-white" />
                  </div>
                </div>
                <CardTitle className="text-white text-xl mb-2">Lightning Fast Processing</CardTitle>
                <CardDescription className="text-blue-200/70">
                  Get formatted transcriptions in under 45 seconds, not hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-white/80">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    Real-time transcription
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    Batch processing support
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    Priority queue for urgent cases
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border border-white/20 hover:bg-white/10 transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity" />
                  <div className="relative h-14 w-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Shield className="h-7 w-7 text-white" />
                  </div>
                </div>
                <CardTitle className="text-white text-xl mb-2">HIPAA Compliant Security</CardTitle>
                <CardDescription className="text-blue-200/70">
                  Enterprise-grade security meeting all healthcare compliance requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-white/80">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    End-to-end encryption
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    SOC 2 Type II certified
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    GDPR compliant
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 border-y border-white/10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Trusted by Healthcare Professionals
              <span className="block text-transparent bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text">
                Worldwide
              </span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center p-8 rounded-2xl bg-white/5 backdrop-blur border border-white/20 hover:bg-white/10 transition-all">
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">2,500+</div>
              <div className="text-blue-200/80 font-medium">Medical Professionals</div>
            </div>
            <div className="text-center p-8 rounded-2xl bg-white/5 backdrop-blur border border-white/20 hover:bg-white/10 transition-all">
              <div className="text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">1.2M+</div>
              <div className="text-blue-200/80 font-medium">Transcriptions Completed</div>
            </div>
            <div className="text-center p-8 rounded-2xl bg-white/5 backdrop-blur border border-white/20 hover:bg-white/10 transition-all">
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">99.2%</div>
              <div className="text-blue-200/80 font-medium">Accuracy Rate</div>
            </div>
            <div className="text-center p-8 rounded-2xl bg-white/5 backdrop-blur border border-white/20 hover:bg-white/10 transition-all">
              <div className="text-5xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-2">42s</div>
              <div className="text-blue-200/80 font-medium">Average Processing Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl border border-white/20">
            <CardContent className="p-16 text-center">
              <h2 className="text-5xl font-bold text-white mb-6">
                Ready to Transform Your
                <span className="block bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                  Medical Documentation?
                </span>
              </h2>
              <p className="text-xl text-blue-200/80 mb-8 max-w-3xl mx-auto">
                Join thousands of healthcare professionals who save hours every week with our 
                AI-powered transcription service. Start your free trial today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard">
                  <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-xl shadow-blue-500/25 gap-2 px-8 py-4 text-lg font-semibold">
                    <Play className="h-5 w-5" />
                    Start Free Trial
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 backdrop-blur gap-2 px-8 py-4 text-lg">
                  <Phone className="h-5 w-5" />
                  Schedule Demo
                </Button>
              </div>
              <p className="text-blue-200/60 mt-6">
                No credit card required • 14-day free trial • Cancel anytime
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
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Stethoscope className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Healthscribe Pro</span>
              </div>
              <p className="text-blue-200/70">
                The most advanced AI-powered medical transcription platform for healthcare professionals.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-blue-200/70">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="/dashboard" className="hover:text-white transition-colors">Dashboard</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Mobile App</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-blue-200/70">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-blue-200/70">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
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
