import React from "react";
import { Link } from "react-router-dom";
import "./VehiclesList.css";

function VehiclesList({ vehicles = [] }) {
  return (
    <div className="vl-container">
      <div className="vl-header">
        <h2>All Vehicles</h2>
        <Link to="/" className="vl-back">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="vl-table-wrap">
        <table className="vl-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Health</th>
              <th>Next Service</th>
              <th>Issues</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id}>
                <td>{v.id}</td>
                <td>{v.name}</td>
                <td>{v.health}%</td>
                <td>{v.nextService}</td>
                <td>{v.issues}</td>
              </tr>
            ))}

            {vehicles.length === 0 && (
              <tr>
                <td colSpan="5" className="vl-empty">
                  No vehicles loaded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default VehiclesList;