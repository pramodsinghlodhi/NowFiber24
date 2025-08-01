
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

    return () => unsubscribe();
  }, [query]);

  return { data, loading };
}
