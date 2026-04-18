import { useEffect, useMemo, useState } from 'react';
import '../styles/SportSelector.css';

export default function SportSelector({
  sports,
  selectedSport,
  selectedSports = [],
  onSelectSport,
  onToggleSport,
  onRemoveSport,
  onCreateSport,
  placeholder = 'Search interests...',
  buttonClassName = 'sport-chip',
  layout = 'wrap',
  containerClassName = '',
  collapsible = false,
  openLabel = 'Select Interest',
  closeLabel = 'Close',
  multiSelect = false,
  allowCreate = false,
  searchOnly = false,
  onSearchQueryChange
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(!collapsible);

  const availableSports = useMemo(
    () => sports.filter((sport) => sport.trim().toLowerCase() !== 'all sports'),
    [sports]
  );

  const filteredSports = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return availableSports;
    }

    return availableSports.filter((sport) =>
      sport.toLowerCase().includes(normalizedQuery)
    );
  }, [query, availableSports]);

  const visibleSports = useMemo(() => {
    if (!multiSelect) {
      return filteredSports;
    }

    return filteredSports.filter((sport) => !selectedSports.includes(sport));
  }, [filteredSports, multiSelect, selectedSports]);

  const handleSelectSport = (sport) => {
    if (multiSelect) {
      onToggleSport?.(sport);
      return;
    }

    onSelectSport?.(sport);
    if (collapsible && !multiSelect) {
      setIsOpen(false);
    }
  };

  const isSportSelected = (sport) => {
    if (multiSelect) {
      return selectedSports.includes(sport);
    }

    return selectedSport === sport;
  };

  const queryValue = query.trim();
  const canCreateFromQuery = allowCreate
    && Boolean(queryValue)
    && !availableSports.some((sport) => sport.toLowerCase() === queryValue.toLowerCase());

  const handleCreateFromQuery = () => {
    if (!canCreateFromQuery) {
      return;
    }

    onCreateSport?.(queryValue);
    setQuery('');
  };

  useEffect(() => {
    onSearchQueryChange?.(query.trim());
  }, [query, onSearchQueryChange]);

  if (collapsible && !isOpen) {
    return (
      <div className={`sport-selector-panel ${containerClassName}`.trim()}>
        <button
          type="button"
          className="sport-open-picker-btn"
          onClick={() => setIsOpen(true)}
        >
          {openLabel}
        </button>
      </div>
    );
  }

  return (
    <div className={`sport-selector-panel ${containerClassName}`.trim()}>
      {collapsible && (
        <div className="sport-picker-top-actions">
          <button
            type="button"
            className="sport-close-picker-btn"
            onClick={() => setIsOpen(false)}
          >
            {closeLabel}
          </button>
        </div>
      )}

      {multiSelect && !searchOnly && selectedSports.length > 0 && (
        <div className="selected-interest-strip" aria-label="Selected interests">
          {selectedSports.map((interest) => (
            <button
              key={interest}
              type="button"
              className="selected-interest-chip"
              onClick={() => {
                if (onRemoveSport) {
                  onRemoveSport(interest);
                  return;
                }

                onToggleSport?.(interest);
              }}
              title={`Remove ${interest}`}
            >
              {interest}
              <span aria-hidden="true">x</span>
            </button>
          ))}
        </div>
      )}

      <div className="sport-search-top-row">
        <input
          className="sport-search-input"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          aria-label="Search interests"
        />
        {canCreateFromQuery && (
          <button
            type="button"
            className="sport-create-btn"
            onClick={handleCreateFromQuery}
          >
            Add interest: {queryValue}
          </button>
        )}
      </div>

      {!searchOnly && (
        <div className={`sport-search-results ${layout}`}>
          {visibleSports.map((sport) => (
            <button
              key={sport}
              className={`${buttonClassName} ${isSportSelected(sport) ? 'active' : ''}`.trim()}
              onClick={() => handleSelectSport(sport)}
              type="button"
            >
              {sport}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
