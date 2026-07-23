import layout from "./layout";
import loader from "../components/loading";
import { TxArrowsIcon } from "../components/icons";
import { formatSat, truncateTxid } from "./util";

const eventTitle = event => {
  if (event.kind === "deposit") {
    return event.source === "l1" ? "L1 deposit" : "Sidechain deposit";
  }
  if (event.kind === "withdrawal") return "Sidechain withdrawal";
  if (event.kind === "bundle_commitment") return "Bundle committed";
  if (event.kind === "withdrawal_bundle") {
    if (event.status === "succeeded") return "Bundle accepted";
    if (event.status === "failed") return "Bundle rejected";
    return "Bundle submitted";
  }
  return event.kind.replace(/_/g, " ");
};

const eventStatus = status => status.replace(/_/g, " ");

const statusClass = event => {
  if (event.status === "failed" || event.acknowledgement === "rejected") return "danger";
  if (event.status === "submitted" || event.acknowledgement === "pending") return "warning";
  if (event.status === "sidechain_committed") return "info";
  return "success";
};

const eventLocation = event => {
  if (event.l1) return `L1 block ${event.l1.height}`;
  if (event.sidechain) return `Sidechain block ${event.sidechain.height}`;
  return event.source === "l1" ? "L1" : "Sidechain";
};

const eventIdentifier = event => event.m6id || event.sidechain_txid || event.mainchain_txid;

const summary = events => ({
  deposits: events.filter(event => event.kind === "deposit").length,
  withdrawals: events.filter(event => event.kind === "withdrawal").length,
  bundles: new Set(events.filter(event => event.m6id).map(event => event.m6id)).size,
  acknowledgements: events.filter(event => event.kind === "withdrawal_bundle" && event.acknowledgement !== "pending").length,
});

const eventRow = event => {
  const id = eventIdentifier(event);
  const sidechainLink = event.sidechain_txid && `tx/${event.sidechain_txid}`;
  const locationLink = event.sidechain && `block/${event.sidechain.block_hash}`;

  return <div className="peg-event-row" data-eventKind={event.kind} data-eventStatus={event.status}>
    <div className={`peg-event-marker ${statusClass(event)}`} aria-hidden="true"></div>
    <div className="peg-event-main">
      <div className="peg-event-heading">
        <span className="peg-event-title">{eventTitle(event)}</span>
        <span className={`peg-status ${statusClass(event)}`}>{eventStatus(event.status)}</span>
      </div>
      <div className="peg-event-meta">
        {event.value_sats != null ? <span>{formatSat(event.value_sats)}</span> : ""}
        {id ? sidechainLink
          ? <a href={sidechainLink} title={id}>{truncateTxid(id)}</a>
          : <span className="peg-event-id" title={id}>{truncateTxid(id)}</span>
          : ""}
        {event.sequence_number != null ? <span>Sequence {event.sequence_number}</span> : ""}
      </div>
    </div>
    <div className="peg-event-location">
      {locationLink ? <a href={locationLink}>{eventLocation(event)}</a> : eventLocation(event)}
    </div>
  </div>;
};

export default ({ pegEvents, t, ...S }) => {
  const events = pegEvents && pegEvents.events || [];
  const counts = summary(events);

  return layout(
    <div className="container peg-page" key="pegs">
      <div className="peg-page-header">
        <div className="table-header">
          <div className="table-header-icon-container">
            <TxArrowsIcon />
          </div>
          <div>
            <h1 className="table-header-title">Peg activity</h1>
            {pegEvents ? <p className="peg-page-subtitle">
              Sidechain slot {pegEvents.sidechain_id} · tip {pegEvents.sidechain_tip.height}
            </p> : ""}
          </div>
        </div>
        {pegEvents ? <span className={`peg-l1-state ${pegEvents.l1_available ? "online" : "offline"}`}>
          {pegEvents.l1_available ? "L1 lifecycle online" : "Sidechain events only"}
        </span> : ""}
      </div>

      {!pegEvents ? <div className="peg-loading">{loader()}</div> : <div className="peg-content">
        <div className="peg-summary" aria-label="Peg activity summary">
          <div className="peg-summary-item"><span>DEPOSITS</span><strong>{counts.deposits}</strong></div>
          <div className="peg-summary-item"><span>WITHDRAWALS</span><strong>{counts.withdrawals}</strong></div>
          <div className="peg-summary-item"><span>BUNDLES</span><strong>{counts.bundles}</strong></div>
          <div className="peg-summary-item"><span>ACKNOWLEDGEMENTS</span><strong>{counts.acknowledgements}</strong></div>
        </div>

        <div className="peg-timeline-header">
          <h2>Lifecycle events</h2>
          <span>{events.length} events</span>
        </div>
        {!events.length
          ? <div className="peg-empty">No peg activity in this range</div>
          : <div className="peg-timeline">{events.slice().reverse().map(eventRow)}</div>}
      </div>}
    </div>,
    { ...S, t, activeTab: "pegs" },
  );
};
