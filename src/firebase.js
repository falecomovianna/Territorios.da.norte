import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDcps4XnpNcwAi3vkwJka4aLq5z7OrDAe8",
  authDomain: "territoriosdanorte.firebaseapp.com",
  projectId: "territoriosdanorte",
  storageBucket: "territoriosdanorte.firebasestorage.app",
  messagingSenderId: "170623774430",
  appId: "1:170623774430:web:d968189745bdc1c6ab1c4f"
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});
