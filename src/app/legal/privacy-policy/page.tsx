import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Stethoscope,
  Shield,
  Lock,
  Eye,
  FileText,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Twitter,
  Github
} from 'lucide-react'

export const metadata = {
  title: "Privacy Policy - Healthscribe.pro",
  description: "Healthscribe.pro Privacy Policy - Learn how we protect your healthcare data and maintain HIPAA compliance."
}

export default function PrivacyPolicy() {
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
            <Badge className="mb-6 bg-green-500/20 text-green-300 border-green-400/30 px-4 py-2">
              <Shield className="h-4 w-4 mr-2" />
              Privacy Policy
            </Badge>

            <h1 className="text-6xl md:text-7xl font-bold mb-8">
              <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                Your Privacy
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                Our Priority
              </span>
            </h1>

            <p className="text-xl text-blue-100/80 leading-relaxed max-w-3xl mx-auto">
              At Healthscribe Pro, we are committed to protecting your healthcare information with the highest standards of privacy and security.
            </p>

            <div className="flex items-center justify-center gap-4 mt-8 text-sm text-blue-200/70">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Last Updated: September 21, 2024</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto space-y-12">
            {/* Information We Collect */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl mb-2">1. Information We Collect</CardTitle>
                <CardDescription className="text-blue-200/70">
                  We collect information necessary to provide our medical transcription services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">Personal Information</h3>
                  <ul className="space-y-2 text-blue-200/70">
                    <li>• Name, email address, and contact information</li>
                    <li>• Professional credentials and medical specialty</li>
                    <li>• Billing and payment information</li>
                    <li>• Account preferences and settings</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">Healthcare Data</h3>
                  <ul className="space-y-2 text-blue-200/70">
                    <li>• Audio recordings submitted for transcription</li>
                    <li>• Transcribed medical documents and reports</li>
                    <li>• Metadata associated with transcription requests</li>
                    <li>• Usage patterns and service utilization data</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">Technical Information</h3>
                  <ul className="space-y-2 text-blue-200/70">
                    <li>• Device information and browser details</li>
                    <li>• IP addresses and location data</li>
                    <li>• Log files and usage analytics</li>
                    <li>• Cookies and tracking technologies</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* How We Use Information */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl mb-2">2. How We Use Your Information</CardTitle>
                <CardDescription className="text-blue-200/70">
                  We use collected information to provide and improve our services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">Service Provision</h3>
                  <ul className="space-y-2 text-blue-200/70">
                    <li>• Process audio files and generate transcriptions</li>
                    <li>• Maintain account security and access control</li>
                    <li>• Provide customer support and technical assistance</li>
                    <li>• Process billing and manage subscriptions</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">Service Improvement</h3>
                  <ul className="space-y-2 text-blue-200/70">
                    <li>• Analyze usage patterns to enhance features</li>
                    <li>• Improve AI accuracy through machine learning</li>
                    <li>• Develop new services and functionality</li>
                    <li>• Conduct quality assurance and testing</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">Legal Compliance</h3>
                  <ul className="space-y-2 text-blue-200/70">
                    <li>• Comply with HIPAA and other healthcare regulations</li>
                    <li>• Maintain audit trails for compliance purposes</li>
                    <li>• Respond to legal requests and investigations</li>
                    <li>• Protect against fraud and abuse</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Information Sharing */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl mb-2">3. Information Sharing and Disclosure</CardTitle>
                <CardDescription className="text-blue-200/70">
                  We do not sell your personal information and limit sharing to essential services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">We Share Information With</h3>
                  <ul className="space-y-2 text-blue-200/70">
                    <li>• <strong>Service Providers:</strong> Third-party vendors who assist with our operations</li>
                    <li>• <strong>Business Partners:</strong> Integration partners and EMR system providers</li>
                    <li>• <strong>Legal Authorities:</strong> When required by law or legal process</li>
                    <li>• <strong>Professional Advisors:</strong> Lawyers, accountants, and consultants</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">We Do NOT</h3>
                  <ul className="space-y-2 text-blue-200/70">
                    <li>• Sell your personal or healthcare information</li>
                    <li>• Share data for marketing purposes without consent</li>
                    <li>• Use healthcare data for advertising</li>
                    <li>• Transfer data to third parties without a legitimate business need</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Data Security */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl mb-2">4. Data Security and Protection</CardTitle>
                <CardDescription className="text-blue-200/70">
                  We implement industry-leading security measures to protect your information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">Security Measures</h3>
                  <ul className="space-y-2 text-blue-200/70">
                    <li>• End-to-end encryption for all data transmission</li>
                    <li>• AES-256 encryption for data at rest</li>
                    <li>• Multi-factor authentication for all accounts</li>
                    <li>• Regular security audits and penetration testing</li>
                    <li>• SOC 2 Type II compliance certification</li>
                    <li>• HIPAA-compliant infrastructure</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">Data Retention</h3>
                  <ul className="space-y-2 text-blue-200/70">
                    <li>• Audio files are automatically deleted after 30 days</li>
                    <li>• Transcriptions are retained per your account settings</li>
                    <li>• Account data is retained until account deletion</li>
                    <li>• Legal holds may extend retention when required</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Your Rights */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl mb-2">5. Your Privacy Rights</CardTitle>
                <CardDescription className="text-blue-200/70">
                  You have control over your data and can exercise various privacy rights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">You Can</h3>
                  <ul className="space-y-2 text-blue-200/70">
                    <li>• Access and review your personal information</li>
                    <li>• Correct inaccurate or incomplete data</li>
                    <li>• Request deletion of your data</li>
                    <li>• Export your data in a portable format</li>
                    <li>• Opt-out of non-essential communications</li>
                    <li>• Restrict processing of your information</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">How to Exercise Your Rights</h3>
                  <p className="text-blue-200/70 mb-4">
                    To exercise any of these rights, please contact us using the information provided below.
                    We will respond to your request within 30 days.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* International Transfers */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl mb-2">6. International Data Transfers</CardTitle>
                <CardDescription className="text-blue-200/70">
                  Information about cross-border data transfers and protections
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-blue-200/70">
                  Healthscribe Pro operates globally and may transfer your information to countries other than your own.
                  When we transfer data internationally, we ensure appropriate safeguards are in place:
                </p>
                <ul className="space-y-2 text-blue-200/70">
                  <li>• Standard Contractual Clauses approved by the European Commission</li>
                  <li>• Adequacy decisions for transfers to approved countries</li>
                  <li>• Additional technical and organizational measures</li>
                  <li>• Regular compliance assessments and audits</li>
                </ul>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl mb-2">7. Contact Us</CardTitle>
                <CardDescription className="text-blue-200/70">
                  Questions about this Privacy Policy or our privacy practices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-white font-semibold mb-2">Privacy Officer</h3>
                    <p className="text-blue-200/70">
                      Email: privacy@healthscribe.pro<br />
                      Phone: +1 (555) 123-4567<br />
                      Address: 123 Medical Tech Drive, San Francisco, CA 94105
                    </p>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2">Data Protection Officer</h3>
                    <p className="text-blue-200/70">
                      Email: dpo@healthscribe.pro<br />
                      For EU data subjects regarding GDPR rights
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
