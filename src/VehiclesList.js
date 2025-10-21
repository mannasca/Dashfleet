import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "./components/Header";
import "./VehiclesList.css";

function VehiclesList({ vehicles = [] }) {
  // filtering / sorting state
  const [nameQuery, setNameQuery] = useState("");
  const [issuesOnly, setIssuesOnly] = useState(false);
  const [serviceWindow, setServiceWindow] = useState("all"); // "all" | "7" | "14" | "30"
  const [sortBy, setSortBy] = useState("id");
  const [sortDir, setSortDir] = useState("asc"); // "asc" | "desc"

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    const now = new Date();
    const maxDays = serviceWindow === "all" ? null : Number(serviceWindow);

    const matchesServiceWindow = (nextService) => {
      if (!maxDays) return true;
      if (!nextService) return false;
      const d = new Date(nextService);
      const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= maxDays;
    };

    const list = vehicles.filter((v) => {
      if (nameQuery && !(`${v.name || ""}`.toLowerCase().includes(nameQuery.toLowerCase()))) return false;
      if (issuesOnly && !(Number(v.issues) > 0)) return false;
      if (!matchesServiceWindow(v.nextService)) return false;
      return true;
    });

    const cmp = (a, b) => {
      let A = a[sortBy];
      let B = b[sortBy];

      // normalize types
      if (sortBy === "name") {
        A = (A || "").toString().toLowerCase();
        B = (B || "").toString().toLowerCase();
        return A < B ? -1 : A > B ? 1 : 0;
      }

      if (sortBy === "nextService") {
        const da = A ? new Date(A) : new Date(8640000000000000);
        const db = B ? new Date(B) : new Date(8640000000000000);
        return da - db;
      }

      // numeric fallback (health, issues, id)
      const na = Number(A || 0);
      const nb = Number(B || 0);
      return na - nb;
    };

    list.sort((a, b) => (sortDir === "asc" ? cmp(a, b) : -cmp(a, b)));

    return list;
  }, [vehicles, nameQuery, issuesOnly, serviceWindow, sortBy, sortDir]);

  return (
    <>
      <Header />
      <div className="vl-container content-with-header">
        <div className="vl-header">
          <h2>All Vehicles</h2>
        </div>

        <div className="vl-controls">
        <input
          type="search"
          placeholder="Search name…"
          value={nameQuery}
          onChange={(e) => setNameQuery(e.target.value)}
          className="vl-search"
        />

        <label className="vl-toggle">
          <input type="checkbox" checked={issuesOnly} onChange={(e) => setIssuesOnly(e.target.checked)} />
          Only with issues
        </label>

        <label className="vl-select">
          Upcoming service
          <select value={serviceWindow} onChange={(e) => setServiceWindow(e.target.value)}>
            <option value="all">All</option>
            <option value="7">Next 7 days</option>
            <option value="14">Next 14 days</option>
            <option value="30">Next 30 days</option>
          </select>
        </label>
      </div>

      <div className="vl-table-wrap">
        <table className="vl-table">
          <thead>
            <tr>
              <th className="vl-sortable" onClick={() => handleSort("id")}>
                #
                <span className={`vl-sort-indicator ${sortBy === "id" ? sortDir : ""}`} />
              </th>
              <th className="vl-sortable" onClick={() => handleSort("name")}>
                Name
                <span className={`vl-sort-indicator ${sortBy === "name" ? sortDir : ""}`} />
              </th>
              <th className="vl-sortable" onClick={() => handleSort("health")}>
                Health
                <span className={`vl-sort-indicator ${sortBy === "health" ? sortDir : ""}`} />
              </th>
              <th className="vl-sortable" onClick={() => handleSort("nextService")}>
                Next Service
                <span className={`vl-sort-indicator ${sortBy === "nextService" ? sortDir : ""}`} />
              </th>
              <th className="vl-sortable" onClick={() => handleSort("issues")}>
                Issues
                <span className={`vl-sort-indicator ${sortBy === "issues" ? sortDir : ""}`} />
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.id}>
                <td>{v.id}</td>
                <td>{v.name}</td>
                <td>{v.health}%</td>
                <td>{v.nextService}</td>
                <td>{v.issues}</td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan="5" className="vl-empty">
                  No vehicles match the filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
    </>
  );
}

export default VehiclesList;