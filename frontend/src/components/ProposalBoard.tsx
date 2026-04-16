type Proposal = {
  id: number;
  proposer: string;
  title: string;
  description: string;
  deadline: number;
  yesVotes: number;
  noVotes: number;
  canceled: boolean;
  executed: boolean;
  state: string;
};

type ProposalForm = {
  title: string;
  description: string;
  durationHours: string;
};

type ProposalBoardProps = {
  proposals: Proposal[];
  proposalForm: ProposalForm;
  walletAddress: string;
  ownerWallet: string;
  eligibleVotesByProposal: Record<number, number[]>;
  submittingProposal: boolean;
  busyProposalId: number | null;
  onProposalFormChange: (field: keyof ProposalForm, value: string) => void;
  onCreateProposal: () => void;
  onVote: (proposalId: number, support: boolean) => void;
  onCancel: (proposalId: number) => void;
  onExecute: (proposalId: number) => void;
};

function formatDeadline(timestamp: number) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(timestamp * 1000));
}

export function ProposalBoard({
  proposals,
  proposalForm,
  walletAddress,
  ownerWallet,
  eligibleVotesByProposal,
  submittingProposal,
  busyProposalId,
  onProposalFormChange,
  onCreateProposal,
  onVote,
  onCancel,
  onExecute
}: ProposalBoardProps) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Governance Board</span>
          <h2>Holder proposals and weighted token voting</h2>
        </div>
        <p>
          Har bir NFT proposal yaratish, ovoz berish va yakuniy natijani execute qilish uchun
          governance key sifatida ishlaydi.
        </p>
      </div>

      <div className="form-grid">
        <label>
          Proposal title
          <input
            value={proposalForm.title}
            onChange={(event) => onProposalFormChange("title", event.target.value)}
            placeholder="Approve summer creator drop"
          />
        </label>
        <label>
          Duration (hours)
          <input
            type="number"
            min="6"
            max="720"
            value={proposalForm.durationHours}
            onChange={(event) => onProposalFormChange("durationHours", event.target.value)}
          />
        </label>
        <label className="label-span-2">
          Description
          <textarea
            rows={4}
            value={proposalForm.description}
            onChange={(event) => onProposalFormChange("description", event.target.value)}
            placeholder="What should the community approve, feature, or schedule next?"
          />
        </label>
      </div>

      <button type="button" className="secondary-button" onClick={onCreateProposal}>
        {submittingProposal ? "Publishing..." : "Create proposal"}
      </button>

      <div className="proposal-list">
        {proposals.length === 0 ? (
          <div className="empty-state">
            <h3>No proposals yet</h3>
            <p>Birinchi governance g'oyani yuboring va community signalni boshlang.</p>
          </div>
        ) : null}

        {proposals.map((proposal) => {
          const totalVotes = proposal.yesVotes + proposal.noVotes;
          const yesShare = totalVotes === 0 ? 0 : (proposal.yesVotes / totalVotes) * 100;
          const canCancel =
            totalVotes === 0 &&
            !proposal.canceled &&
            !proposal.executed &&
            (walletAddress.toLowerCase() === proposal.proposer.toLowerCase() ||
              walletAddress.toLowerCase() === ownerWallet.toLowerCase());
          const canExecute =
            proposal.state === "Succeeded" || proposal.state === "Defeated";
          const eligibleVotes = eligibleVotesByProposal[proposal.id]?.length || 0;

          return (
            <article key={proposal.id} className="proposal-card">
              <div className="proposal-card__header">
                <div>
                  <span className="proposal-card__id">Proposal #{proposal.id}</span>
                  <h3>{proposal.title}</h3>
                </div>
                <span className={`badge badge--${proposal.state.toLowerCase().replace(/ /g, "-")}`}>
                  {proposal.state}
                </span>
              </div>

              <p className="proposal-card__body">{proposal.description}</p>

              <div className="proposal-card__meta">
                <span>By {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}</span>
                <span>Ends {formatDeadline(proposal.deadline)}</span>
                <span>Your eligible votes: {eligibleVotes}</span>
              </div>

              <div className="vote-rail">
                <div className="vote-rail__fill" style={{ width: `${yesShare}%` }} />
              </div>

              <div className="proposal-card__totals">
                <strong>{proposal.yesVotes} yes</strong>
                <strong>{proposal.noVotes} no</strong>
              </div>

              <div className="proposal-card__actions">
                <button
                  type="button"
                  className="vote-button vote-button--yes"
                  disabled={proposal.state !== "Active" || eligibleVotes === 0 || busyProposalId === proposal.id}
                  onClick={() => onVote(proposal.id, true)}
                >
                  Vote yes
                </button>
                <button
                  type="button"
                  className="vote-button vote-button--no"
                  disabled={proposal.state !== "Active" || eligibleVotes === 0 || busyProposalId === proposal.id}
                  onClick={() => onVote(proposal.id, false)}
                >
                  Vote no
                </button>
                <button
                  type="button"
                  className="vote-button"
                  disabled={!canCancel || busyProposalId === proposal.id}
                  onClick={() => onCancel(proposal.id)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="vote-button"
                  disabled={!canExecute || busyProposalId === proposal.id}
                  onClick={() => onExecute(proposal.id)}
                >
                  Execute
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
