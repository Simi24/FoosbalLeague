import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MdSportsSoccer } from "react-icons/md";

import {
  useGetLeagueQuery,
  useGetLeagueMembersQuery,
  useGetLeaderboardQuery,
  useGetLeagueMatchesQuery,
  useRecordMatchMutation,
} from "@/api/baseApi";
import { useAppSelector } from "@/app/hooks";
import { calculateEloPreview } from "@/shared/eloCalc";
import type { League, LeagueMember } from "../types";
import { useMatchFormState } from "../hooks/useMatchFormState";
import { usePickerController } from "../hooks/usePickerController";
import { useRematchPrefill } from "../hooks/useRematchPrefill";
import { TeamCard } from "../components/TeamCard";
import { PlayerPicker, type PickerPlayer } from "../components/PlayerPicker";
import { RematchCard } from "../components/RematchCard";
import type { SlotPlayer } from "../components/PlayerSlot";

type PlayerWithStats = LeagueMember & { matches_played: number };

export const MatchRecordPage = () => {
  const { id: leagueId } = useParams<{ id: string }>();
  const { data: league, isLoading: leagueLoading } = useGetLeagueQuery(leagueId!, {
    skip: !leagueId,
  });

  if (!leagueId) return <p className="text-danger">Missing league id</p>;
  if (leagueLoading || !league) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }
  return <MatchRecordForm leagueId={leagueId} league={league} />;
};

interface FormProps {
  leagueId: string;
  league: League;
}

const MatchRecordForm = ({ leagueId, league }: FormProps) => {
  const navigate = useNavigate();
  const { data: members = [] } = useGetLeagueMembersQuery(leagueId);
  const { data: leaderboard } = useGetLeaderboardQuery(leagueId);
  const { data: matches = [] } = useGetLeagueMatchesQuery(leagueId);
  const currentPlayerId = useAppSelector(
    (state) => state.auth.user?.player_id ?? null,
  );
  const [recordMatch, { isLoading: submitting, error: submitError }] =
    useRecordMatchMutation();

  const players = useMemo<PlayerWithStats[]>(() => {
    const rankingMap = new Map(
      leaderboard?.entries.map((e) => [e.player_id, e]) ?? [],
    );
    return members.map((m) => ({
      ...m,
      matches_played: rankingMap.get(m.player_id)?.matches_played ?? 0,
    }));
  }, [members, leaderboard]);

  const playersById = useMemo(
    () => new Map(players.map((p) => [p.player_id, p])),
    [players],
  );

  const memberIds = useMemo(
    () => new Set(members.map((m) => m.player_id)),
    [members],
  );

  const playerNames = useMemo(
    () => new Map(members.map((m) => [m.player_id, m.display_name])),
    [members],
  );

  const rematch = useRematchPrefill({
    currentPlayerId,
    matches,
    memberIds,
  });

  const form = useMatchFormState(league.league_type);
  const picker = usePickerController();

  const toSlotPlayer = (id: string | null): SlotPlayer | null => {
    if (!id) return null;
    const p = playersById.get(id);
    return p
      ? {
          player_id: p.player_id,
          display_name: p.display_name,
          current_elo: p.current_elo,
        }
      : { player_id: id, display_name: "Unknown", current_elo: 0 };
  };

  const team1Slots = form.team1.map(toSlotPlayer);
  const team2Slots = form.team2.map(toSlotPlayer);

  const preview = useMemo(() => {
    if (!form.teamsReady || !form.scoresReady) return new Map<string, number>();
    const team1Input = form.team1Ids
      .map((id) => playersById.get(id))
      .filter((p): p is PlayerWithStats => !!p)
      .map((p) => ({
        id: p.player_id,
        elo: p.current_elo,
        matchesPlayed: p.matches_played,
      }));
    const team2Input = form.team2Ids
      .map((id) => playersById.get(id))
      .filter((p): p is PlayerWithStats => !!p)
      .map((p) => ({
        id: p.player_id,
        elo: p.current_elo,
        matchesPlayed: p.matches_played,
      }));
    const s1 = Number(form.score1);
    const s2 = Number(form.score2);
    return calculateEloPreview(
      team1Input,
      team2Input,
      s1 > s2 ? true : s1 < s2 ? false : null,
    );
  }, [
    form.teamsReady,
    form.scoresReady,
    form.team1Ids,
    form.team2Ids,
    form.score1,
    form.score2,
    playersById,
  ]);

  const pickerPlayers: PickerPlayer[] = useMemo(
    () =>
      players.map((p) => {
        const team = form.playerTeam(p.player_id);
        return {
          player_id: p.player_id,
          display_name: p.display_name,
          current_elo: p.current_elo,
          disabledReason: team ? `Team ${team}` : undefined,
        };
      }),
    [players, form],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.canSubmit) return;
    try {
      await recordMatch({
        league_id: leagueId,
        team1: { player_ids: form.team1Ids, score: Number(form.score1) },
        team2: { player_ids: form.team2Ids, score: Number(form.score2) },
      }).unwrap();
      navigate(`/leagues/${leagueId}`);
    } catch {
      // error surfaced via submitError below
    }
  };

  const handlePick = (playerId: string) => {
    if (!picker.target) return;
    form.assignToSlot(picker.target.team, playerId, picker.target.slotIndex);
    picker.close();
  };

  const submitErrorMsg =
    submitError && "data" in submitError
      ? (submitError.data as { detail?: string })?.detail
      : undefined;

  return (
    <div className="mx-auto max-w-2xl pb-24 md:pb-0">
      <h1 className="mb-6 text-2xl font-bold text-text-primary">Record Match</h1>

      {rematch && currentPlayerId && (
        <RematchCard
          info={rematch}
          currentPlayerId={currentPlayerId}
          playerNames={playerNames}
          onApply={() => form.prefillTeams(rematch.team1, rematch.team2)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:gap-6">
          <TeamCard
            team={1}
            label="Team 1"
            slots={team1Slots}
            deltas={preview}
            onSlotTap={(idx) => picker.openFor(1, idx)}
            onSlotRemove={(idx) => form.removeFromSlot(1, idx)}
          />
          <div className="flex items-center justify-center md:pt-6">
            <span className="text-lg font-bold text-text-muted">vs</span>
          </div>
          <TeamCard
            team={2}
            label="Team 2"
            slots={team2Slots}
            deltas={preview}
            onSlotTap={(idx) => picker.openFor(2, idx)}
            onSlotRemove={(idx) => form.removeFromSlot(2, idx)}
          />
        </div>

        <div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-4">
            <div>
              <label
                htmlFor="score1"
                className="mb-1 block text-sm font-medium text-team-blue"
              >
                Team 1 Score
              </label>
              <input
                id="score1"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={form.score1}
                onChange={(e) => form.setScore1(e.target.value)}
                className="w-full rounded-lg border border-team-blue/30 bg-bg-tertiary px-3 py-3 text-center font-mono text-2xl text-team-blue outline-none focus:border-team-blue focus:ring-2 focus:ring-team-blue/20"
                required
              />
            </div>
            <span className="pb-3 text-lg font-bold text-text-muted">&ndash;</span>
            <div>
              <label
                htmlFor="score2"
                className="mb-1 block text-sm font-medium text-team-red"
              >
                Team 2 Score
              </label>
              <input
                id="score2"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={form.score2}
                onChange={(e) => form.setScore2(e.target.value)}
                className="w-full rounded-lg border border-team-red/30 bg-bg-tertiary px-3 py-3 text-center font-mono text-2xl text-team-red outline-none focus:border-team-red focus:ring-2 focus:ring-team-red/20"
                required
              />
            </div>
          </div>
          {form.tieError && (
            <p
              role="alert"
              className="mt-2 text-center text-xs text-danger"
            >
              Scores must differ — there are no ties in foosball.
            </p>
          )}
        </div>

        {preview.size > 0 && (
          <div className="rounded-xl border border-field-green/20 bg-field-green/5 p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-field-green">
              ELO Preview
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                {form.team1Ids.map((id) => {
                  const p = playersById.get(id);
                  const d = preview.get(id) ?? 0;
                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-text-primary">
                        {p?.display_name ?? id}
                      </span>
                      <span
                        className={`font-mono font-semibold ${
                          d >= 0 ? "text-success" : "text-danger"
                        }`}
                      >
                        {d >= 0 ? "+" : ""}
                        {d}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-1">
                {form.team2Ids.map((id) => {
                  const p = playersById.get(id);
                  const d = preview.get(id) ?? 0;
                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-text-primary">
                        {p?.display_name ?? id}
                      </span>
                      <span
                        className={`font-mono font-semibold ${
                          d >= 0 ? "text-success" : "text-danger"
                        }`}
                      >
                        {d >= 0 ? "+" : ""}
                        {d}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {submitErrorMsg && (
          <p role="alert" className="text-sm text-danger">
            {submitErrorMsg}
          </p>
        )}

        <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-bg-primary px-4 py-3 md:static md:bottom-auto md:border-none md:bg-transparent md:p-0">
          <div className="mx-auto max-w-2xl">
            <button
              type="submit"
              disabled={submitting || !form.canSubmit}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MdSportsSoccer size={18} />
              {submitting ? "Recording..." : "Record Match"}
            </button>
          </div>
        </div>
      </form>

      <PlayerPicker
        open={picker.open}
        title={
          picker.target ? `Pick player for Team ${picker.target.team}` : undefined
        }
        players={pickerPlayers}
        onSelect={handlePick}
        onDismiss={picker.close}
      />
    </div>
  );
};
