"use client";

import { useEffect, useState } from "react";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import firebase_app from "@/firebase/config";

const Home = () => {
  const [callSessionId, setCallSessionId] = useState(null);
  const [transcription, setTranscription] = useState(null);

  // Get the latest call session ID from the API
  const handleClick = () => {
    fetch("/api/session")
      .then((res) => res.json())
      .then((data) => {
        setCallSessionId(data.sessionId);
      })
      .catch((error) => {
        console.error("Error fetching call session ID:", error);
      });
  };

  // Set up firebase to listen for changes to transcript text
  useEffect(() => {
    if (!callSessionId) {
      return;
    }

    const db = getFirestore(firebase_app);
    const docRef = doc(db, "transcriptions", callSessionId);

    const unsubscribe = onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setTranscription(data.text);
          // TODO: call API for LLM processing here
        } else {
          console.log("No such document!");
        }
      },
      (error) => {
        console.error("Error listening to document:", error);
      }
    );
    return () => unsubscribe();
  }, [callSessionId]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>
        <button
          onClick={handleClick}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Listen to Call
        </button>
        <h1>Connected to Call Session: {callSessionId}</h1>
        <pre>{transcription}</pre>
      </div>
    </main>
  );
};

export default Home;
