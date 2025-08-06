

"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Referral, Technician } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, HardHat, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection, doc, updateDoc, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';


const getStatusBadge = (status: 'Pending' | 'Contacted' | 'Closed') => {
  switch (status) {
    case 'Contacted':
      return <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 border-blue-400">Contacted</Badge>;
    case 'Closed':
      return <Badge variant="secondary" className="bg-green-500/20 text-green-700 border-green-400">Closed</Badge>;
    case 'Pending':
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
};


export default function ReferralsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const referralsQuery = useMemo(() => query(collection(db, 'referrals'), orderBy('timestamp', 'desc')), []);
  const techniciansQuery = useMemo(() => collection(db, 'technicians'), []);

  const { data: referrals, loading: loadingReferrals } = useFirestoreQuery<Referral>(referralsQuery);
  const { data: technicians, loading: loadingTechs } = useFirestoreQuery<Technician>(techniciansQuery);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);
  
  const filteredReferrals = useMemo(() => {
    if (!user) return [];
    if (user.role === 'Admin') return referrals;
    return referrals.filter(r => r.tech_id === user.id);
  }, [user, referrals]);


  const handleStatusChange = async (referralId: string, newStatus: Referral['status']) => {
    const docRef = doc(db, 'referrals', referralId);
    try {
        await updateDoc(docRef, { status: newStatus });
        toast({ title: "Status Updated", description: `Referral status changed to ${newStatus}.` });
    } catch (error) {
        toast({ title: "Error", description: "Could not update status.", variant: "destructive"});
    }
  }

  const renderTimestamp = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      // Firestore Timestamps have a toDate() method
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return 'Invalid Date';
    }
  };

  const loading = authLoading || loadingReferrals || loadingTechs;

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer Referrals</CardTitle>
          <CardDescription>
            {user.role === 'Admin' ? 'View and manage all customer referrals from technicians.' : 'Track the status of your submitted referrals.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile View */}
            <div className="md:hidden space-y-4">
                {filteredReferrals.map((referral: Referral) => (
                    <Card key={referral.id} className="p-4 space-y-3">
                         <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold">{referral.customer_name}</p>
                                <p className="text-sm text-muted-foreground">{renderTimestamp(referral.timestamp)}</p>
                            </div>
                            {getStatusBadge(referral.status)}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1 pt-2 border-t">
                            <p className="flex items-center gap-2"><Phone size={14}/> {referral.phone}</p>
                            <p className="flex items-center gap-2"><MapPin size={14}/> {referral.address}</p>
                            {user.role === 'Admin' && (
                                 <p className="flex items-center gap-2"><HardHat size={14}/> {technicians.find(t => t.id === referral.tech_id)?.name || 'Unknown'}</p>
                            )}
                        </div>
                        {user.role === 'Admin' && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="w-full mt-2">
                                        Update Status
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-full">
                                    <DropdownMenuItem onClick={() => handleStatusChange(referral.id, 'Contacted')}>Mark as Contacted</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(referral.id, 'Closed')}>Mark as Closed</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(referral.id, 'Pending')}>Mark as Pending</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </Card>
                ))}
            </div>

          {/* Desktop View */}
          <Table className="hidden md:table">
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Date</TableHead>
                {user.role === 'Admin' && <TableHead>Referred By</TableHead>}
                <TableHead>Status</TableHead>
                {user.role === 'Admin' && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReferrals.map((referral: Referral) => (
                <TableRow key={referral.id}>
                  <TableCell className="font-medium">{referral.customer_name}</TableCell>
                  <TableCell>{referral.phone}</TableCell>
                  <TableCell>{referral.address}</TableCell>
                  <TableCell>{renderTimestamp(referral.timestamp)}</TableCell>
                  {user.role === 'Admin' && (
                    <TableCell>{technicians.find(t => t.id === referral.tech_id)?.name || 'Unknown'}</TableCell>
                  )}
                  <TableCell>{getStatusBadge(referral.status)}</TableCell>
                   <TableCell className="text-right">
                    {user.role === 'Admin' ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleStatusChange(referral.id, 'Contacted')}>Mark as Contacted</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(referral.id, 'Closed')}>Mark as Closed</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(referral.id, 'Pending')}>Mark as Pending</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                         <Button variant="link" size="sm" disabled>No Actions</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
