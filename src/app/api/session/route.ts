// app/api/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import firebase_app from "@/firebase/config";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";

export async function GET(req: NextRequest) {
  try {
    const db = getFirestore(firebase_app);
    const transcriptionsRef = collection(db, "transcriptions");
    const q = query(transcriptionsRef, orderBy("createdAt", "desc"), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json(
        {
          message: "No transcriptions found in Firestore",
        },
        { status: 404 }
      );
    }

    const latestDoc = querySnapshot.docs[0];
    const latestData = latestDoc.data();

    return NextResponse.json({
      sessionId: latestDoc.id,
      text: latestData.text,
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
