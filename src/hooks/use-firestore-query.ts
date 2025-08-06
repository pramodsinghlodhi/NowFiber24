
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
    
    // The collection name can be inferred from the query path
    const collectionName = (query as any)._query.path.segments[0];
    
    const unsubscribe = onSnapshot(query, (querySnapshot) => {
      const docs = querySnapshot.docs.map(doc => {
        const docData = doc.data();

        // Special handling for the 'users' collection to ensure uid is always present
        if (collectionName === 'users') {
          return {
            uid: doc.id, // The document ID is the UID from Firebase Auth
            ...(docData as T),
            id: docData.id, // The custom ID like 'tech-001'
          } as WithId<T>;
        }

        // For all other collections, the doc.id is the primary identifier.
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
