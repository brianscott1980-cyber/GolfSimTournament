"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { demo, applyInitialTournamentSetup, type Tournament } from "@/lib/golf";

const TournamentContext = createContext<{
  tournaments: Tournament[];
  setTournaments: Dispatch<SetStateAction<Tournament[]>>;
  ready: boolean;
  storageError: string;
} | null>(null);

export function TournamentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [tournaments, setTournaments] = useState<Tournament[]>([demo]);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("fourball-v1");
      if (saved) setTournaments(applyInitialTournamentSetup(JSON.parse(saved)));
    } catch {
      setStorageError("Local data could not be loaded.");
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem("fourball-v1", JSON.stringify(tournaments));
    } catch {
      setStorageError("Browser storage is full. Please sync your tournaments.");
    }
  }, [tournaments, ready]);
  return (
    <TournamentContext.Provider
      value={{ tournaments, setTournaments, ready, storageError }}
    >
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournaments() {
  const context = useContext(TournamentContext);
  if (!context) throw new Error("TournamentProvider is required.");
  return context;
}
