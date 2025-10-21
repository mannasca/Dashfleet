import React from "react";
import { Link } from "react-router-dom";
import Header from "./components/Header";
import TruckViewer from "./TruckViewer";
import "./PredictedFailures.css";

// Map issues to actionable insights
const ISSUE_DATABASE = {
  brakes: {
    label: "Brakes",
    description: "Brake pad wear exceeding threshold",
    insight: "Replace brake pads immediately. Inspect rotors for scoring. Check brake fluid level.",
    severity: "critical",
    area: "brakes"
  },
  transmission: {
    label: "Transmission",
    description: "Shifting delays or rough engagement",
    insight: "Flush transmission fluid. Inspect clutch assembly. May need software update or sensor replacement.",
    severity: "high",
    area: "transmission"
  },
  battery: {
    label: "Battery",
    description: "Battery capacity below 70%",
    insight: "Test battery health. Clean terminals. Consider replacement if over 3 years old.",
    severity: "medium",
    area: "battery"
  },
  suspension: {
    label: "Suspension",
    description: "Unusual wear patterns detected",
    insight: "Inspect shock absorbers and struts. Check alignment. Replace worn bushings.",
    severity: "medium",
    area: "suspension"
  },
  tires: {
    label: "Tires",
    description: "Tread depth below safe limit",
    insight: "Replace tires immediately. Check tire pressure. Rotate remaining tires.",
    severity: "critical",
    area: "tires"
  },
  cooling: {
    label: "Cooling System",
    description: "Coolant temperature elevated",
    insight: "Check coolant level. Inspect radiator for leaks. Test thermostat operation.",
    severity: "high",
    area: "cooling"
  },
  electrical: {
    label: "Electrical",
    description: "Voltage fluctuations detected",
    insight: "Test alternator output. Inspect wiring harness. Check for loose connections.",
    severity: "medium",
    area: "electrical"
  }
};

const ISSUE_TYPES = Object.keys(ISSUE_DATABASE);

export default function PredictedFailures({ vehicles = [] }) {
  const [selectedVehicle, setSelectedVehicle] = React.useState(null);

  // Generate predicted failures - vehicles with issues > 0
  const failureList = vehicles
    .filter((v) => v.issues > 0)
    .map((v) => {
      // Assign random issue types based on issue count
      const issueTypes = [];
      const count = Math.min(v.issues, 3); // max 3 different issue types
      const shuffled = [...ISSUE_TYPES].sort(() => Math.random() - 0.5);
      for (let i = 0; i < count; i++) {
        issueTypes.push(shuffled[i]);
      }
      return { ...v, issueTypes };
    });

  const count = failureList.length;

  const handleVehicleClick = (vehicle) => {
    setSelectedVehicle(selectedVehicle?.id === vehicle.id ? null : vehicle);
  };

  return (
    <>
      <Header />
      <div className="pf-root content-with-header">
        <div className="pf-header">
          <div className="pf-title">
            <h2>Predicted Failures</h2>
            <p className="pf-sub">Vehicles requiring attention</p>
          </div>
          <div className="pf-count" title={`${count} predicted failures`}>
            {count}
          </div>
        </div>

      {count === 0 ? (
        <div className="pf-empty">No predicted failures at this time.</div>
      ) : (
        <div className="pf-content">
          <div className="pf-list">
            {failureList.map((v) => {
              const isSelected = selectedVehicle?.id === v.id;
              return (
                <div key={v.id} className="pf-vehicle-section">
                  <div
                    className={`pf-vehicle-header ${isSelected ? "active" : ""}`}
                    onClick={() => handleVehicleClick(v)}
                  >
                    <div className="pf-vehicle-info">
                      <div className="pf-vehicle-name">{v.name}</div>
                      <div className="pf-vehicle-meta">
                        ID {v.id} • Health: {Math.round(v.health)}% • Next Service: {v.nextService}
                      </div>
                    </div>
                    <div className="pf-vehicle-summary">
                      <div className={`pf-issue-badge ${v.issues === 1 ? "severity-medium" : v.issues === 2 ? "severity-high" : "severity-critical"}`}>
                        {v.issues} issue{v.issues !== 1 ? "s" : ""}
                      </div>
                      <div className="pf-expand-icon">{isSelected ? "−" : "+"}</div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="pf-vehicle-details">
                      <div className="pf-issues-list">
                        {v.issueTypes.map((issueType) => {
                          const issue = ISSUE_DATABASE[issueType];
                          return (
                            <div key={issueType} className={`pf-issue-card severity-${issue.severity}`}>
                              <div className="pf-issue-header">
                                <div className="pf-issue-icon">⚠</div>
                                <div>
                                  <div className="pf-issue-label">{issue.label}</div>
                                  <div className="pf-issue-desc">{issue.description}</div>
                                </div>
                              </div>
                              <div className="pf-issue-insight">
                                <div className="pf-insight-label">Actionable Insight:</div>
                                <div className="pf-insight-text">{issue.insight}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="pf-truck-viewer">
                        <div className="pf-viewer-label">3D Problem Visualization</div>
                        <TruckViewer highlightAreas={v.issueTypes} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="pf-footer">
        <Link to="/" className="pf-back">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
    
    </>
  );
}
