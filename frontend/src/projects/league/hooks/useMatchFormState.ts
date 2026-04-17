import { useMemo, useReducer } from "react";

type LeagueType = "1v1" | "2v2";
type TeamNumber = 1 | 2;

interface State {
  team1: (string | null)[];
  team2: (string | null)[];
  score1: string;
  score2: string;
  maxPerTeam: number;
}

type Action =
  | { type: "ASSIGN"; team: TeamNumber; playerId: string; slotIndex?: number }
  | { type: "REMOVE"; team: TeamNumber; slotIndex: number }
  | { type: "PREFILL"; team1: (string | null)[]; team2: (string | null)[] }
  | { type: "SET_SCORE1"; value: string }
  | { type: "SET_SCORE2"; value: string }
  | { type: "RESET" };

const isValidScore = (s: string) => /^\d+$/.test(s);

const pad = (arr: (string | null)[], size: number): (string | null)[] => {
  const r = arr.slice(0, size);
  while (r.length < size) r.push(null);
  return r;
};

const stripPlayer = (arr: (string | null)[], id: string): (string | null)[] =>
  arr.map((x) => (x === id ? null : x));

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ASSIGN": {
      const { team, playerId, slotIndex } = action;
      const t1 = stripPlayer(state.team1, playerId);
      const t2 = stripPlayer(state.team2, playerId);
      const target = team === 1 ? [...t1] : [...t2];
      const idx =
        slotIndex !== undefined ? slotIndex : target.findIndex((x) => x === null);
      if (idx < 0 || idx >= state.maxPerTeam) {
        return { ...state, team1: t1, team2: t2 };
      }
      target[idx] = playerId;
      return team === 1
        ? { ...state, team1: target, team2: t2 }
        : { ...state, team1: t1, team2: target };
    }
    case "REMOVE": {
      const { team, slotIndex } = action;
      if (slotIndex < 0 || slotIndex >= state.maxPerTeam) return state;
      const target = team === 1 ? [...state.team1] : [...state.team2];
      target[slotIndex] = null;
      return team === 1
        ? { ...state, team1: target }
        : { ...state, team2: target };
    }
    case "PREFILL":
      return {
        ...state,
        team1: pad(action.team1, state.maxPerTeam),
        team2: pad(action.team2, state.maxPerTeam),
      };
    case "SET_SCORE1":
      return { ...state, score1: action.value };
    case "SET_SCORE2":
      return { ...state, score2: action.value };
    case "RESET":
      return {
        ...state,
        team1: new Array(state.maxPerTeam).fill(null),
        team2: new Array(state.maxPerTeam).fill(null),
        score1: "",
        score2: "",
      };
  }
};

const init = (maxPerTeam: number): State => ({
  team1: new Array(maxPerTeam).fill(null),
  team2: new Array(maxPerTeam).fill(null),
  score1: "",
  score2: "",
  maxPerTeam,
});

export const useMatchFormState = (leagueType: LeagueType) => {
  const maxPerTeam = leagueType === "1v1" ? 1 : 2;
  const [state, dispatch] = useReducer(reducer, maxPerTeam, init);

  const teamsReady = useMemo(
    () =>
      state.team1.every((x) => x !== null) &&
      state.team2.every((x) => x !== null),
    [state.team1, state.team2],
  );

  const scoresReady = useMemo(
    () =>
      isValidScore(state.score1) &&
      isValidScore(state.score2) &&
      state.score1 !== state.score2,
    [state.score1, state.score2],
  );

  const tieError = useMemo(
    () =>
      isValidScore(state.score1) &&
      isValidScore(state.score2) &&
      state.score1 === state.score2,
    [state.score1, state.score2],
  );

  const canSubmit = teamsReady && scoresReady;

  const team1Ids = useMemo(
    () => state.team1.filter((x): x is string => x !== null),
    [state.team1],
  );
  const team2Ids = useMemo(
    () => state.team2.filter((x): x is string => x !== null),
    [state.team2],
  );

  const playerTeam = (id: string): TeamNumber | null => {
    if (state.team1.includes(id)) return 1;
    if (state.team2.includes(id)) return 2;
    return null;
  };

  return {
    team1: state.team1,
    team2: state.team2,
    score1: state.score1,
    score2: state.score2,
    maxPerTeam: state.maxPerTeam,
    team1Ids,
    team2Ids,
    teamsReady,
    scoresReady,
    tieError,
    canSubmit,
    playerTeam,
    assignToSlot: (team: TeamNumber, playerId: string, slotIndex?: number) =>
      dispatch({ type: "ASSIGN", team, playerId, slotIndex }),
    removeFromSlot: (team: TeamNumber, slotIndex: number) =>
      dispatch({ type: "REMOVE", team, slotIndex }),
    setScore1: (value: string) => dispatch({ type: "SET_SCORE1", value }),
    setScore2: (value: string) => dispatch({ type: "SET_SCORE2", value }),
    prefillTeams: (team1: (string | null)[], team2: (string | null)[]) =>
      dispatch({ type: "PREFILL", team1, team2 }),
    reset: () => dispatch({ type: "RESET" }),
  };
};
