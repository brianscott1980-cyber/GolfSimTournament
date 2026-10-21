import { NextResponse } from "next/server";
import { getGSProLiveData } from "@/lib/gspro-live";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const liveData = getGSProLiveData();
    return NextResponse.json(liveData);
  } catch (err: any) {
    return NextResponse.json(
      {
        isGSProRunning: false,
        isRoundActive: false,
        statusMessage: `Error detecting GSPro: ${err?.message || "Unknown error"}`,
        source: "idle",
        lastUpdated: new Date().toISOString(),
        holesCompleted: 0,
        currentHole: 1,
        players: [],
      },
      { status: 500 }
    );
  }
}
