
"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { ContactSubmission } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash, Check, Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const getStatusBadge = (status: ContactSubmission['status']) => {
  switch (status) {
    case 'In Progress':
      return <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 border-blue-400">In Progress</Badge>;
    case 'Resolved':
      return <Badge variant="secondary" className="bg-green-500/20 text-green-700 border-green-400">Resolved</Badge>;
    case 'Pending':
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
};

export default function ContactSubmissionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'Admin') {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const contactsQuery = useMemo(() => query(collection(db, 'contacts'), orderBy('timestamp', 'desc')), []);
  const { data: submissions, loading: loadingSubmissions } = useFirestoreQuery<ContactSubmission>(contactsQuery);

  const handleStatusChange = async (submissionId: string, newStatus: ContactSubmission['status']) => {
    try {
        const docRef = doc(db, 'contacts', submissionId);
        await updateDoc(docRef, { status: newStatus });
        toast({ title: 'Status Updated', description: `Submission status changed to ${newStatus}.` });
    } catch (error) {
        toast({ title: "Error", description: "Could not update status.", variant: "destructive" });
    }
  }

  const handleDeleteClick = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    setIsDeleteAlertOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    if (!selectedSubmission) return;
    try {
      await deleteDoc(doc(db, "contacts", selectedSubmission.id));
      toast({
        title: "Submission Deleted",
        description: `The message from ${selectedSubmission.name} has been deleted.`,
        variant: "destructive"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not delete the submission.",
        variant: "destructive"
      });
    } finally {
      setIsDeleteAlertOpen(false);
      setSelectedSubmission(null);
    }
  };

  const renderTimestamp = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      if (isNaN(date.getTime())) {
         return 'Invalid Date';
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
        console.error("Error formatting timestamp:", error);
        return 'Invalid Date';
    }
  };

  const loading = authLoading || loadingSubmissions;

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Loading Submissions...</p>
      </div>
    );
  }

  return (
    <>
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Card>
        <CardHeader>
          <CardTitle>Contact Form Submissions</CardTitle>
          <CardDescription>Messages from the "Get in Touch with Us" form.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <div className="font-medium">{submission.name}</div>
                    <div className="text-sm text-muted-foreground">{submission.email}</div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{submission.message}</TableCell>
                  <TableCell>{renderTimestamp(submission.timestamp)}</TableCell>
                  <TableCell>{getStatusBadge(submission.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStatusChange(submission.id, 'In Progress')}>
                          <Loader className="mr-2 h-4 w-4" />
                          Mark as In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(submission.id, 'Resolved')}>
                          <Check className="mr-2 h-4 w-4" />
                          Mark as Resolved
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteClick(submission)} className="text-destructive">
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
               {submissions.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No submissions yet.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this contact submission.
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

    