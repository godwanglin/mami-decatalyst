import { useState, useMemo } from 'react';
import {
  X,
  Search,
  Clock,
  Flame,
  CookingPot,
  Utensils,
  Check,
  Trash2,
  Zap,
  CalendarDays,
} from 'lucide-react';
import {
  DAYS,
  MEAL_SLOTS,
  PLANNER_MODES,
  PLANNER_CATALOG,
  formatRupiah,
} from '../../services/mealPlannerService';

export function SaveItemToPlanModal({ item, onConfirm, onClose }) {
  const [selectedDay, setSelectedDay] = useState(DAYS[0].id);
  const [selectedSlot, setSelectedSlot] = useState(
    item?.kategori === 'sarapan'
      ? 'pagi'
      : item?.kategori === 'makan-malam'
      ? 'malam'
      : 'siang'
  );

  if (!item) return null;

  return (
    <div className="planner-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="planner-modal planner-modal--compact" onClick={(e) => e.stopPropagation()}>
        <div className="planner-modal-header">
          <div>
            <h3 className="planner-modal-title">Simpan ke Meal Plan</h3>
            <p className="planner-modal-sub">Pilih hari & waktu makan untuk hidangan ini</p>
          </div>
          <button
            type="button"
            className="planner-icon-close"
            onClick={onClose}
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        <div className="planner-pending-preview">
          <div className="planner-slot-thumb">
            <img
              src={item.gambar}
              alt={item.nama}
              className="planner-slot-thumb-img"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div className="planner-pending-info">
            <div className="planner-pending-name">{item.nama}</div>
            <div className="planner-pending-meta">
              <span>{formatRupiah(item.harga)}</span>
              <span>·</span>
              <span>{item.kalori} kkal</span>
              <span>·</span>
              <span>{item.type === 'resep' ? 'Masak Sendiri' : item.tempat}</span>
            </div>
          </div>
        </div>

        <div className="planner-modal-section">
          <span className="planner-field-label">Pilih Hari</span>
          <div className="planner-choice-grid">
            {DAYS.map((day) => (
              <button
                key={day.id}
                type="button"
                className={`planner-choice-pill ${selectedDay === day.id ? 'is-active' : ''}`}
                onClick={() => setSelectedDay(day.id)}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        <div className="planner-modal-section">
          <span className="planner-field-label">Waktu Makan</span>
          <div className="planner-choice-row">
            {MEAL_SLOTS.map((slot) => (
              <button
                key={slot.id}
                type="button"
                className={`planner-choice-pill ${selectedSlot === slot.id ? 'is-active' : ''}`}
                onClick={() => setSelectedSlot(slot.id)}
              >
                {slot.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="planner-btn-primary"
          onClick={() => onConfirm(selectedDay, selectedSlot, item.uid)}
        >
          <CalendarDays size={16} strokeWidth={2.5} />
          <span>Simpan ke Jadwal</span>
        </button>
      </div>
    </div>
  );
}

export default function MealSlotPickerModal({
  dayLabel,
  slotLabel,
  currentUid,
  defaultMode = 'semua',
  onSelect,
  onRemove,
  onClose,
}) {
  const [query, setQuery] = useState('');
  const [filterMode, setFilterMode] = useState(defaultMode);
  const [onlyFast, setOnlyFast] = useState(false);
  const [limit, setLimit] = useState(30);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PLANNER_CATALOG.filter((item) => {
      if (filterMode === 'menu' && item.type !== 'menu') return false;
      if (filterMode === 'resep' && item.type !== 'resep') return false;
      if (onlyFast && !(item.type === 'resep' && item.isFast)) return false;
      if (!q) return true;
      return (
        item.nama.toLowerCase().includes(q) ||
        item.tempat.toLowerCase().includes(q) ||
        item.kategori.toLowerCase().includes(q)
      );
    }).sort((a, b) => a.harga - b.harga);
  }, [query, filterMode, onlyFast]);

  const visibleItems = filteredItems.slice(0, limit);

  return (
    <div className="planner-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="planner-modal" onClick={(e) => e.stopPropagation()}>
        <div className="planner-modal-header">
          <div>
            <h3 className="planner-modal-title">
              Pilih Menu · {dayLabel} ({slotLabel})
            </h3>
            <p className="planner-modal-sub">
              {filteredItems.length} pilihan menu & resep tersedia
            </p>
          </div>
          <button
            type="button"
            className="planner-icon-close"
            onClick={onClose}
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        <div className="planner-search-box">
          <Search size={15} className="planner-search-icon" />
          <input
            type="text"
            className="planner-search-input"
            placeholder="Cari menu, resep, atau warung..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(30);
            }}
          />
          {query && (
            <button
              type="button"
              className="planner-search-clear"
              onClick={() => setQuery('')}
              aria-label="Hapus pencarian"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="planner-modal-filters">
          {PLANNER_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`planner-filter-pill ${filterMode === m.id ? 'is-active' : ''}`}
              onClick={() => {
                setFilterMode(m.id);
                if (m.id === 'menu') setOnlyFast(false);
                setLimit(30);
              }}
            >
              {m.label}
            </button>
          ))}
          <button
            type="button"
            className={`planner-filter-pill ${onlyFast ? 'is-active' : ''}`}
            onClick={() => {
              setOnlyFast((prev) => !prev);
              if (!onlyFast && filterMode === 'menu') setFilterMode('resep');
              setLimit(30);
            }}
          >
            <Zap size={12} />
            <span>≤ 15 mnt</span>
          </button>
        </div>

        {currentUid && (
          <button
            type="button"
            className="planner-remove-slot-bar"
            onClick={onRemove}
          >
            <Trash2 size={14} />
            <span>Kosongkan slot ini</span>
          </button>
        )}

        <div className="planner-picker-list">
          {visibleItems.length === 0 ? (
            <div className="planner-empty-inline">
              Tidak ada menu atau resep yang cocok dengan pencarianmu.
            </div>
          ) : (
            <>
              {visibleItems.map((item) => {
                const isSelected = item.uid === currentUid;
                return (
                  <button
                    key={item.uid}
                    type="button"
                    className={`planner-picker-item ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => onSelect(item.uid)}
                  >
                    <div className="planner-picker-thumb">
                      <img
                        src={item.gambar}
                        alt={item.nama}
                        className="planner-slot-thumb-img"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <span className="planner-picker-fallback" aria-hidden="true">
                        {item.type === 'resep' ? <CookingPot size={16} /> : <Utensils size={16} />}
                      </span>
                    </div>
                    <div className="planner-picker-body">
                      <div className="planner-picker-name">{item.nama}</div>
                      <div className="planner-picker-tags">
                        <span
                          className={`planner-type-tag ${
                            item.type === 'resep' ? 'is-resep' : 'is-menu'
                          }`}
                        >
                          {item.type === 'resep' ? 'Masak' : item.tempat}
                        </span>
                        {item.isFast && (
                          <span className="planner-fast-tag">
                            <Clock size={10} />
                            {item.waktu} mnt
                          </span>
                        )}
                        <span className="planner-kcal-tag">
                          <Flame size={10} />
                          {item.kalori} kkal
                        </span>
                      </div>
                    </div>
                    <div className="planner-picker-right">
                      <span className="planner-picker-price">{formatRupiah(item.harga)}</span>
                      {isSelected && (
                        <span className="planner-picked-check">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

              {filteredItems.length > limit && (
                <button
                  type="button"
                  className="planner-load-more"
                  onClick={() => setLimit((prev) => prev + 30)}
                >
                  Tampilkan lebih banyak ({visibleItems.length} dari {filteredItems.length})
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
