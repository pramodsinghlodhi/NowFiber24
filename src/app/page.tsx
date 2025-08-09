
'use client';

import { Button } from '@/components/ui/button';
import Logo from '@/components/icons/logo';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ArrowRight, Wifi, ShieldCheck, Wrench, Users, BarChart, Send, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) {
  return (
    <Card className="text-center p-6">
      <div className="flex justify-center mb-4">
        <div className="bg-primary/10 text-primary p-3 rounded-full">
          <Icon className="h-8 w-8" />
        </div>
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </Card>
  )
}


export default function LandingPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, loading } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formValues, setFormValues] = useState({ name: '', email: '', message: '' });

    useEffect(() => {
        if (!loading && user) {
            router.push('/dashboard');
        }
    }, [user, loading, router]);
    
     const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
          await addDoc(collection(db, 'contacts'), {
            ...formValues,
            status: 'Pending',
            timestamp: new Date(),
          });
          toast({
              title: 'Message Sent!',
              description: "Thanks for reaching out. We'll get back to you shortly.",
          });
          setFormValues({ name: '', email: '', message: '' });
        } catch (error) {
            toast({
                title: 'Error',
                description: "Could not send your message. Please try again later.",
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormValues(prev => ({ ...prev, [id.replace('contact-','')]: value }));
    }
    
    // This page should be visible to everyone, we only redirect if the user is already logged in.
    // Thus, we don't need a loading state here that hides the content.

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="px-4 lg:px-6 h-16 flex items-center fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
        <Link href="#" className="flex items-center justify-center">
          <Logo className="h-6 w-6 text-primary" />
          <span className="font-semibold ml-2">NowFiber24</span>
        </Link>
        <nav className="ml-auto hidden md:flex gap-4 sm:gap-6 items-center">
            <Link href="#about" className="text-sm font-medium hover:underline underline-offset-4">About</Link>
            <Link href="#services" className="text-sm font-medium hover:underline underline-offset-4">Services</Link>
            <Link href="#contact" className="text-sm font-medium hover:underline underline-offset-4">Contact</Link>
            <Button variant="default" onClick={() => router.push('/login')}>Login</Button>
        </nav>
        <Button variant="ghost" className="md:hidden ml-auto" onClick={() => router.push('/login')}>Login</Button>
      </header>
      
      <main className="flex-1 mt-16">
        {/* Hero Section */}
        <section id="home" className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-primary/5">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                    The Future of FTTH Network Management is Here
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    NowFiber24 is the all-in-one, AI-powered platform for ISPs to manage their fiber network, empower technicians,
                    and deliver exceptional service.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" onClick={() => router.push('/login')}>
                    Access Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
              <Image
                src="https://placehold.co/600x400.png"
                width="600"
                height="400"
                alt="Hero"
                data-ai-hint="network infrastructure technology"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full"
              />
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">About Us</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Powering the Next Generation of Connectivity</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  NowFiber24 was built from the ground up to address the complex challenges of modern FTTH network operations. We combine powerful management tools with cutting-edge AI to provide unparalleled visibility, efficiency, and control for ISPs and their field teams.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-background px-3 py-1 text-sm">Our Services</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">A Unified Platform for Peak Performance</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  From the central office to the customer premise, NowFiber24 provides the tools you need to build, manage, and maintain a world-class fiber network.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-3 mt-12">
              <FeatureCard 
                icon={Wifi}
                title="Real-Time Network Monitoring"
                description="Get a live GIS view of your entire infrastructure, technician locations, and critical alerts on an interactive map."
              />
              <FeatureCard 
                icon={Wrench}
                title="Advanced Technician Tools"
                description="Empower your field team with mobile task management, AI-powered proof-of-work, and instant material requests."
              />
              <FeatureCard 
                icon={ShieldCheck}
                title="AI-Powered Diagnostics"
                description="Leverage AI for automated fault detection and physical fiber path tracing to resolve issues faster than ever before."
              />
               <FeatureCard 
                icon={Users}
                title="Team & Task Management"
                description="Efficiently manage technicians, create and assign tasks, and track job progress from a centralized dashboard."
              />
               <FeatureCard 
                icon={BarChart}
                title="Comprehensive Reporting"
                description="Generate detailed reports on technician performance, alert history, and task completion rates to make data-driven decisions."
              />
               <FeatureCard 
                icon={Send}
                title="Seamless Communication"
                description="Keep your team in sync with system-wide broadcasts and real-time notifications for tasks, alerts, and announcements."
              />
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="w-full py-12 md:py-24 lg:py-32">
            <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
                <div className="space-y-3">
                    <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">Get in Touch with Us</h2>
                    <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        Have questions about our platform? We'd love to hear from you.
                    </p>
                </div>
                <div className="mx-auto w-full max-w-sm space-y-2">
                    <form className="grid grid-cols-1 gap-4" onSubmit={handleContactSubmit}>
                         <div className="space-y-2 text-left">
                            <Label htmlFor="contact-name">Name</Label>
                            <Input id="contact-name" placeholder="Your Name" required value={formValues.name} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2 text-left">
                            <Label htmlFor="contact-email">Email</Label>
                            <Input id="contact-email" type="email" placeholder="your.email@company.com" required value={formValues.email} onChange={handleInputChange} />
                        </div>
                         <div className="space-y-2 text-left">
                            <Label htmlFor="contact-message">Message</Label>
                            <Textarea id="contact-message" placeholder="How can we help you?" required value={formValues.message} onChange={handleInputChange} />
                        </div>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : 'Send Message'}
                        </Button>
                    </form>
                </div>
            </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 NowFiber24. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4">Terms of Service</Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4">Privacy</Link>
        </nav>
      </footer>
    </div>
  )
}

    