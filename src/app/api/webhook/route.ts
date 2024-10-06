// app/api/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import firebase_app from "@/firebase/config";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

// Function to append text to a field in a Firestore document
async function appendText(sessionId: string, newText: string) {
  let result = null;
  const db = getFirestore(firebase_app);

  const docRef = doc(db, "transcriptions", sessionId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    let text = docSnap.data().text || "";
    text += ` ${newText}`;
    result = await setDoc(docRef, { text }, { merge: true });
  } else {
    result = await setDoc(docRef, {
      text: newText,
      createdAt: serverTimestamp(),
    });
  }

  return { result };
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.log("Received webhook payload:", data);

    // Extract session ID from request body
    const sessionId = data.session_id as string | undefined;
    const segments = data.segments as
      | Array<{
          end: number;
          is_user: boolean;
          speaker: string;
          speaker_id: number;
          start: number;
          text: string;
        }>
      | undefined;

    // Validate session ID and segments
    if (
      !sessionId ||
      !segments ||
      !Array.isArray(segments) ||
      segments.length === 0
    ) {
      console.error("Invalid payload: missing session_id or segments");
      return NextResponse.json(
        { error: "Invalid payload: missing session_id or segments" },
        { status: 400 }
      );
    }

    // Combine segments and add into Firebase
    segments.sort((a, b) => a.end - b.end);
    const segmentsText = segments.map((segment) => segment.text).join(" ");
    const { result } = await appendText(sessionId, segmentsText);

    console.info("Segments stored in Firestore successfully:", result);

    return NextResponse.json(
      { message: "Webhook received successfully and data stored in Firestore" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
