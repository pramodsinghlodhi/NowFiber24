
import { useState, useEffect } from 'react';
import { onSnapshot, Query, DocumentData } from 'firebase/firestore';
import { User } from '@/lib/types';

// A generic type that includes an 'id' which is the document ID (or UID for users)
type WithId<T> = T & { id: string };

export function useFirestoreQuery<T>(query: Query<DocumentData> | null) {
  const [data, setData] = useState<WithId<T>[]>([]);
  const [loading, setLoading] = useState(true);

  // Serialize the query to a stable string to use as a dependency.
  // This prevents re-running the effect on every render if the query object is re-created.
  const queryKey = query ? JSON.stringify((query as any)._query) : "null";

  useEffect(() => {
    if (!query) {
        setData([]);
        setLoading(false);
        return;
    }

    setLoading(true);
    
    const unsubscribe = onSnapshot(query, (querySnapshot) => {
      const docs = querySnapshot.docs.map(doc => {
        return { ...doc.data() as T, id: doc.id } as WithId<T>;
      });
      setData(docs);
      setLoading(false);
    }, (error) => {
        console.error("Firestore query error:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]); 

  return { data, loading };
}
