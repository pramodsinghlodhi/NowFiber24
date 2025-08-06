
'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LifeBuoy, Book, Mail, Phone, MessageSquare } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqItems = [
    {
        question: "How do I reset my password?",
        answer: "You can reset your password by contacting your system administrator. For security reasons, technicians cannot reset their own passwords."
    },
    {
        question: "How do I check in for a task?",
        answer: "Navigate to the 'Tasks' page. For any 'In Progress' or 'Pending' task, you will see a 'Check In' button. You must be within 100 meters of the job site for the check-in to be successful."
    },
    {
        question: "What do the different device statuses mean?",
        answer: "'Online' means the device is connected and responding. 'Offline' means the device is not reachable by the monitoring system. 'Maintenance' means the device is intentionally offline for scheduled work."
    },
    {
        question: "How does the AI Materials Analyzer work?",
        answer: "After completing a task, you can upload a photo of the materials used. The AI will analyze the image to identify items and quantities, helping to automatically update inventory and track usage against what was issued."
    }
]

export default function SupportPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

   if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Support & Help Center</h2>
                <p className="text-muted-foreground">Find answers to your questions or get in touch with our support team.</p>
            </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
                 <Card>
                    <CardHeader>
                        <CardTitle>Frequently Asked Questions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            {faqItems.map((item, index) => (
                                <AccordionItem value={`item-${index}`} key={index}>
                                    <AccordionTrigger>{item.question}</AccordionTrigger>
                                    <AccordionContent>
                                        {item.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>
            </div>
             <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Contact Support</CardTitle>
                        <CardDescription>Can't find an answer? Reach out to us.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button className="w-full justify-start">
                            <Mail className="mr-2" />
                            Email Support
                        </Button>
                         <Button className="w-full justify-start">
                            <Phone className="mr-2" />
                            Call Help Desk
                        </Button>
                         <Button className="w-full justify-start">
                            <MessageSquare className="mr-2" />
                            Start Live Chat
                        </Button>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Documentation</CardTitle>
                        <CardDescription>Browse our comprehensive guides and manuals.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="w-full justify-start">
                            <Book className="mr-2" />
                            View Documentation
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    </main>
  );
}
