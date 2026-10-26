import React from 'react';

export default function DirectAnswerBanner({ questionInfo, alerts = [], placeName, timezone }) {
  if (!questionInfo || !questionInfo.isQuestion) {
    return null;
  }

  const phrase = questionInfo.hazardPhrase || 'warning';
  const targetPlace = placeName || questionInfo.targetPlace || 'this location';

  // Extract core hazard keywords (e.g. 'heat', 'flood', 'tornado')
  const rawTarget = (questionInfo.hazardType || phrase || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .trim();

  const searchKeywords = rawTarget
    .split(/\s+/)
    .filter((w) => Boolean(w) && !['warning', 'alert', 'watch', 'advisory'].includes(w));

  // Check if any active alert matches the questioned hazard
  const matchingAlert = alerts.find((alert) => {
    const text = `${alert.event} ${alert.headline} ${alert.description}`.toLowerCase();
    if (searchKeywords.length === 0) return true;
    return searchKeywords.some((keyword) => text.includes(keyword));
  });

  const hasAnswer = Boolean(matchingAlert);

  return (
    <div className="sw-direct-answer" role="region" aria-label="Direct Query Answer">
      <div className={`sw-answer-badge ${hasAnswer ? 'yes' : 'no'}`}>
        {hasAnswer ? 'YES' : 'NO'}
      </div>
      <p className="sw-answer-text">
        {hasAnswer ? (
          <>
            <strong>{matchingAlert.event}</strong> is currently active for {targetPlace}
            {matchingAlert.expires ? (
              <> until {new Date(matchingAlert.expires).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: timezone || undefined })}</>
            ) : null}
            .
          </>
        ) : (
          <>
            No active <strong>{phrase}</strong> was returned for <strong>{targetPlace}</strong> from official National Weather Service reports.
          </>
        )}
      </p>
    </div>
  );
}
