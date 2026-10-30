"""Player insights aggregator — streak, best/worst, head-to-head, dream partner."""

from collections import defaultdict

from models.match import MatchModel
from schemas.insights import (
    DreamPartner,
    ExtremeMatch,
    HeadToHead,
    PlayerInsightsResponse,
    StreakInfo,
)
from services.exceptions import MatchNotFoundError
from services.league_service import get_league, get_league_members
from services.match_service import list_matches_by_league


def compute_player_insights(
    tenant_id: str,
    league_id: str,
    player_id: str,
) -> PlayerInsightsResponse:
    """Single-pass aggregation of player stats for a league."""
    league = get_league(tenant_id, league_id)
    if not league:
        raise MatchNotFoundError(league_id)

    names = {m.player_id: m.display_name for m in get_league_members(league_id)}

    matches = [
        m
        for m in list_matches_by_league(league_id)
        if m.status == "CONFIRMED"
        and (player_id in m.team1_player_ids or player_id in m.team2_player_ids)
    ]
    matches.sort(key=lambda m: m.created_at)

    cur_streak = 0
    longest_win = 0
    best: ExtremeMatch | None = None
    worst: ExtremeMatch | None = None
    h2h_records: dict[str, dict[str, int]] = defaultdict(
        lambda: {"wins": 0, "losses": 0, "swing": 0}
    )
    partners: dict[str, dict[str, int]] = defaultdict(lambda: {"wins": 0, "losses": 0})

    is_2v2 = league.league_type == "2v2"

    for m in matches:
        on_t1 = player_id in m.team1_player_ids
        my_score = m.team1_score if on_t1 else m.team2_score
        opp_score = m.team2_score if on_t1 else m.team1_score
        won = my_score > opp_score
        delta = int((m.elo_changes or {}).get(player_id, {}).get("delta", 0))
        opp_ids = m.team2_player_ids if on_t1 else m.team1_player_ids
        mates = [
            p
            for p in (m.team1_player_ids if on_t1 else m.team2_player_ids)
            if p != player_id
        ]

        if won:
            cur_streak = cur_streak + 1 if cur_streak >= 0 else 1
            longest_win = max(longest_win, cur_streak)
        else:
            cur_streak = cur_streak - 1 if cur_streak <= 0 else -1

        if best is None or delta > best.delta:
            best = _build_extreme(m, delta, opp_ids, my_score, opp_score, names)
        if worst is None or delta < worst.delta:
            worst = _build_extreme(m, delta, opp_ids, my_score, opp_score, names)

        for opp in opp_ids:
            key = "wins" if won else "losses"
            h2h_records[opp][key] += 1
            h2h_records[opp]["swing"] += delta

        if is_2v2:
            for mate in mates:
                key = "wins" if won else "losses"
                partners[mate][key] += 1

    best_win = best if best is not None and best.delta > 0 else None
    worst_loss = worst if worst is not None and worst.delta < 0 else None

    head_to_head: list[HeadToHead] = []
    for pid, rec in h2h_records.items():
        games = rec["wins"] + rec["losses"]
        head_to_head.append(
            HeadToHead(
                opponent_id=pid,
                opponent_name=names.get(pid, pid),
                wins=rec["wins"],
                losses=rec["losses"],
                games=games,
                elo_swing=rec["swing"],
            )
        )
    head_to_head.sort(key=lambda h: (-h.games, h.opponent_name))

    dream_partners: list[DreamPartner] = []
    if is_2v2:
        for pid, rec in partners.items():
            games = rec["wins"] + rec["losses"]
            win_rate = rec["wins"] / games if games else 0.0
            dream_partners.append(
                DreamPartner(
                    partner_id=pid,
                    partner_name=names.get(pid, pid),
                    wins=rec["wins"],
                    losses=rec["losses"],
                    games=games,
                    win_rate=round(win_rate, 4),
                )
            )
        dream_partners.sort(key=lambda p: (-p.win_rate, -p.games))

    return PlayerInsightsResponse(
        player_id=player_id,
        league_id=league_id,
        league_type=league.league_type,
        streak=StreakInfo(current=cur_streak, longest_win=longest_win),
        best_win=best_win,
        worst_loss=worst_loss,
        head_to_head=head_to_head,
        dream_partners=dream_partners,
    )


def _build_extreme(
    m: MatchModel,
    delta: int,
    opp_ids: list[str],
    team_score: int,
    opp_score: int,
    names: dict[str, str],
) -> ExtremeMatch:
    return ExtremeMatch(
        match_id=m.match_id,
        delta=delta,
        opponent_ids=list(opp_ids),
        opponent_names=[names.get(pid, pid) for pid in opp_ids],
        team_score=team_score,
        opponent_score=opp_score,
        created_at=m.created_at.isoformat()
        if hasattr(m.created_at, "isoformat")
        else str(m.created_at),
    )
