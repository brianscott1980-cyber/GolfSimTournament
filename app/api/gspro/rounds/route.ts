import { NextResponse } from "next/server";
import {
  getGSProHistoricalRoundsList,
  getGSProHistoricalRoundState,
} from "@/lib/gspro-db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");

    if (idParam) {
      const roundId = parseInt(idParam, 10);
      if (isNaN(roundId)) {
        return NextResponse.json({ error: "Invalid round ID" }, { status: 400 });
      }
      const roundState = getGSProHistoricalRoundState(roundId);
      if (!roundState) {
        return NextResponse.json({ error: "Round not found" }, { status: 404 });
      }
      return NextResponse.json(roundState);
    }

    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 25;
    const rounds = getGSProHistoricalRoundsList(isNaN(limit) ? 25 : limit);
    return NextResponse.json(rounds);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to query GSPro rounds" },
      { status: 500 }
    );
  }
}

