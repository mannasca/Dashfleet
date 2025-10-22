// src/VehicleHistory.jsx
import React, { useMemo } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import "./VehicleHistory.css";

const SERVICE_TYPES = [
  "Battery Check",
  "Brake Service",
  "Software Update",
  "Tire Rotation",
  "Cooling System",
  "HV Power Electronics",
  "Suspension Inspection",
  "Charging Port",
  "HVAC Service",
  "Steering Alignment",
];

// per-type copy + cost bands for variety
const TYPE_META = {
  "Battery Check":      { notes: ["Cell balancing & calibration", "Thermal management tune", "SOH diagnostics"], cost: [220, 380] },
  "Brake Service":      { notes: ["Front pads replaced", "Rotor skim + fluid", "Parking brake recalibration"], cost: [140, 320] },
  "Software Update":    { notes: ["Efficiency firmware update", "ADAS patch applied", "BMS update"], cost: [0, 0] },
  "Tire Rotation":      { notes: ["Front–rear rotation", "Rotation + pressure check"], cost: [40, 80] },
  "Cooling System":     { notes: ["Coolant top-up & bleed", "Pump inspection", "Radiator flush"], cost: [180, 420] },
  "HV Power Electronics": { notes: ["Inverter thermal paste refresh", "DC/DC inspection", "IGBT check"], cost: [260, 520] },
  "Suspension Inspection": { notes: ["Bushing check", "Control arm torque", "Dampers inspection"], cost: [120, 260] },
  "Charging Port":      { notes: ["Connector clean & reseat", "CCS latch replacement", "Wiring continuity"], cost: [90, 210] },
  "HVAC Service":       { notes: ["Cabin filter + recharge", "Heat pump efficiency test"], cost: [110, 240] },
  "Steering Alignment": { notes: ["Toe adjust", "Camber/caster check"], cost: [80, 160] },
};

// tiny deterministic PRNG (Mulberry32)
function mulberry32(seed) {
  return function() {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function strSeed(s) {
  // simple string -> int hash
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = (h ^ s.charCodeAt(i)) * 16777619;
  return (h >>> 0);
}
function shuffleDeterministic(arr, seedInt) {
  const rng = mulberry32(seedInt);
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function randBetween(rng, [lo, hi]) {
  if (lo === hi) return lo;
  return Math.round(lo + rng() * (hi - lo));
}

// derive issues strictly from state/vehicle
function getIssuesCount(vehicle, state) {
  if (state && state.issues != null) return Number(state.issues);
  if (vehicle && vehicle.issues != null) return Number(vehicle.issues);
  return 0;
}

/**
 * Build history with:
 * - exactly `pendingIssues` PENDING rows
 * - unique, deterministically shuffled issue types per vehicle (id+name seeded)
 * - a couple of older COMPLETED rows for context
 */
function buildHistory(vehicle, pendingIssues) {
  const seed = strSeed(String(vehicle?.id ?? "") + "|" + String(vehicle?.name ?? "")) ^ pendingIssues;
  const rng = mulberry32(seed);

  // unique types per vehicle
  const shuffled = shuffleDeterministic(SERVICE_TYPES, seed);
  const typesForPending = shuffled.slice(0, Math.min(pendingIssues, shuffled.length));

  const rows = [];

  // create pending rows (newest first by date after sort)
  for (let i = 0; i < typesForPending.length; i++) {
    const t = typesForPending[i];
    const meta = TYPE_META[t] || { notes: ["Service"], cost: [120, 240] };
    const note = meta.notes[Math.floor(rng() * meta.notes.length)];
    const cost = randBetween(rng, meta.cost);

    rows.push({
      date: isoDaysAgo(7 * (i + 1)), // spaced 1 week apart
      type: t,
      status: "Pending",
      cost,
      notes: note,
    });
  }

  // older completed rows (use remaining shuffled types)
  const remaining = shuffled.filter(t => !typesForPending.includes(t));
  const olderCount = Math.max(2, 3 - pendingIssues);
  for (let i = 0; i < olderCount && i < remaining.length; i++) {
    const t = remaining[i];
    const meta = TYPE_META[t] || { notes: ["Service"], cost: [120, 240] };
    const note = meta.notes[Math.floor(rng() * meta.notes.length)];
    const cost = randBetween(rng, meta.cost);
    rows.push({
      date: isoDaysAgo(30 * (i + 2) + 5), // ~2+ months back
      type: t,
      status: "Completed",
      cost,
      notes: note,
    });
  }

  // newest first
  rows.sort((a, b) => new Date(b.date) - new Date(a.date));
  return rows;
}

function isoDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export default function VehicleHistory({ vehicles = [] }) {
  const { id } = useParams();
  const location = useLocation();

  const vehicle = useMemo(
    () => vehicles.find(v => String(v.id) === String(id)),
    [vehicles, id]
  );

  const pendingCount = getIssuesCount(vehicle, location.state);
  const history = useMemo(() => (vehicle ? buildHistory(vehicle, pendingCount) : []), [vehicle, pendingCount]);

  if (!vehicle) {
    return (
      <div className="vh-root">
        <div className="vh-header"><div className="vh-title"><h2>Vehicle not found</h2></div></div>
        <Link className="vh-back" to={location.state?.from === "maintenance" ? "/maintenance" : "/vehicles"}>← Back</Link>
      </div>
    );
  }

  return (
    <div className="vh-root">
      <div className="vh-header">
        <div className="vh-title">
          <h1>{vehicle.name} — Maintenance History</h1>
          <div className="vh-sub">
            ID {vehicle.id} · Health <b>{vehicle.health}%</b> · Issues <b>{pendingCount}</b> · Next Service <b>{vehicle.nextService}</b>
          </div>
        </div>
        <div className="vh-count" title="Unresolved issues">{pendingCount}</div>
      </div>

      {history.length === 0 ? (
        <div className="vh-empty">No maintenance history recorded for this vehicle yet.</div>
      ) : (
        <div className="vh-list">
          {history.map((evt, i) => {
            const cls =
              evt.status === "Pending" ? "pending" :
              evt.status === "Completed" ? "completed" : "failed";
            return (
              <div className="vh-item" key={`${evt.date}-${evt.type}-${i}`}>
                <div className="vh-item-left">
                  <div className="vh-name">{evt.type}</div>
                  <div className="vh-meta">{evt.notes}</div>
                </div>
                <div className="vh-item-right">
                  <div className="vh-info">
                    <div className="label">Status</div>
                    <div className={`vh-status ${cls}`}>{evt.status}</div>
                  </div>
                  <div className="vh-info">
                    <div className="label">Cost</div>
                    <div className="value">{evt.cost != null ? `$${evt.cost}` : "—"}</div>
                  </div>
                  <div className="vh-info">
                    <div className="label">Date</div>
                    <div className="value">{evt.date}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Link className="vh-back" to={location.state?.from === "maintenance" ? "/maintenance" : "/vehicles"}>← Back</Link>
    </div>
  );
}
