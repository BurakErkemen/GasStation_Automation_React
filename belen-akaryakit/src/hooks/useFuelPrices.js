import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export function useFuelPrices() {
  const [prices,         setPrices]         = useState(null);
  const [previousPrices, setPreviousPrices] = useState(null);
  const [updatedAt,      setUpdatedAt]      = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);

  useEffect(() => {
    const ref = doc(db, "settings", "fuelPrices");

    const unsub = onSnapshot(ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setPrices({
            benzin:     data.benzin     ?? null,
            dizel:      data.dizel      ?? null,
            eurodiesel: data.eurodiesel ?? null,
            lpg:        data.lpg        ?? null,
          });
          setPreviousPrices(data.previousPrices || null);
          setUpdatedAt(
            data.updatedAt
              ? new Date(data.updatedAt.toDate()).toLocaleString("tr-TR")
              : null
          );
        } else {
          // Firestore'da doküman yok
          setPrices(null);
          setPreviousPrices(null);
          setUpdatedAt(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        // Bağlantı hatası
        console.error("useFuelPrices:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  return { prices, previousPrices, updatedAt, loading, error };
}