import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { licenseDb } from '../services/licenseService';

export const useLicense = () => {
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  // El ID específico de la Barbería en tu panel
  const LICENSE_ID = import.meta.env.VITE_LICENSE_CLIENT_ID;

  useEffect(() => {
    if (!LICENSE_ID) {
      console.error("⚠️ ERROR: Falta VITE_LICENSE_CLIENT_ID en variables de entorno.");
      setLoading(false);
      return;
    }

    const clientRef = doc(licenseDb, "clients", LICENSE_ID);

    const unsubscribe = onSnapshot(clientRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        // Si isActive es false -> BLOQUEAR
        setIsLocked(data.isActive === false); 
      } else {
        // Si no existe la licencia -> BLOQUEO DE SEGURIDAD
        setIsLocked(true);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error de licencia:", error);
      // Fail Safe: Si falla internet, permitimos entrar
      setIsLocked(false); 
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { isLocked, loading };
};
