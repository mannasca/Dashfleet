import React, { useState } from "react";
import { Link } from "react-router-dom";
import Header from "./components/Header";
import { Calendar, Clock, AlertCircle, CheckCircle } from "lucide-react";
import "./MaintenanceScheduling.css";

export default function MaintenanceScheduling({ vehicles = [] }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Generate scheduled and pending maintenance
  const scheduledVehicles = vehicles
    .filter(v => v.nextService)
    .map(v => ({
      ...v,
      scheduledDate: new Date(v.nextService),
      status: 'scheduled'
    }));

  const pendingVehicles = vehicles
    .filter(v => v.issues > 0)
    .map(v => ({
      ...v,
      priority: v.issues >= 3 ? 'high' : v.issues === 2 ? 'medium' : 'low',
      status: 'pending'
    }))
    .sort((a, b) => b.issues - a.issues); // Sort by issues descending

  // Calendar logic
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getVehiclesForDate = (date) => {
    return scheduledVehicles.filter(v => {
      const scheduled = v.scheduledDate;
      return scheduled.getDate() === date.getDate() &&
             scheduled.getMonth() === date.getMonth() &&
             scheduled.getFullYear() === date.getFullYear();
    });
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const previousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() &&
           month === today.getMonth() &&
           year === today.getFullYear();
  };

  return (
    <>
      <Header />
      <div className="ms-root content-with-header">
        <div className="ms-header">
          <div className="ms-title">
            <h2>Maintenance Scheduling</h2>
            <p className="ms-sub">Schedule and manage vehicle maintenance</p>
          </div>
          <div className="ms-stats">
            <div className="ms-stat-card scheduled">
              <CheckCircle size={24} />
              <div className="ms-stat-info">
                <div className="ms-stat-value">{scheduledVehicles.length}</div>
                <div className="ms-stat-label">Scheduled</div>
              </div>
            </div>
            <div className="ms-stat-card pending">
              <AlertCircle size={24} />
              <div className="ms-stat-info">
                <div className="ms-stat-value">{pendingVehicles.length}</div>
                <div className="ms-stat-label">Pending</div>
              </div>
            </div>
          </div>
        </div>

        <div className="ms-content">
          {/* Calendar Section */}
          <div className="ms-calendar-section">
            <div className="ms-calendar-header">
              <button className="ms-nav-btn" onClick={previousMonth}>←</button>
              <h3 className="ms-month-year">{monthNames[month]} {year}</h3>
              <button className="ms-nav-btn" onClick={nextMonth}>→</button>
            </div>

            <div className="ms-calendar">
              <div className="ms-weekdays">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="ms-weekday">{day}</div>
                ))}
              </div>

              <div className="ms-days">
                {/* Empty cells for days before month starts */}
                {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="ms-day empty"></div>
                ))}

                {/* Days of the month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const date = new Date(year, month, day);
                  const vehiclesOnDate = getVehiclesForDate(date);
                  const hasVehicles = vehiclesOnDate.length > 0;

                  return (
                    <div
                      key={day}
                      className={`ms-day ${isToday(day) ? 'today' : ''} ${hasVehicles ? 'has-events' : ''}`}
                      onClick={() => setSelectedDate(hasVehicles ? date : null)}
                    >
                      <div className="ms-day-number">{day}</div>
                      {hasVehicles && (
                        <div className="ms-event-indicator">
                          {vehiclesOnDate.length}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Date Details */}
            {selectedDate && (
              <div className="ms-selected-date">
                <h4>Scheduled for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h4>
                <div className="ms-selected-vehicles">
                  {getVehiclesForDate(selectedDate).map(v => (
                    <div key={v.id} className="ms-selected-vehicle">
                      <div className="ms-vehicle-icon">🚛</div>
                      <div className="ms-vehicle-info">
                        <div className="ms-vehicle-name">{v.name}</div>
                        <div className="ms-vehicle-meta">ID: {v.id} • Health: {Math.round(v.health)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pending Maintenance Section */}
          <div className="ms-pending-section">
            <div className="ms-section-header">
              <h3>Pending Maintenance</h3>
              <p className="ms-section-sub">Vehicles requiring scheduling (sorted by priority)</p>
            </div>

            {pendingVehicles.length === 0 ? (
              <div className="ms-empty">No pending maintenance at this time.</div>
            ) : (
              <div className="ms-pending-list">
                {pendingVehicles.map(v => (
                  <div key={v.id} className={`ms-pending-card priority-${v.priority}`}>
                    <div className="ms-pending-header">
                      <div className="ms-priority-badge">
                        {v.priority === 'high' ? '🔴' : v.priority === 'medium' ? '🟠' : '🟡'}
                        <span>{v.priority.toUpperCase()}</span>
                      </div>
                      <div className="ms-pending-vehicle">
                        <div className="ms-pending-name">{v.name}</div>
                        <div className="ms-pending-meta">ID: {v.id} • Health: {Math.round(v.health)}%</div>
                      </div>
                    </div>

                    <div className="ms-pending-details">
                      <div className="ms-detail-item">
                        <AlertCircle size={16} />
                        <span>{v.issues} issue{v.issues !== 1 ? 's' : ''} detected</span>
                      </div>
                      <div className="ms-detail-item">
                        <Clock size={16} />
                        <span>Last service: {v.lastMaintenance}</span>
                      </div>
                    </div>

                    <button className="ms-schedule-btn">
                      <Calendar size={16} />
                      Schedule Maintenance
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="ms-footer">
          <Link to="/dashboard" className="ms-back">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </>
  );
}
