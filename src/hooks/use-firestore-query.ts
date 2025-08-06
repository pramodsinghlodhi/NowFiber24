
import { useState, useEffect } from 'react';
import { onSnapshot, Query, DocumentData } from 'firebase/firestore';

// A generic type that includes an 'id'
type WithId<T> = T & { id: string };

export function useFirestoreQuery<T>(query: Query<DocumentData> | null) {
  const [data, setData] = useState<WithId<T>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) {
        setData([]);
        setLoading(false);
        return;
    }

    if (!loading) {
        setLoading(true);
    }
    
    const unsubscribe = onSnapshot(query, (querySnapshot) => {
      const docs = querySnapshot.docs.map(doc => {
        // Here, we ensure the document ID is always included.
        // For the 'users' collection, the doc ID is the UID.
        return { id: doc.id, ...doc.data() } as WithId<T>;
      });
      setData(docs);
      setLoading(false);
    }, (error) => {
        console.error("Firestore query error:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]); 

  return { data, loading };
}
