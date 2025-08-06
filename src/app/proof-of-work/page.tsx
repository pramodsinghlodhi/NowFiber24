
"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { useAuth } from '@/contexts/auth-context';
import { ProofOfWork, Task, Technician } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertTriangle } from 'lucide-react';

export default function ProofOfWorkPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'Admin') {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const proofQuery = useMemo(() => query(collection(db, 'proofOfWork'), orderBy('timestamp', 'desc')), []);
  const techniciansQuery = useMemo(() => collection(db, 'technicians'), []);
  const tasksQuery = useMemo(() => collection(db, 'tasks'), []);

  const { data: proofs, loading: loadingProofs } = useFirestoreQuery<ProofOfWork>(proofQuery);
  const { data: technicians, loading: loadingTechs } = useFirestoreQuery<Technician>(techniciansQuery);
  const { data: tasks, loading: loadingTasks } = useFirestoreQuery<Task>(tasksQuery);

  const loading = authLoading || loadingProofs || loadingTechs || loadingTasks;

  const renderTimestamp = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return format(date, 'MMM dd, yyyy - HH:mm:ss');
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return 'Invalid Date';
    }
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Loading Proof of Work...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Proof of Work Submissions</CardTitle>
              <CardDescription>Review photos and AI analysis from completed tasks.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {proofs.map(proof => {
                  const tech = technicians.find(t => t.id === proof.technicianId);
                  const task = tasks.find(t => t.id === proof.taskId);
                  const result = proof.analysisResult;

                  return (
                    <Card key={proof.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{task?.title || 'Unknown Task'}</CardTitle>
                        <CardDescription>
                          Submitted by {tech?.name || 'Unknown'} on {renderTimestamp(proof.timestamp)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="relative aspect-video w-full">
                          <Image src={proof.imageDataUri} alt={`Proof for task ${proof.taskId}`} layout="fill" objectFit="cover" className="rounded-md border" />
                        </div>

                        <Accordion type="single" collapsible>
                          <AccordionItem value="analysis">
                            <AccordionTrigger>View AI Analysis</AccordionTrigger>
                            <AccordionContent className="space-y-4">
                               {result.unauthorizedItems?.length > 0 && (
                                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                                    <h4 className="font-semibold text-destructive flex items-center gap-2"><AlertTriangle size={16}/> Unauthorized Items</h4>
                                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                                        {result.unauthorizedItems.map((item: any, index: number) => (
                                            <li key={index}>
                                                <strong>{item.item}:</strong> {item.reason}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                               )}
                               <div>
                                  <h4 className="font-semibold mb-2 text-sm">Materials Used:</h4>
                                  <ul className="list-disc list-inside space-y-1 text-sm">
                                    {result.materialsUsed?.map((item: any, index: number) => (
                                      <li key={index}>
                                        {item.item}: <Badge variant="secondary">{item.quantity}</Badge>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2 text-sm">Missing Items:</h4>
                                  <ul className="list-disc list-inside space-y-1 text-sm">
                                    {result.missingItems?.length > 0 ? (
                                      result.missingItems.map((item: string, index: number) => (
                                        <li key={index}>{item}</li>
                                      ))
                                    ) : (
                                      <li className="text-muted-foreground">None</li>
                                    )}
                                  </ul>
                                </div>
                                 <div>
                                  <h4 className="font-semibold mb-2 text-sm">Notes:</h4>
                                  <p className="text-sm text-muted-foreground">{result.notes}</p>
                                </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </CardContent>
                    </Card>
                  );
                })}
                 {proofs.length === 0 && (
                    <p className="text-muted-foreground col-span-full text-center py-8">No Proof of Work submissions yet.</p>
                 )}
              </div>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
