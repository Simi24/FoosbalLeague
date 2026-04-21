import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MdArrowBack, MdContentCopy, MdPersonRemove, MdRefresh, MdStar, MdStarBorder, MdDelete } from "react-icons/md";

import {
  useGetLeagueQuery,
  useGetLeagueMembersQuery,
  useGetMyLeaguesQuery,
  useUpdateLeagueMutation,
  useKickMemberMutation,
  usePromoteMemberMutation,
  useDemoteMemberMutation,
  useDeleteLeagueMutation,
  useRegenerateCodeMutation,
} from "@/api/baseApi";
import { useAppSelector } from "@/app/hooks";

const inputClass =
  "brut-border min-h-[44px] w-full bg-card px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-muted";
const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink";

export const LeagueSettingsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const { data: league, isLoading: leagueLoading } = useGetLeagueQuery(id!, { skip: !id });
  const { data: members = [], isLoading: membersLoading } = useGetLeagueMembersQuery(id!, { skip: !id });
  const { data: myLeagues = [] } = useGetMyLeaguesQuery();

  const [updateLeague] = useUpdateLeagueMutation();
  const [kickMember] = useKickMemberMutation();
  const [promoteMember] = usePromoteMemberMutation();
  const [demoteMember] = useDemoteMemberMutation();
  const [deleteLeague] = useDeleteLeagueMutation();
  const [regenerateCode] = useRegenerateCodeMutation();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const inviteCode = myLeagues.find((l) => l.league_id === id)?.invite_code ?? "";
  const loading = leagueLoading || membersLoading;

  useEffect(() => {
    if (league) {
      setName(league.name);
      setDescription(league.description);
    }
  }, [league]);

  const currentMember = members.find((m) => m.player_id === user?.player_id);
  const isAdmin = currentMember?.role === "admin";

  const handleSave = () => updateLeague({ id: id!, name, description });
  const handleKick = (playerId: string) => kickMember({ leagueId: id!, playerId });
  const handlePromote = (playerId: string) => promoteMember({ leagueId: id!, playerId });
  const handleDemote = (playerId: string) => demoteMember({ leagueId: id!, playerId });

  const handleDelete = async () => {
    await deleteLeague(id!).unwrap();
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin border-[3px] border-ink border-t-transparent" />
      </div>
    );
  }

  if (!league || !isAdmin) {
    return <p className="font-semibold text-danger">Access denied</p>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate(`/leagues/${id}`)}
          aria-label="Back"
          className="brut-border btn-press bg-card p-2 text-ink transition-colors hover:bg-paper-alt"
        >
          <MdArrowBack size={18} />
        </button>
        <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">
          League Settings
        </h1>
      </div>

      <div className="brut-border brut-shadow mb-6 bg-card p-5">
        <h2 className="mb-4 text-lg font-bold uppercase tracking-wide text-ink">League Info</h2>
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
            />
          </div>
          <button
            onClick={handleSave}
            className="brut-border btn-press brut-shadow min-h-[44px] w-full bg-ink px-4 py-2 text-sm font-bold uppercase tracking-wide text-paper transition-colors sm:w-auto"
          >
            Save
          </button>
        </div>
      </div>

      {inviteCode && (
        <div className="brut-border brut-shadow mb-6 bg-card p-5">
          <h2 className="mb-2 text-lg font-bold uppercase tracking-wide text-ink">Invite Code</h2>
          <p className="mb-3 text-sm font-medium text-ink-soft">
            Share this code with others so they can join your league.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex-1 border-[3px] border-ink bg-butter px-4 py-3 text-center font-mono text-xl font-bold tracking-[0.2em] text-ink sm:text-2xl sm:tracking-[0.3em]">
              {inviteCode}
            </div>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(inviteCode)}
                className="brut-border btn-press bg-card p-3 text-ink transition-colors hover:bg-paper-alt"
                title="Copy code"
              >
                <MdContentCopy size={18} />
              </button>
              <button
                onClick={() => regenerateCode(id!)}
                className="brut-border btn-press bg-card p-3 text-ink transition-colors hover:bg-paper-alt"
                title="Generate new code"
              >
                <MdRefresh size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="brut-border brut-shadow mb-6 bg-card p-5">
        <h2 className="mb-4 text-lg font-bold uppercase tracking-wide text-ink">
          Members ({members.length})
        </h2>
        <ul className="divide-y-2 divide-ink/10">
          {members.map((m) => (
            <li
              key={m.player_id}
              className="flex items-center justify-between py-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-ink">{m.display_name}</span>
                {m.role === "admin" && (
                  <span className="border-2 border-ink bg-butter px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink">
                    admin
                  </span>
                )}
              </div>
              {m.player_id !== user?.player_id && (
                <div className="flex items-center gap-1">
                  {m.role === "player" ? (
                    <button
                      onClick={() => handlePromote(m.player_id)}
                      className="brut-border btn-press bg-butter p-1.5 text-ink"
                      title="Promote to admin"
                    >
                      <MdStar size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDemote(m.player_id)}
                      className="brut-border btn-press bg-paper-alt p-1.5 text-ink"
                      title="Demote to player"
                    >
                      <MdStarBorder size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleKick(m.player_id)}
                    className="brut-border btn-press bg-coral p-1.5 text-ink"
                    title="Remove from league"
                  >
                    <MdPersonRemove size={16} />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-[3px] border-ink bg-coral p-5">
        <h2 className="mb-2 text-lg font-bold uppercase tracking-wide text-ink">Danger Zone</h2>
        <p className="mb-4 text-sm font-medium text-ink">
          Deleting a league removes all members, matches, and rankings permanently.
        </p>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="brut-border btn-press brut-shadow flex min-h-[44px] items-center gap-2 bg-ink px-4 py-2 text-sm font-bold uppercase tracking-wide text-paper transition-colors"
          >
            <MdDelete size={16} /> Delete League
          </button>
        ) : (
          <div className="animate-in brut-border flex flex-col gap-3 bg-card p-4">
            <p className="text-sm font-bold text-ink">
              Are you sure? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                className="brut-border btn-press brut-shadow flex min-h-[44px] items-center gap-2 bg-ink px-4 py-2 text-sm font-bold uppercase tracking-wide text-paper transition-colors"
              >
                <MdDelete size={16} /> Yes, delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="brut-border btn-press min-h-[44px] bg-card px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-paper-alt"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
