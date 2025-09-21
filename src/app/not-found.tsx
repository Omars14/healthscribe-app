import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Stethoscope,
  Home,
  Search,
  ArrowLeft,
  Mail,
  Phone,
  MessageSquare,
  FileText,
  Globe,
  Linkedin,
  Twitter,
  Github
} from 'lucide-react'

export default function NotFound() {
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

      {/* Main Content */}
      <div className="pt-32 min-h-screen flex items-center justify-center px-6">
        <div className="max-w-2xl mx-auto text-center">
          {/* 404 Badge */}
          <Badge className="mb-8 bg-red-500/20 text-red-300 border-red-400/30 px-6 py-3 text-lg">
            404 - Page Not Found
          </Badge>

          {/* Error Illustration */}
          <div className="mb-12">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-3xl opacity-20" />
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Search className="h-16 w-16 text-white" />
                </div>
              </div>
            </div>

            <h1 className="text-6xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                Oops!
              </span>
            </h1>

            <p className="text-2xl text-blue-100/80 leading-relaxed mb-8 max-w-xl mx-auto">
              The page you're looking for seems to have wandered off on its own medical journey.
            </p>

            <p className="text-lg text-blue-200/70 mb-12 max-w-lg mx-auto">
              Don't worry, this happens to the best of us. Let us help you find your way back to quality medical transcription services.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Link href="/">
              <Card className="bg-white/5 backdrop-blur-xl border border-white/20 hover:bg-white/10 transition-all group cursor-pointer">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Home className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-white font-semibold text-xl mb-2">Go Home</h3>
                  <p className="text-blue-200/70">Return to our main page and explore our services</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard">
              <Card className="bg-white/5 backdrop-blur-xl border border-white/20 hover:bg-white/10 transition-all group cursor-pointer">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-white font-semibold text-xl mb-2">Start Transcribing</h3>
                  <p className="text-blue-200/70">Jump right into our AI-powered transcription platform</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Popular Links */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/20 mb-12">
            <CardHeader>
              <CardTitle className="text-white text-xl mb-2">Popular Pages</CardTitle>
              <CardDescription className="text-blue-200/70">
                Here are some pages you might be looking for
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <Link href="/about" className="flex items-center gap-3 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Stethoscope className="h-5 w-5 text-blue-300" />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-medium">About Us</div>
                    <div className="text-blue-200/70 text-sm">Learn about Healthscribe Pro</div>
                  </div>
                </Link>

                <Link href="/services" className="flex items-center gap-3 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-green-300" />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-medium">Services</div>
                    <div className="text-blue-200/70 text-sm">Explore our transcription services</div>
                  </div>
                </Link>

                <Link href="/pricing" className="flex items-center gap-3 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <ArrowLeft className="h-5 w-5 text-purple-300" />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-medium">Pricing</div>
                    <div className="text-blue-200/70 text-sm">View our pricing plans</div>
                  </div>
                </Link>

                <Link href="/contact" className="flex items-center gap-3 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-orange-300" />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-medium">Contact Us</div>
                    <div className="text-blue-200/70 text-sm">Get in touch with our team</div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Support Section */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/20 mb-12">
            <CardHeader>
              <CardTitle className="text-white text-xl mb-2">Need Help?</CardTitle>
              <CardDescription className="text-blue-200/70">
                Our support team is here to help you find what you're looking for
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Mail className="h-6 w-6 text-blue-300" />
                  </div>
                  <h3 className="text-white font-medium mb-1">Email Support</h3>
                  <p className="text-blue-200/70 text-sm">support@healthscribe.pro</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Phone className="h-6 w-6 text-green-300" />
                  </div>
                  <h3 className="text-white font-medium mb-1">Phone Support</h3>
                  <p className="text-blue-200/70 text-sm">+1 (555) 123-4567</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="h-6 w-6 text-purple-300" />
                  </div>
                  <h3 className="text-white font-medium mb-1">Live Chat</h3>
                  <p className="text-blue-200/70 text-sm">Available 24/7</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <div className="space-y-6">
            <p className="text-blue-200/70">
              Ready to experience the future of medical transcription?
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-xl shadow-blue-500/25 gap-2 px-8 py-4 text-lg font-semibold">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 backdrop-blur gap-2 px-8 py-4 text-lg">
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

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
