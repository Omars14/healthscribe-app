import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Stethoscope,
  FileText,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Twitter,
  Github,
  Globe
} from 'lucide-react'

export const metadata = {
  title: "Terms of Service - Healthscribe.pro",
  description: "Healthscribe.pro Terms of Service - Read our terms and conditions for using our AI-powered medical transcription platform."
}

export default function TermsOfService() {
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

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-blue-500/20 text-blue-300 border-blue-400/30 px-4 py-2">
              <FileText className="h-4 w-4 mr-2" />
              Terms of Service
            </Badge>

            <h1 className="text-6xl md:text-7xl font-bold mb-8">
              <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                Terms of
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                Service
              </span>
            </h1>

            <p className="text-xl text-blue-100/80 leading-relaxed max-w-3xl mx-auto">
              Please read these terms carefully before using Healthscribe Pro's AI-powered medical transcription services.
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
            {/* Acceptance of Terms */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl mb-2">1. Acceptance of Terms</CardTitle>
                <CardDescription className="text-blue-200/70">
                  By accessing and using Healthscribe Pro, you agree to these terms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-blue-200/70">
                  These Terms of Service ("Terms") govern your access to and use of Healthscribe Pro's AI-powered medical transcription platform and related services. By registering for, accessing, or using our services, you agree to be bound by these Terms.
                </p>
                <p className="text-blue-200/70">
                  If you do not agree to these Terms, please do not use our services. Your continued use of Healthscribe Pro constitutes acceptance of any updates or modifications to these Terms.
                </p>
              </CardContent>
            </Card>

            {/* Service Description */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl mb-2">2. Service Description</CardTitle>
                <CardDescription className="text-blue-200/70">
                  Healthscribe Pro provides AI-powered medical transcription services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-blue-200/70">
                  Healthscribe Pro offers cloud-based AI-powered medical transcription services designed specifically for healthcare professionals. Our platform converts audio recordings into formatted medical documents using advanced artificial intelligence technology.
                </p>

                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">Our Services Include</h3>
                  <ul className="space-y-2 text-blue-200/70">
                    <li>• Real-time transcription during medical consultations</li>
                    <li>• Batch processing of recorded audio files</li>
                    <li>• Medical terminology recognition and formatting</li>
                    <li>• Integration with Electronic Medical Record systems</li>
                    <li>• Secure storage and retrieval of transcriptions</li>
                    <li>• Quality assurance and accuracy verification</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* User Accounts and Registration */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl mb-2">3. User Accounts and Registration</CardTitle>
                <CardDescription className="text-blue-200/70">
                  Requirements for creating and maintaining user accounts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">Account Creation</h3>
                  <ul className="space-y-2 text-blue-200/70">
                    <li>• You must be at least 18 years old to create an account</li>
                    <li>• You must provide accurate and complete registration information</li>
                    <li>• You are responsible for maintaining the confidentiality of your account credentials</li>
                    <li>• You must notify us immediately of any unauthorized use of your account</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">Healthcare Professional Verification</h3>
                  <ul className="space-y-2 text-blue-200/70">
                    <li>• Medical professionals may be required to verify their credentials</li>
                    <li>• Institutional accounts require verification of affiliation</li>
                    <li>• We reserve the right to suspend accounts pending verification</li>
                    <li>• False representation of credentials may result in account termination</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Acceptable Use Policy */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl mb-2">4. Acceptable Use Policy</CardTitle>
                <CardDescription className="text-blue-200/70">
                  Guidelines for appropriate use of our services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">Permitted Uses</h3>
                  <ul className="space-y-2 text-blue-200/70">
                    <li>• Medical transcription for legitimate healthcare purposes</li>
                    <li>• Professional documentation of patient encounters</li>
                    <li>• Educational and training purposes within healthcare</li>
                    <li>• Quality improvement and research activities</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">Prohibited Uses</h3>
                  <ul className="space-y-2 text-blue-200/70">
                    <li>• Any illegal or unauthorized purpose</li>
                    <li>• Transcribing non-medical content</li>
                    <li>• Sharing PHI with unauthorized individuals</li>
                    <li>• Attempting to reverse engineer or hack our systems</li>
                    <li>• Using the service to violate patient privacy rights</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Intellectual Property */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl mb-2">5. Intellectual Property</CardTitle>
                <CardDescription className="text-blue-200/70">
                  Rights and ownership of content and technology
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">Our Intellectual Property</h3>
                  <p className="text-blue-200/70 mb-4">
                    Healthscribe Pro retains all rights, title, and interest in our platform, software, algorithms, and related technology. This includes:
                  </p>
                  <ul className="space-y-2 text-blue-200/70">
                    <li>• AI models and transcription algorithms</li>
                    <li>• Software code and platform architecture</li>
                    <li>• User interface designs and branding</li>
                    <li>• Documentation and help materials</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">Your Content</h3>
                  <p className="text-blue-200/70 mb-4">
                    You retain ownership of your original audio recordings and the resulting transcriptions. However, you grant us:
                  </p>
                  <ul className="space-y-2 text-blue-200/70">
                    <li>• Limited license to process and store your content</li>
                    <li>• Permission to use anonymized data to improve our services</li>
                    <li>• Right to maintain backup copies for disaster recovery</li>
                    <li>• License to display transcriptions within your account</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Privacy and Data Protection */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl mb-2">6. Privacy and Data Protection</CardTitle>
                <CardDescription className="text-blue-200/70">
                  Our commitment to protecting your healthcare information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-blue-200/70">
                  Your privacy is paramount. We are fully compliant with HIPAA, GDPR, and other relevant privacy regulations. Our comprehensive privacy practices are detailed in our Privacy Policy.
                </p>

                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">Key Privacy Commitments</h3>
                  <ul className="space-y-2 text-blue-200/70">
                    <li>• We never sell your personal or healthcare information</li>
                    <li>• Protected Health Information (PHI) is encrypted at rest and in transit</li>
                    <li>• Access to PHI is restricted to authorized personnel only</li>
                    <li>• Regular security audits and compliance assessments</li>
                    <li>• Business Associate Agreements available for enterprise customers</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Billing and Payment */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl mb-2">7. Billing and Payment Terms</CardTitle>
                <CardDescription className="text-blue-200/70">
                  Payment terms, billing cycles, and refund policies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">Billing Cycle</h3>
                  <ul className="space-y-2 text-blue-200/70">
                    <li>• Monthly plans are billed on the same date each month</li>
                    <li>• Annual plans are billed upfront for the entire year</li>
                    <li>• Payment is due within 15 days of invoice date</li>
                    <li>• Late payments may result in service suspension</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">Overage Charges</h3>
                  <ul className="space-y-2 text-blue-200/70">
                    <li>• Basic and Professional plans: $0.50 per additional transcription hour</li>
                    <li>• Overage charges are billed monthly in arrears</li>
                    <li>• Enterprise plans include unlimited hours at a fixed rate</li>
                    <li>• You will be notified before overage charges are applied</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">Refund Policy</h3>
                  <ul className="space-y-2 text-blue-200/70">
                    <li>• 30-day money-back guarantee for new customers</li>
                    <li>• Prorated refunds for annual plans cancelled mid-cycle</li>
                    <li>• Refunds are processed within 5-10 business days</li>
                    <li>• Custom enterprise agreements may have different terms</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Service Availability and Support */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl mb-2">8. Service Availability and Support</CardTitle>
                <CardDescription className="text-blue-200/70">
                  Uptime guarantees and support commitments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">Service Availability</h3>
                  <ul className="space-y-2 text-blue-200/70">
                    <li>• 99.5% uptime guarantee for our platform</li>
                    <li>• Scheduled maintenance windows are communicated in advance</li>
                    <li>• Emergency maintenance may be performed with minimal notice</li>
                    <li>• Service credits available for downtime exceeding SLA</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">Support Levels</h3>
                  <ul className="space-y-2 text-blue-200/70">
                    <li>• <strong>Basic Plan:</strong> Email support, 24-hour response time</li>
                    <li>• <strong>Professional Plan:</strong> Priority email support, 4-hour response time</li>
                    <li>• <strong>Enterprise Plan:</strong> 24/7 phone and email support, dedicated account manager</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Limitation of Liability */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl mb-2">9. Limitation of Liability</CardTitle>
                <CardDescription className="text-blue-200/70">
                  Important disclaimers and liability limitations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-blue-200/70">
                  Healthscribe Pro provides AI-powered transcription services but does not replace professional medical judgment or clinical decision-making. Our service is intended to assist healthcare professionals, not to substitute for their expertise.
                </p>

                <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-4">
                  <p className="text-yellow-200 font-semibold mb-2">Important Disclaimer</p>
                  <p className="text-yellow-200/80 text-sm">
                    Always review and verify transcriptions for accuracy before incorporating them into patient records. Healthcare providers remain responsible for the accuracy of all medical documentation.
                  </p>
                </div>

                <p className="text-blue-200/70">
                  In no event shall Healthscribe Pro be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with the use of our services.
                </p>
              </CardContent>
            </Card>

            {/* Termination */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl mb-2">10. Termination</CardTitle>
                <CardDescription className="text-blue-200/70">
                  Account termination and service discontinuation policies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">Termination by User</h3>
                  <ul className="space-y-2 text-blue-200/70">
                    <li>• You may cancel your subscription at any time</li>
                    <li>• Access to paid features ends at the next billing cycle</li>
                    <li>• Data export tools are available for 30 days after cancellation</li>
                    <li>• Account deletion is permanent and cannot be undone</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">Termination by Healthscribe Pro</h3>
                  <ul className="space-y-2 text-blue-200/70">
                    <li>• We may terminate accounts for violation of these Terms</li>
                    <li>• 30 days notice provided for service discontinuation</li>
                    <li>• Refund of unused portion of prepaid services</li>
                    <li>• Reasonable time to export data before account closure</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Governing Law */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl mb-2">11. Governing Law and Dispute Resolution</CardTitle>
                <CardDescription className="text-blue-200/70">
                  Legal jurisdiction and dispute resolution procedures
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-blue-200/70">
                  These Terms are governed by the laws of the State of California, United States, without regard to conflict of law principles.
                </p>

                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">Dispute Resolution</h3>
                  <ul className="space-y-2 text-blue-200/70">
                    <li>• We encourage users to contact us first to resolve any disputes</li>
                    <li>• Most issues can be resolved through our support channels</li>
                    <li>• Formal disputes are subject to binding arbitration</li>
                    <li>• Class action lawsuits are prohibited by these Terms</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl mb-2">12. Contact Information</CardTitle>
                <CardDescription className="text-blue-200/70">
                  How to reach us regarding these Terms of Service
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-white font-semibold mb-2">Legal Department</h3>
                    <p className="text-blue-200/70">
                      Email: legal@healthscribe.pro<br />
                      Phone: +1 (555) 123-4567<br />
                      Address: 123 Medical Tech Drive, San Francisco, CA 94105
                    </p>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2">General Support</h3>
                    <p className="text-blue-200/70">
                      For questions about these Terms or our services:<br />
                      Email: support@healthscribe.pro<br />
                      Phone: +1 (555) 123-4567
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
