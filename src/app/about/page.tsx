import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Stethoscope,
  Award,
  Users,
  Target,
  Heart,
  Lightbulb,
  Shield,
  TrendingUp,
  Globe,
  Calendar,
  Building2,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Twitter,
  Github
} from 'lucide-react'

export const metadata = {
  title: "About Us - Healthscribe.pro",
  description: "Learn about Healthscribe.pro - the leading AI-powered medical transcription platform trusted by healthcare professionals worldwide."
}

export default function About() {
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
              <Link href="/about" className="text-white hover:text-white transition-colors font-medium">About</Link>
              <Link href="/services" className="text-white/80 hover:text-white transition-colors font-medium">Services</Link>
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
              <Building2 className="h-4 w-4 mr-2" />
              About Healthscribe Pro
            </Badge>

            <h1 className="text-6xl md:text-7xl font-bold mb-8">
              <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                Revolutionizing
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                Medical
              </span>
              <br />
              <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Documentation
              </span>
            </h1>

            <p className="text-xl text-blue-100/80 leading-relaxed max-w-3xl mx-auto">
              Founded by healthcare professionals and AI experts, Healthscribe Pro is on a mission to eliminate the burden of medical documentation and give healthcare providers more time to focus on what matters most - patient care.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 border-y border-white/10">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">
                Our <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">Mission</span>
              </h2>
              <p className="text-lg text-blue-100/80 mb-8 leading-relaxed">
                We believe that healthcare professionals should spend their time healing, not typing. Our AI-powered platform transforms hours of documentation work into seconds, allowing doctors, nurses, and medical staff to focus on patient care rather than paperwork.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Target className="h-5 w-5 text-blue-300" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Empower Healthcare Professionals</h3>
                    <p className="text-blue-200/70 text-sm">Give medical professionals the tools they need to focus on patient care</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Heart className="h-5 w-5 text-green-300" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Improve Patient Outcomes</h3>
                    <p className="text-blue-200/70 text-sm">Reduce documentation burden to improve care quality and patient satisfaction</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="h-5 w-5 text-purple-300" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Lead AI Innovation</h3>
                    <p className="text-blue-200/70 text-sm">Continuously advance AI technology specifically for healthcare applications</p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl mb-2">Company Timeline</CardTitle>
                <CardDescription className="text-blue-200/70">
                  Key milestones in our journey to transform medical documentation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-6 w-6 text-blue-300" />
                  </div>
                  <div>
                    <div className="text-white font-semibold mb-1">2022 - Company Founded</div>
                    <div className="text-blue-200/70 text-sm">Healthscribe Pro was founded by a team of physicians and AI researchers</div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-green-300" />
                  </div>
                  <div>
                    <div className="text-white font-semibold mb-1">2023 - First 1,000 Users</div>
                    <div className="text-blue-200/70 text-sm">Reached our first major milestone with healthcare professionals across 15 countries</div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Award className="h-6 w-6 text-purple-300" />
                  </div>
                  <div>
                    <div className="text-white font-semibold mb-1">2024 - HIPAA Certification</div>
                    <div className="text-blue-200/70 text-sm">Achieved full HIPAA compliance and SOC 2 Type II certification</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              Meet Our <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">Leadership Team</span>
            </h2>
            <p className="text-xl text-blue-200/80 max-w-3xl mx-auto">
              Our diverse team combines decades of healthcare experience with cutting-edge AI expertise
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-white/5 backdrop-blur-xl border border-white/20 hover:bg-white/10 transition-all">
              <CardHeader className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                    <Users className="h-10 w-10 text-white" />
                  </div>
                </div>
                <CardTitle className="text-white text-xl">Dr. Sarah Chen</CardTitle>
                <CardDescription className="text-blue-200/70">Chief Executive Officer</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-blue-200/80 mb-4">
                  Former Chief of Medicine at Johns Hopkins with 15+ years in healthcare administration and digital health innovation.
                </p>
                <div className="flex justify-center gap-2">
                  <Linkedin className="h-5 w-5 text-blue-300 cursor-pointer hover:text-blue-200" />
                  <Twitter className="h-5 w-5 text-blue-300 cursor-pointer hover:text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border border-white/20 hover:bg-white/10 transition-all">
              <CardHeader className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                    <Lightbulb className="h-10 w-10 text-white" />
                  </div>
                </div>
                <CardTitle className="text-white text-xl">Dr. Michael Rodriguez</CardTitle>
                <CardDescription className="text-blue-200/70">Chief Technology Officer</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-blue-200/80 mb-4">
                  AI researcher and former Google AI lead with PhD in Machine Learning. Expert in natural language processing and healthcare AI.
                </p>
                <div className="flex justify-center gap-2">
                  <Linkedin className="h-5 w-5 text-blue-300 cursor-pointer hover:text-blue-200" />
                  <Github className="h-5 w-5 text-blue-300 cursor-pointer hover:text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border border-white/20 hover:bg-white/10 transition-all">
              <CardHeader className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                    <Shield className="h-10 w-10 text-white" />
                  </div>
                </div>
                <CardTitle className="text-white text-xl">Lisa Thompson</CardTitle>
                <CardDescription className="text-blue-200/70">Chief Compliance Officer</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-blue-200/80 mb-4">
                  Healthcare compliance expert with 12+ years ensuring HIPAA compliance and data security for healthcare technology companies.
                </p>
                <div className="flex justify-center gap-2">
                  <Linkedin className="h-5 w-5 text-blue-300 cursor-pointer hover:text-blue-200" />
                  <Twitter className="h-5 w-5 text-blue-300 cursor-pointer hover:text-blue-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 border-y border-white/10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              Our <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">Core Values</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-8 rounded-2xl bg-white/5 backdrop-blur border border-white/20">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Heart className="h-8 w-8 text-blue-300" />
              </div>
              <h3 className="text-white font-semibold text-xl mb-3">Patient First</h3>
              <p className="text-blue-200/70">
                Every decision we make prioritizes patient safety and care quality
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-white/5 backdrop-blur border border-white/20">
              <div className="w-16 h-16 bg-green-500/20 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Shield className="h-8 w-8 text-green-300" />
              </div>
              <h3 className="text-white font-semibold text-xl mb-3">Security First</h3>
              <p className="text-blue-200/70">
                Uncompromising commitment to data security and privacy protection
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-white/5 backdrop-blur border border-white/20">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Lightbulb className="h-8 w-8 text-purple-300" />
              </div>
              <h3 className="text-white font-semibold text-xl mb-3">Innovation</h3>
              <p className="text-blue-200/70">
                Continuous improvement through cutting-edge AI and healthcare research
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-white/5 backdrop-blur border border-white/20">
              <div className="w-16 h-16 bg-orange-500/20 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Globe className="h-8 w-8 text-orange-300" />
              </div>
              <h3 className="text-white font-semibold text-xl mb-3">Accessibility</h3>
              <p className="text-blue-200/70">
                Making advanced medical transcription accessible to all healthcare providers
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              By the <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">Numbers</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center p-8 rounded-2xl bg-white/5 backdrop-blur border border-white/20">
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">2022</div>
              <div className="text-blue-200/80 font-medium">Founded</div>
            </div>
            <div className="text-center p-8 rounded-2xl bg-white/5 backdrop-blur border border-white/20">
              <div className="text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">50+</div>
              <div className="text-blue-200/80 font-medium">Countries Served</div>
            </div>
            <div className="text-center p-8 rounded-2xl bg-white/5 backdrop-blur border border-white/20">
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">2,500+</div>
              <div className="text-blue-200/80 font-medium">Healthcare Professionals</div>
            </div>
            <div className="text-center p-8 rounded-2xl bg-white/5 backdrop-blur border border-white/20">
              <div className="text-5xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-2">99.2%</div>
              <div className="text-blue-200/80 font-medium">Accuracy Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl border border-white/20">
            <CardContent className="p-16 text-center">
              <h2 className="text-4xl font-bold text-white mb-6">
                Ready to Join the
                <span className="block bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                  Healthscribe Pro Family?
                </span>
              </h2>
              <p className="text-xl text-blue-200/80 mb-8 max-w-3xl mx-auto">
                Experience the future of medical documentation. Join thousands of healthcare professionals who have already transformed their workflow.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard">
                  <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-xl shadow-blue-500/25 gap-2 px-8 py-4 text-lg font-semibold">
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 backdrop-blur gap-2 px-8 py-4 text-lg">
                    Contact Us
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
              <div className="flex gap-4">
                <Linkedin className="h-5 w-5 text-blue-300 cursor-pointer hover:text-blue-200" />
                <Twitter className="h-5 w-5 text-blue-300 cursor-pointer hover:text-blue-200" />
                <Github className="h-5 w-5 text-blue-300 cursor-pointer hover:text-blue-200" />
              </div>
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
