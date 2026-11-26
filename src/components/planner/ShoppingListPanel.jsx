import { useState, useMemo } from 'react';
import {
  ShoppingBasket,
  Check,
  RotateCcw,
  Search,
  X,
  Sparkles,
  CalendarDays,
} from 'lucide-react';
import { formatRupiah } from '../../services/mealPlannerService';

const SHOPPING_CATEGORIES = [
  { id: 'semua', label: 'Semua' },
  { id: 'protein', label: 'Protein' },
  { id: 'sayur', label: 'Sayur' },
  { id: 'karbo', label: 'Karbo' },
  { id: 'bumbu', label: 'Bumbu' },
];

export default function ShoppingListPanel({
  shoppingList,
  checkedSet,
  onToggleCheck,
  onResetChecks,
  onAutoGenerate,
  onSwitchToSchedule,
}) {
  const [category, setCategory] = useState('semua');
  const [query, setQuery] = useState('');

  const { items, totalIngredients, totalEstimatedBahanCost } = shoppingList;

  const checkedCount = useMemo(
    () => items.filter((item) => checkedSet.has(item.id)).length,
    [items, checkedSet]
  );

  const remainingCost = useMemo(
    () =>
      items.reduce(
        (acc, item) => (checkedSet.has(item.id) ? acc : acc + item.estimatedCost),
        0
      ),
    [items, checkedSet]
  );

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (category !== 'semua' && item.kategori !== category) return false;
      if (q && !item.nama.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, category, query]);

  if (totalIngredients === 0) {
    return (
      <section className="planner-empty-card">
        <ShoppingBasket size={34} strokeWidth={1.6} className="planner-empty-icon" />
        <h3 className="planner-empty-title">Daftar Belanja Masih Kosong</h3>
        <p className="planner-empty-desc">
          Susun minimal 1 jadwal makan di tab Jadwal 7 Hari agar MAMI bisa otomatis merangkum bahan belanjaanmu.
        </p>
        <div className="planner-empty-actions">
          <button type="button" className="planner-btn-primary" onClick={onAutoGenerate}>
            <Sparkles size={15} />
            <span>Auto-Susun 7 Hari</span>
          </button>
          <button type="button" className="planner-btn-secondary" onClick={onSwitchToSchedule}>
            <CalendarDays size={15} />
            <span>Isi Manual</span>
          </button>
        </div>
      </section>
    );
  }

  const progressPct = Math.round((checkedCount / totalIngredients) * 100);

  return (
    <section className="planner-shopping-wrap">
      <div className="planner-shopping-summary">
        <div className="planner-shopping-top">
          <div>
            <div className="planner-shopping-title">Checklist Belanja Mingguan</div>
            <div className="planner-shopping-sub">
              {checkedCount} dari {totalIngredients} bahan sudah siap di kos ({progressPct}%)
            </div>
          </div>
          <button
            type="button"
            className="planner-btn-ghost"
            onClick={onResetChecks}
            disabled={checkedCount === 0}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="planner-progress-track">
          <div className="planner-progress-fill is-safe" style={{ width: `${progressPct}%` }} />
        </div>

        <div className="planner-shopping-costs">
          <span>
            Estimasi total bahan: <strong>{formatRupiah(totalEstimatedBahanCost)}</strong>
          </span>
          <span>
            Perlu dibeli: <strong>{formatRupiah(remainingCost)}</strong>
          </span>
        </div>
      </div>

      <div className="planner-search-box">
        <Search size={15} className="planner-search-icon" />
        <input
          type="text"
          className="planner-search-input"
          placeholder="Cari bahan belanjaan..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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

      <div className="planner-filter-row">
        {SHOPPING_CATEGORIES.map((cat) => {
          const count =
            cat.id === 'semua'
              ? items.length
              : items.filter((i) => i.kategori === cat.id).length;
          return (
            <button
              key={cat.id}
              type="button"
              className={`planner-filter-pill ${category === cat.id ? 'is-active' : ''}`}
              onClick={() => setCategory(cat.id)}
            >
              <span>{cat.label}</span>
              <span className="planner-pill-count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="planner-shopping-list">
        {filteredItems.length === 0 ? (
          <div className="planner-empty-inline">
            Tidak ada bahan yang cocok dengan filter saat ini.
          </div>
        ) : (
          filteredItems.map((item) => {
            const isChecked = checkedSet.has(item.id);
            return (
              <button
                key={item.id}
                type="button"
                className={`planner-shop-item ${isChecked ? 'is-checked' : ''}`}
                onClick={() => onToggleCheck(item.id)}
                role="checkbox"
                aria-checked={isChecked}
              >
                <span className={`planner-checkbox ${isChecked ? 'is-checked' : ''}`}>
                  {isChecked && <Check size={12} strokeWidth={3} />}
                </span>

                <div className="planner-shop-info">
                  <div className="planner-shop-name">{item.nama}</div>
                  <div className="planner-shop-meta">
                    <span className="planner-shop-cat">{item.kategori}</span>
                    <span>
                      Dipakai {item.occurrences}x · {item.totalUnits} {item.satuan}
                    </span>
                  </div>
                </div>

                <div className="planner-shop-price">
                  <span>{formatRupiah(item.estimatedCost)}</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
