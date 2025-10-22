import React from "react";
import { Link } from "react-router-dom";
import Header from "./components/Header";
import "./ActiveMaintence.css";

export default function ActiveMaintenance({ vehicles = [] }) {
  const list = vehicles.filter((v) => v.inMaintenance);
  const count = list.length;

  const fmtDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString();
  };

  const getRepairInfo = (v) => {
    const cost = v.repairCost ?? Math.round(50 + Math.random() * 950); // dollars estimate
    const etaDays = v.etaDays ?? Math.max(1, Math.round(Math.random() * 10));
    // This is your current display logic: show (issues - 1) unless an explicit unresolvedIssues exists
    const unresolved = v.unresolvedIssues ?? Math.max(0, (Number(v.issues) || 0) - 1);
    return { cost, etaDays, etaDate: fmtDate(etaDays), unresolved };
  };

  return (
    <>
      <Header />
      <div className="am-root content-with-header">
        <div className="am-header">
          <div className="am-title">
            <h2>Active Maintenance</h2>
            <p className="am-sub">Vehicles currently being repaired</p>
          </div>
          <div className="am-count" title={`${count} in maintenance`}>{count}</div>
        </div>

        {count === 0 ? (
          <div className="am-empty">No vehicles are currently in maintenance.</div>
        ) : (
          <div className="am-list">
            {list.map((v) => {
              const info = getRepairInfo(v);
              return (
                <div key={v.id} className="am-item">
                  <div className="am-item-left">
                    <div className="am-name">{v.name}</div>
                    <div className="am-meta">ID {v.id} • Next: {v.nextService}</div>
                  </div>

                  <div className="am-item-right am-info">
                    <div className="am-info-item">
                      <div className="label">Est. cost</div>
                      <div className="value">${info.cost}</div>
                    </div>

                    <div className="am-info-item">
                      <div className="label">ETA</div>
                      <div className="value">
                        {info.etaDate} <span className="muted">({info.etaDays}d)</span>
                      </div>
                    </div>

                    <div className={`am-info-item unresolved ${info.unresolved ? "has" : "none"}`}>
                      <div className="label">Unresolved</div>
                      <div className="value">
                        {info.unresolved > 0 ? `${info.unresolved} issue${info.unresolved > 1 ? "s" : ""}` : "None"}
                      </div>
                    </div>

                    {/* IMPORTANT: pass the SAME number you display */}
                    <Link
                      to={`/vehicles/${v.id}`}
                      state={{
                        from: "maintenance",
                        issues: info.unresolved, // <-- matches the label shown above
                        vehicleName: v.name,
                      }}
                      className="am-details"
                    >
                      View
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
