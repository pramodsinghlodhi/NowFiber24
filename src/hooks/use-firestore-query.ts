
import { useState, useEffect } from 'react';
import { onSnapshot, Query } from 'firebase/firestore';

export function useFirestoreQuery<T>(query: Query | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) {
        setData([]);
        setLoading(false);
        return;
    }

    setLoading(true);
    // Setting up the listener. onSnapshot will return an unsubscribe function.
    const unsubscribe = onSnapshot(query, (querySnapshot) => {
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as T));
      setData(docs);
      setLoading(false);
    }, (error) => {
        console.error("Firestore query error:", error);
        setLoading(false);
    });

    // Cleanup function to unsubscribe from the listener when the component unmounts
    // or the query changes, to prevent memory leaks.
    return () => unsubscribe();
  }, [query]); // Re-run the effect if the query object itself changes.

  return { data, loading };
}
