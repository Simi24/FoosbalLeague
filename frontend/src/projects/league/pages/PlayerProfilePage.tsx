import { useEffect, useMemo, useState } from "react";
import { MdExpandLess, MdExpandMore } from "react-icons/md";
import { useParams } from "react-router-dom";

import {
  api,
  useGetPlayerQuery,
  useGetMyLeaguesQuery,
  useGetLeaderboardQuery,
  useGetEloHistoryQuery,
  useGetAchievementsQuery,
  useGetLeagueMatchesQuery,
  useGetLeagueMembersQuery,
  useGetPlayerInsightsQuery,
} from "@/api/baseApi";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Avatar } from "@/components/Avatar";
import { Dropdown } from "@/components/inputs";
import {
  AchievementBadge,
  DreamPartnerList,
  EloHistoryChart,
  ExtremeMatchCard,
  HeadToHeadPanel,
  RecentMatchList,
  StatCard,
  StreakCard,
} from "../components";
import type { MyLeague } from "../types";

export const PlayerProfilePage = () => {
  const { id: playerId } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isOwnProfile = playerId === user?.player_id;

  const { data: player, isLoading: loading } = useGetPlayerQuery(playerId!, { skip: !playerId });
  const { data: myLeagues = [] } = useGetMyLeaguesQuery();

  const [sharedLeagues, setSharedLeagues] = useState<MyLeague[]>([]);
  const [selectedLeague, setSelectedLeague] = useState("");
  const [opponentId, setOpponentId] = useState("");
  const [achievementsExpanded, setAchievementsExpanded] = useState(false);

  // Reset opponent when switching league
  useEffect(() => {
    setOpponentId("");
  }, [selectedLeague]);

  // Own profile: use all my leagues. Other player: find shared leagues via leaderboard check.
  useEffect(() => {
    if (!playerId || myLeagues.length === 0) return;

    if (isOwnProfile) {
      setSharedLeagues(myLeagues);
      if (myLeagues.length > 0 && !selectedLeague) {
        setSelectedLeague(myLeagues[0]!.league_id);
      }
      return;
    }

    Promise.all(
      myLeagues.map(async (lg) => {
        const result = dispatch(api.endpoints.getLeaderboard.initiate(lg.league_id));
        try {
          const data = await result.unwrap();
          const hasPlayer = data.entries.some((e) => e.player_id === playerId);
          return hasPlayer ? lg : null;
        } catch {
          return null;
        } finally {
          result.unsubscribe();
        }
      }),
    ).then((checks) => {
      const shared = checks.filter((lg): lg is MyLeague => lg !== null);
      setSharedLeagues(shared);
      if (shared.length > 0 && !selectedLeague) {
        setSelectedLeague(shared[0]!.league_id);
      }
    });
  }, [playerId, myLeagues, isOwnProfile]);

  const { data: leaderboard } = useGetLeaderboardQuery(selectedLeague, { skip: !selectedLeague });
  const { data: eloHistory = [] } = useGetEloHistoryQuery(
    { playerId: playerId!, leagueId: selectedLeague },
    { skip: !playerId || !selectedLeague },
  );
  const { data: achievements = [] } = useGetAchievementsQuery(
    { playerId: playerId!, leagueId: selectedLeague },
    { skip: !playerId || !selectedLeague },
  );
  const { data: matches = [] } = useGetLeagueMatchesQuery(selectedLeague, {
    skip: !selectedLeague,
  });
  const { data: members = [] } = useGetLeagueMembersQuery(selectedLeague, {
    skip: !selectedLeague,
  });
  const { data: insights } = useGetPlayerInsightsQuery(
    { playerId: playerId!, leagueId: selectedLeague },
    { skip: !playerId || !selectedLeague },
  );

  // Auto-select the most-played opponent once head-to-head data is available
  useEffect(() => {
    const records = insights?.head_to_head ?? [];
    if (records.length === 0) return;
    setOpponentId((current) => {
      if (current && records.some((r) => r.opponent_id === current)) return current;
      return records[0]!.opponent_id;
    });
  }, [insights]);

  const rankingEntry = leaderboard?.entries.find((e) => e.player_id === playerId) ?? null;

  const playerMatches = useMemo(() => {
    if (!playerId) return [];
    return [...matches]
      .filter(
        (m) =>
          m.team1_player_ids.includes(playerId) ||
          m.team2_player_ids.includes(playerId),
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [matches, playerId]);

  const playerNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of members) map[m.player_id] = m.display_name;
    return map;
  }, [members]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin border-[3px] border-ink border-t-transparent" />
      </div>
    );
  }
  if (!player) return <p className="font-semibold text-danger">Player not found</p>;

  const winRate = rankingEntry && rankingEntry.matches_played > 0
    ? (rankingEntry.win_rate * 100).toFixed(0)
    : "0";

  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const lockedAchievements = achievements.filter((a) => !a.unlocked);
  const hasInsights = !!insights && !!rankingEntry;
  const is2v2 = insights?.league_type === "2v2";

  return (
    <div>
      <div className="brut-border brut-shadow mb-6 bg-team-blue-tint p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={player.display_name} size="lg" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">
                {player.display_name}
              </h1>
              {player.email && (
                <p className="font-mono text-xs text-ink-soft">{player.email}</p>
              )}
            </div>
          </div>
          {sharedLeagues.length > 0 && (
            <Dropdown
              value={selectedLeague}
              onChange={setSelectedLeague}
              options={sharedLeagues.map((lg) => ({ value: lg.league_id, label: lg.name }))}
              className="w-full sm:w-56"
            />
          )}
        </div>

        {rankingEntry && (
          <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
            <StatCard label="ELO" value={rankingEntry.elo} tone="mint" size="compact" />
            <StatCard
              label="Rank"
              value={`#${rankingEntry.rank}`}
              tone="butter"
              size="compact"
            />
            {insights ? (
              <StreakCard streak={insights.streak} size="compact" />
            ) : (
              <StatCard label="Streak" value="–" size="compact" />
            )}
            <StatCard
              label="Wins"
              value={rankingEntry.wins}
              color="text-success"
              size="compact"
            />
            <StatCard
              label="Losses"
              value={rankingEntry.losses}
              color="text-danger"
              size="compact"
            />
            <StatCard
              label="Win Rate"
              value={`${winRate}%`}
              tone="lavender"
              size="compact"
            />
          </div>
        )}
      </div>

      {!rankingEntry && sharedLeagues.length > 0 && (
        <p className="mb-6 text-sm font-medium text-ink-muted">No stats in this league yet.</p>
      )}
      {!rankingEntry && sharedLeagues.length === 0 && (
        <p className="mb-6 text-sm font-medium text-ink-muted">Not enrolled in any league yet.</p>
      )}

      {/* ── HIGHLIGHTS ── */}
      {hasInsights && (insights!.best_win || insights!.worst_loss) && (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          {insights!.best_win ? (
            <ExtremeMatchCard label="Best win" match={insights!.best_win} tone="win" />
          ) : (
            <HighlightEmpty label="Best win" tone="win" />
          )}
          {insights!.worst_loss ? (
            <ExtremeMatchCard label="Worst loss" match={insights!.worst_loss} tone="loss" />
          ) : (
            <HighlightEmpty label="Worst loss" tone="loss" />
          )}
        </div>
      )}

      {/* ── COMPARE ── */}
      {hasInsights && (
        <div
          className={`mb-6 grid grid-cols-1 gap-4 ${is2v2 ? "lg:grid-cols-2" : ""}`}
        >
          <HeadToHeadPanel
            records={insights!.head_to_head}
            playerName={player.display_name}
            opponentId={opponentId}
            onOpponentChange={setOpponentId}
          />
          {is2v2 && <DreamPartnerList partners={insights!.dream_partners} />}
        </div>
      )}

      {/* ── HISTORY ── */}
      {sharedLeagues.length > 0 && (
        <div className="brut-border brut-shadow mb-6 bg-card p-5">
          <h2 className="mb-4 text-lg font-bold uppercase tracking-wide text-ink">
            ELO History
          </h2>
          {eloHistory.length > 0 ? (
            <EloHistoryChart data={eloHistory} />
          ) : (
            <p className="text-sm font-medium text-ink-muted">
              No match history in this league yet.
            </p>
          )}
        </div>
      )}

      {selectedLeague && playerMatches.length > 0 && (
        <RecentMatchList
          key={selectedLeague}
          matches={playerMatches}
          playerId={playerId!}
          playerNames={playerNames}
        />
      )}

      {/* ── ACHIEVEMENTS (collassati di default) ── */}
      {achievements.length > 0 && (
        <div className="brut-border brut-shadow mt-6 bg-card p-5">
          <button
            type="button"
            onClick={() => setAchievementsExpanded((v) => !v)}
            className="flex w-full items-center justify-between gap-2 text-left"
            aria-expanded={achievementsExpanded}
          >
            <h2 className="text-lg font-bold uppercase tracking-wide text-ink">
              Achievements
              <span className="ml-2 font-mono text-sm font-bold text-ink-muted">
                {unlockedAchievements.length}/{achievements.length}
              </span>
            </h2>
            <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-ink-soft">
              {achievementsExpanded ? "Hide" : "Show"}
              {achievementsExpanded ? (
                <MdExpandLess size={20} />
              ) : (
                <MdExpandMore size={20} />
              )}
            </span>
          </button>
          {achievementsExpanded ? (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {unlockedAchievements.map((a) => (
                <AchievementBadge key={a.type} {...a} />
              ))}
              {lockedAchievements.map((a) => (
                <AchievementBadge key={a.type} {...a} />
              ))}
            </div>
          ) : unlockedAchievements.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {unlockedAchievements.slice(0, 8).map((a) => (
                <span
                  key={a.type}
                  title={`${a.name} — ${a.description}`}
                  className="brut-border bg-butter px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-ink"
                >
                  {a.name}
                </span>
              ))}
              {unlockedAchievements.length > 8 && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                  +{unlockedAchievements.length - 8} more
                </span>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm font-medium text-ink-muted">
              No achievements unlocked yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const HighlightEmpty = ({
  label,
  tone,
}: {
  label: string;
  tone: "win" | "loss";
}) => (
  <div
    className={`brut-border brut-shadow p-4 ${
      tone === "win" ? "bg-butter" : "bg-peach"
    }`}
  >
    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
      {label}
    </p>
    <p className="mt-1 font-mono text-xl font-bold text-ink-muted sm:text-2xl">
      –
    </p>
    <p className="mt-2 text-xs font-medium text-ink-muted">No match yet.</p>
  </div>
);
