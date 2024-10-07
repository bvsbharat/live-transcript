"use client";

import { useEffect, useState } from "react";
import firebase_app from "@/firebase/config";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  onSnapshot,
} from "firebase/firestore";

// Define the Message interface
interface Message {
  speaker: string;
  text: string;
}

// Format the transcript string
const formatTranscriptString = (messages: Message[]): string => {
  return messages
    .map((message) => `${message.speaker}: ${message.text}`)
    .join("\n");
};

const getLatestCallSession = async () => {
  const db = getFirestore(firebase_app);
  const transcriptionsRef = collection(db, "transcriptions");
  const q = query(transcriptionsRef, orderBy("createdAt", "desc"), limit(1));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    console.error("No transcriptions found in Firestore");
    return;
  }

  const latestDoc = querySnapshot.docs[0];
  const latestData = latestDoc.data();
  return {
    sessionId: latestDoc.id,
    text: latestData.text,
  };
};

const Home = () => {
  const [callSessionId, setCallSessionId] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>("");

  // Get the latest call session ID from the API
  const handleClick = async () => {
    const call: any = await getLatestCallSession();
    setCallSessionId(call.sessionId);
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
          const messageString = formatTranscriptString(data.messages);
          setTranscription(messageString);
          // TODO: call API for LLM processing here with messageString

          // TODO: update page UI with LLM response
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
