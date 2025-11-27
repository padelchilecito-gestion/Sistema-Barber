import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Reemplaza esto con los datos que copiaste en el Paso 2
// (Para producción, deberías usar variables de entorno como con Gemini)
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "TU_PROJECT_ID.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROJECT_ID.appspot.com",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
