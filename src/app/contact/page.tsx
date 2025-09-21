import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Stethoscope,
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  Send,
  Building2,
  Users,
  Headphones,
  Globe,
  Linkedin,
  Twitter,
  Github,
  CheckCircle,
  ArrowRight,
  Play
} from 'lucide-react'

export const metadata = {
  title: "Contact Us - Healthscribe.pro",
  description: "Get in touch with Healthscribe.pro. We're here to help with your medical transcription needs. Contact our support team today."
}

export default function Contact() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
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
              <Link href="/contact" className="text-white hover:text-white transition-colors font-medium">Contact</Link>
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
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Us
            </Badge>

            <h1 className="text-6xl md:text-7xl font-bold mb-8">
              <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                Get in
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                Touch
              </span>
            </h1>

            <p className="text-xl text-blue-100/80 leading-relaxed max-w-3xl mx-auto">
              Have questions about our AI-powered medical transcription services? Our expert team is here to help. Reach out to us through any of the channels below or use our contact form.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-24 border-y border-white/10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              Multiple Ways to <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">Reach Us</span>
            </h2>
            <p className="text-xl text-blue-200/80 max-w-3xl mx-auto">
              Choose the contact method that works best for you. We're available 24/7 to assist with your medical transcription needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-white/5 backdrop-blur-xl border border-white/20 hover:bg-white/10 transition-all text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl mb-2">Phone Support</CardTitle>
                <CardDescription className="text-blue-200/70">
                  Speak directly with our support team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-2xl font-bold text-white">+1 (555) 123-4567</div>
                  <p className="text-blue-200/70 text-sm">Available 24/7</p>
                  <p className="text-blue-200/70 text-sm">Average response: &lt; 2 minutes</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border border-white/20 hover:bg-white/10 transition-all text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl mb-2">Email Support</CardTitle>
                <CardDescription className="text-blue-200/70">
                  Send us a detailed message
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-lg font-semibold text-white">hello@healthscribe.pro</div>
                  <p className="text-blue-200/70 text-sm">Response within 4 hours</p>
                  <p className="text-blue-200/70 text-sm">For technical issues and billing</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border border-white/20 hover:bg-white/10 transition-all text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl mb-2">Live Chat</CardTitle>
                <CardDescription className="text-blue-200/70">
                  Instant chat support on our website
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-lg font-semibold text-white">Available 24/7</div>
                  <p className="text-blue-200/70 text-sm">Instant response</p>
                  <p className="text-blue-200/70 text-sm">Perfect for quick questions</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl mb-2">Send us a Message</CardTitle>
                <CardDescription className="text-blue-200/70">
                  Fill out the form below and we'll get back to you within 4 hours
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-white">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        className="bg-white/5 border-white/20 text-white placeholder:text-blue-200/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-white">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        className="bg-white/5 border-white/20 text-white placeholder:text-blue-200/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.doe@hospital.com"
                      className="bg-white/5 border-white/20 text-white placeholder:text-blue-200/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organization" className="text-white">Organization/Hospital</Label>
                    <Input
                      id="organization"
                      placeholder="City General Hospital"
                      className="bg-white/5 border-white/20 text-white placeholder:text-blue-200/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="inquiryType" className="text-white">Inquiry Type</Label>
                    <Select>
                      <SelectTrigger className="bg-white/5 border-white/20 text-white">
                        <SelectValue placeholder="Select inquiry type" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-white/20">
                        <SelectItem value="general" className="text-white">General Information</SelectItem>
                        <SelectItem value="technical" className="text-white">Technical Support</SelectItem>
                        <SelectItem value="billing" className="text-white">Billing & Pricing</SelectItem>
                        <SelectItem value="demo" className="text-white">Product Demo</SelectItem>
                        <SelectItem value="partnership" className="text-white">Partnership Opportunities</SelectItem>
                        <SelectItem value="other" className="text-white">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-white">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us about your medical transcription needs..."
                      rows={5}
                      className="bg-white/5 border-white/20 text-white placeholder:text-blue-200/50"
                    />
                  </div>

                  <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 gap-2">
                    <Send className="h-4 w-4" />
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-8">
              <Card className="bg-white/5 backdrop-blur-xl border border-white/20">
                <CardHeader>
                  <CardTitle className="text-white text-xl mb-2">Office Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-6 w-6 text-blue-300" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">Headquarters</h3>
                      <p className="text-blue-200/70">
                        123 Medical Tech Drive<br />
                        San Francisco, CA 94105<br />
                        United States
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="h-6 w-6 text-green-300" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">Business Hours</h3>
                      <p className="text-blue-200/70">
                        Monday - Friday: 9:00 AM - 6:00 PM PST<br />
                        Saturday: 10:00 AM - 4:00 PM PST<br />
                        Sunday: Closed<br />
                        <span className="text-green-300 font-medium">Emergency support: 24/7</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-6 w-6 text-purple-300" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">Regional Offices</h3>
                      <p className="text-blue-200/70">
                        New York, NY<br />
                        Chicago, IL<br />
                        Houston, TX<br />
                        Seattle, WA
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-xl border border-white/20">
                <CardHeader>
                  <CardTitle className="text-white text-xl mb-2">Department Contacts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Users className="h-4 w-4 text-blue-300" />
                      </div>
                      <span className="text-white font-medium">Sales</span>
                    </div>
                    <div className="text-blue-200/70 text-sm">sales@healthscribe.pro</div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <Headphones className="h-4 w-4 text-green-300" />
                      </div>
                      <span className="text-white font-medium">Support</span>
                    </div>
                    <div className="text-blue-200/70 text-sm">support@healthscribe.pro</div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-purple-300" />
                      </div>
                      <span className="text-white font-medium">Enterprise</span>
                    </div>
                    <div className="text-blue-200/70 text-sm">enterprise@healthscribe.pro</div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                        <Globe className="h-4 w-4 text-orange-300" />
                      </div>
                      <span className="text-white font-medium">Partnerships</span>
                    </div>
                    <div className="text-blue-200/70 text-sm">partners@healthscribe.pro</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 border-y border-white/10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              Frequently Asked <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">Questions</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="bg-white/5 backdrop-blur-xl border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">How quickly can I get started?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-200/70">
                  You can start your free trial immediately after signing up. The onboarding process takes less than 5 minutes, and you can begin transcribing right away.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">Is my data secure and HIPAA compliant?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-200/70">
                  Yes, we are fully HIPAA compliant and SOC 2 Type II certified. All data is encrypted in transit and at rest with enterprise-grade security measures.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">What file formats do you support?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-200/70">
                  We support all major audio formats including MP3, WAV, M4A, AAC, OGG, WebM, and FLAC. Video files are also supported with audio extraction.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">Do you offer custom integrations?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-200/70">
                  Yes! We offer API access and can integrate with major EMR systems including Epic, Cerner, and Allscripts. Contact our enterprise team for custom solutions.
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
                Need Immediate
                <span className="block bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                  Assistance?
                </span>
              </h2>
              <p className="text-xl text-blue-200/80 mb-8 max-w-3xl mx-auto">
                Our support team is standing by to help you get started with Healthscribe Pro or answer any questions you may have.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-xl shadow-blue-500/25 gap-2">
                  <Phone className="h-5 w-5" />
                  Call +1 (555) 123-4567
                </Button>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 backdrop-blur gap-2">
                    <Play className="h-5 w-5" />
                    Start Free Trial
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
              <h3 className="text-white font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-blue-200/70">
                <li><Link href="/services" className="hover:text-white transition-colors">Real-Time Transcription</Link></li>
                <li><Link href="/services" className="hover:text-white transition-colors">Batch Processing</Link></li>
                <li><Link href="/services" className="hover:text-white transition-colors">Specialty Services</Link></li>
                <li><Link href="/services" className="hover:text-white transition-colors">Enterprise Solutions</Link></li>
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
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <Separator className="my-8 bg-white/10" />

          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-blue-200/60">
              © 2024 Healthscribe Pro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
