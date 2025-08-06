
"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { ProofOfWork, Task, Technician } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection, query, orderBy, doc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertTriangle, MoreVertical, Trash2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function ProofOfWorkPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedProof, setSelectedProof] = useState<ProofOfWork | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isNoticeDialogOpen, setIsNoticeDialogOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState('');

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

  const handleDeleteClick = (proof: ProofOfWork) => {
    setSelectedProof(proof);
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProof) return;
    try {
      await deleteDoc(doc(db, "proofOfWork", selectedProof.id));
      toast({
        title: "Report Deleted",
        description: `The proof of work for task #${selectedProof.taskId} has been deleted.`,
        variant: "destructive"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not delete the report.",
        variant: "destructive"
      });
    } finally {
      setIsDeleteAlertOpen(false);
      setSelectedProof(null);
    }
  };

  const handleNoticeClick = (proof: ProofOfWork) => {
    setSelectedProof(proof);
    setIsNoticeDialogOpen(true);
  };
  
  const handleSendNotice = async () => {
    if (!selectedProof || !noticeMessage) return;
    try {
      // In a real app, this would create a notification in a dedicated 'notifications' collection
      // For this demo, we'll just show a success toast.
      toast({
        title: "Notice Sent",
        description: `A notification has been sent to the technician regarding task #${selectedProof.taskId}.`,
      });
    } catch (error) {
       toast({
        title: "Error",
        description: "Could not send the notice.",
        variant: "destructive"
      });
    } finally {
      setIsNoticeDialogOpen(false);
      setSelectedProof(null);
      setNoticeMessage('');
    }
  };

  const handleImageClick = (proof: ProofOfWork) => {
    setSelectedProof(proof);
    setIsLightboxOpen(true);
  }

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Loading Proof of Work...</p>
      </div>
    );
  }

  return (
    <>
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
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{task?.title || 'Unknown Task'}</CardTitle>
                        <CardDescription>
                          Submitted by {tech?.name || 'Unknown'} on {renderTimestamp(proof.timestamp)}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                           </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuItem onClick={() => handleNoticeClick(proof)}>
                                <Send className="mr-2 h-4 w-4" />
                                Send Notice
                           </DropdownMenuItem>
                           <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(proof)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Report
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative aspect-video w-full cursor-pointer" onClick={() => handleImageClick(proof)}>
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

    {/* Lightbox Dialog */}
    <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-4xl h-[90vh] p-2" onPointerDownOutside={(e) => e.preventDefault()}>
            {selectedProof && (
                 <Image src={selectedProof.imageDataUri} alt="Lightbox" layout="fill" objectFit="contain" className="rounded-md" />
            )}
             <DialogClose className="absolute top-2 right-2 bg-background/50 text-foreground rounded-full" />
        </DialogContent>
    </Dialog>

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the proof of work report
                from the database.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
                Delete
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

    