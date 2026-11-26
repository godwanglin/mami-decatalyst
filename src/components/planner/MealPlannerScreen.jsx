import { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  ShoppingBasket,
  Sparkles,
  RotateCcw,
  Shuffle,
  Plus,
  Trash2,
  Flame,
  Clock,
  Wallet,
  Activity,
  CookingPot,
  Utensils,
  CheckCircle2,
  AlertTriangle,
  Save,
  Check,
} from 'lucide-react';
import {
  DAYS,
  MEAL_SLOTS,
  PLANNER_MODES,
  getModeBudgetConfig,
  isValidBahanId,
  createEmptyPlan,
  getCatalogItem,
  generateWeeklyPlan,
  randomizeSingleDay,
  computeWeeklySummary,
  buildShoppingList,
  loadUserMealPlan,
  saveUserMealPlan,
  formatRupiah,
} from '../../services/mealPlannerService';
import MealSlotPickerModal, { SaveItemToPlanModal } from './MealSlotPickerModal';
import ShoppingListPanel from './ShoppingListPanel';

export default function MealPlannerScreen({
  onBack,
  onSwitchToHome,
  user,
  storageUserId = '',
  pendingItem = null,
  onClearPendingItem,
}) {
  const uid = storageUserId || user?.uid || '';

  const [initialData] = useState(() => loadUserMealPlan(uid));
  const [loadedUid, setLoadedUid] = useState(() => (uid ? uid : null));

  const [weeklyBudget, setWeeklyBudget] = useState(initialData.weeklyBudget);
  const [budgetText, setBudgetText] = useState(String(initialData.weeklyBudget));
  const [mode, setMode] = useState(initialData.mode);
  const [plan, setPlan] = useState(initialData.plan);
  const [checkedBahanIds, setCheckedBahanIds] = useState(initialData.checkedBahanIds);
  const [savedNotice, setSavedNotice] = useState(true);

  const [activeTab, setActiveTab] = useState('schedule');
  const [selectedDay, setSelectedDay] = useState(DAYS[0].id);
  const [showAllDays, setShowAllDays] = useState(false);
  const [pickerTarget, setPickerTarget] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    if (!uid || uid === loadedUid) return;
    const loaded = loadUserMealPlan(uid);
    setWeeklyBudget(loaded.weeklyBudget);
    setBudgetText(String(loaded.weeklyBudget));
    setMode(loaded.mode);
    setPlan(loaded.plan);
    setCheckedBahanIds(loaded.checkedBahanIds);
    setLoadedUid(uid);
    setSavedNotice(true);
  }, [uid, loadedUid]);

  useEffect(() => {
    if (!uid || loadedUid !== uid) return;
    const ok = saveUserMealPlan(uid, {
      weeklyBudget,
      mode,
      plan,
      checkedBahanIds,
    });
    if (ok) setSavedNotice(true);
  }, [uid, loadedUid, weeklyBudget, mode, plan, checkedBahanIds]);

  useEffect(() => {
    if (!toastMsg) return undefined;
    const timer = setTimeout(() => setToastMsg(''), 2600);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  const summary = useMemo(
    () => computeWeeklySummary(plan, weeklyBudget),
    [plan, weeklyBudget]
  );

  const shoppingList = useMemo(() => buildShoppingList(plan), [plan]);
  const checkedSet = useMemo(() => new Set(checkedBahanIds), [checkedBahanIds]);

  const persistImmediately = (overrides = {}) => {
    if (!uid) return false;
    const payload = {
      weeklyBudget: overrides.weeklyBudget ?? weeklyBudget,
      mode: overrides.mode ?? mode,
      plan: overrides.plan ?? plan,
      checkedBahanIds: overrides.checkedBahanIds ?? checkedBahanIds,
    };
    const ok = saveUserMealPlan(uid, payload);
    if (ok) setSavedNotice(true);
    return ok;
  };

  const modeConfig = getModeBudgetConfig(mode);

  const handleManualSave = () => {
    const clamped = Math.max(
      modeConfig.minBudget,
      Math.min(5000000, weeklyBudget || modeConfig.defaultBudget)
    );
    setWeeklyBudget(clamped);
    setBudgetText(String(clamped));
    if (persistImmediately({ weeklyBudget: clamped })) {
      setToastMsg('Jadwal 7 hari berhasil disimpan!');
    }
  };

  const handleBudgetInputChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '');
    setBudgetText(digits);
    const num = Number(digits);
    if (Number.isFinite(num) && num >= 0) {
      setWeeklyBudget(Math.min(5000000, num));
    }
  };

  const handleBudgetBlur = () => {
    const clamped = Math.max(
      modeConfig.minBudget,
      Math.min(5000000, weeklyBudget || modeConfig.defaultBudget)
    );
    setWeeklyBudget(clamped);
    setBudgetText(String(clamped));
    persistImmediately({ weeklyBudget: clamped });
  };

  const handleSelectQuickBudget = (val) => {
    setWeeklyBudget(val);
    setBudgetText(String(val));
    persistImmediately({ weeklyBudget: val });
  };

  const handleSelectMode = (nextMode) => {
    const nextCfg = getModeBudgetConfig(nextMode);
    const adjustedBudget =
      weeklyBudget < nextCfg.minBudget ? nextCfg.minBudget : weeklyBudget;
    setMode(nextMode);
    if (adjustedBudget !== weeklyBudget) {
      setWeeklyBudget(adjustedBudget);
      setBudgetText(String(adjustedBudget));
    }
    persistImmediately({ mode: nextMode, weeklyBudget: adjustedBudget });
  };

  const handleAutoGenerate = () => {
    const effectiveBudget = Math.max(modeConfig.minBudget, weeklyBudget || modeConfig.defaultBudget);
    if (effectiveBudget !== weeklyBudget) {
      setWeeklyBudget(effectiveBudget);
      setBudgetText(String(effectiveBudget));
    }
    const nextPlan = generateWeeklyPlan({ weeklyBudget: effectiveBudget, mode });
    setPlan(nextPlan);
    setCheckedBahanIds([]);
    persistImmediately({ weeklyBudget: effectiveBudget, plan: nextPlan, checkedBahanIds: [] });
    setActiveTab('schedule');
    setToastMsg('Jadwal makan 7 hari berhasil disusun & disimpan!');
  };

  const handleRandomizeDay = (dayId) => {
    const nextPlan = randomizeSingleDay(plan, dayId, { weeklyBudget, mode });
    setPlan(nextPlan);
    persistImmediately({ plan: nextPlan });
    const dayObj = DAYS.find((d) => d.id === dayId);
    setToastMsg(`Menu hari ${dayObj?.label || ''} berhasil diacak ulang.`);
  };

  const handleResetPlan = () => {
    const empty = createEmptyPlan();
    setPlan(empty);
    setCheckedBahanIds([]);
    persistImmediately({ plan: empty, checkedBahanIds: [] });
    setToastMsg('Jadwal 7 hari dikosongkan.');
  };

  const handleAssignSlot = (dayId, slotId, itemUid) => {
    const nextPlan = {
      ...plan,
      [dayId]: {
        ...(plan[dayId] || { pagi: null, siang: null, malam: null }),
        [slotId]: itemUid,
      },
    };
    setPlan(nextPlan);
    persistImmediately({ plan: nextPlan });
  };

  const handleRemoveSlot = (dayId, slotId) => {
    handleAssignSlot(dayId, slotId, null);
  };

  const handleConfirmPendingSave = (dayId, slotId, itemUid) => {
    handleAssignSlot(dayId, slotId, itemUid);
    setSelectedDay(dayId);
    setActiveTab('schedule');
    onClearPendingItem?.();
    const dayLabel = DAYS.find((d) => d.id === dayId)?.label || dayId;
    const slotLabel = MEAL_SLOTS.find((s) => s.id === slotId)?.label || slotId;
    setToastMsg(`Tersimpan ke ${dayLabel} (${slotLabel})!`);
  };

  const handleToggleShopCheck = (bahanId) => {
    if (!isValidBahanId(bahanId)) return;
    const nextChecked = checkedBahanIds.includes(bahanId)
      ? checkedBahanIds.filter((id) => id !== bahanId)
      : [...checkedBahanIds, bahanId];
    setCheckedBahanIds(nextChecked);
    persistImmediately({ checkedBahanIds: nextChecked });
  };

  const handleResetShopChecks = () => {
    setCheckedBahanIds([]);
    persistImmediately({ checkedBahanIds: [] });
  };

  const visibleDays = showAllDays
    ? DAYS
    : DAYS.filter((d) => d.id === selectedDay);

  const activePickerDay = pickerTarget
    ? DAYS.find((d) => d.id === pickerTarget.dayId)
    : null;
  const activePickerSlot = pickerTarget
    ? MEAL_SLOTS.find((s) => s.id === pickerTarget.slotId)
    : null;

  const dailyEquivalent = Math.round(weeklyBudget / 7);
  const progressWidth = Math.min(100, Math.max(0, summary.budgetUsedPct));

  return (
    <div className="planner-screen">
      <div className="sticky-header planner-sticky">
        <header className="step-nav">
          <button
            type="button"
            className="btn-nav-back"
            onClick={onBack}
            aria-label="Kembali"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
            <span>Kembali</span>
          </button>
          <div className="nav-title-wrap">
            <div className="nav-title">Meal Planner 7 Hari</div>
            <div className="nav-step-indicator">Jadwal & Daftar Belanja</div>
          </div>
          {savedNotice ? (
            <button
              type="button"
              className="planner-saved-indicator"
              onClick={handleManualSave}
              title="Klik untuk simpan ulang jadwal"
            >
              <Check size={12} strokeWidth={3} />
              <span>Tersimpan</span>
            </button>
          ) : (
            <div className="nav-count-badge">
              {summary.filledSlots}/{summary.totalSlots} slot
            </div>
          )}
        </header>
      </div>

      <nav className="planner-mode-switcher" aria-label="Pindah mode perencanaan">
        <button
          type="button"
          className="planner-switcher-btn"
          onClick={onSwitchToHome || onBack}
        >
          <Utensils size={15} strokeWidth={2.4} />
          <span>Cari Makan Hari Ini</span>
        </button>
        <button
          type="button"
          className="planner-switcher-btn is-active"
          aria-current="page"
        >
          <CalendarDays size={15} strokeWidth={2.4} />
          <span>Meal Planner 7 Hari</span>
          <span className="planner-switcher-badge">
            {summary.filledSlots > 0 ? `${summary.filledSlots}/${summary.totalSlots}` : 'Baru'}
          </span>
        </button>
      </nav>

      {toastMsg && (
        <div className="planner-toast" role="status">
          <CheckCircle2 size={15} />
          <span>{toastMsg}</span>
        </div>
      )}

      <section className="planner-control-card">
        <div className="planner-control-top">
          <div className="planner-budget-block">
            <label htmlFor="planner-weekly-budget" className="planner-field-label">
              <span>Budget Mingguan (7 Hari)</span>
              <span className="planner-daily-hint">~{formatRupiah(dailyEquivalent)}/hari</span>
            </label>
            <div className="planner-budget-input-wrap">
              <span className="planner-currency">Rp</span>
              <input
                id="planner-weekly-budget"
                type="text"
                inputMode="numeric"
                className="planner-budget-input"
                value={budgetText ? Number(budgetText).toLocaleString('id-ID') : ''}
                onChange={handleBudgetInputChange}
                onBlur={handleBudgetBlur}
                placeholder="250.000"
              />
            </div>
            <div className="planner-quick-chips">
              {modeConfig.presets.map((val) => (
                <button
                  key={val}
                  type="button"
                  className={`planner-quick-chip ${weeklyBudget === val ? 'is-active' : ''}`}
                  onClick={() => handleSelectQuickBudget(val)}
                >
                  {val / 1000}rb
                </button>
              ))}
            </div>
          </div>

          <div className="planner-mode-block">
            <span className="planner-field-label">Gaya Makan</span>
            <div className="planner-mode-pills">
              {PLANNER_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`planner-mode-pill ${mode === m.id ? 'is-active' : ''}`}
                  onClick={() => handleSelectMode(m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div className="planner-cta-row">
              <button
                type="button"
                className="planner-btn-primary"
                onClick={handleAutoGenerate}
              >
                <Sparkles size={16} strokeWidth={2.5} />
                <span>Auto-Susun 7 Hari</span>
              </button>
              <button
                type="button"
                className="planner-save-btn"
                onClick={handleManualSave}
                title="Simpan jadwal ke akunmu"
              >
                <Save size={14} strokeWidth={2.4} />
                <span>Simpan</span>
              </button>
              <button
                type="button"
                className="planner-btn-secondary"
                onClick={handleResetPlan}
                disabled={summary.filledSlots === 0}
                title="Kosongkan semua jadwal"
              >
                <RotateCcw size={15} />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="planner-summary-grid">
        <div className="planner-stat-card">
          <div className="planner-stat-head">
            <span className="planner-stat-title">
              <Wallet size={14} />
              <span>Estimasi Biaya 7 Hari</span>
            </span>
            <span
              className={`planner-budget-status ${
                summary.isOverBudget ? 'is-over' : 'is-safe'
              }`}
            >
              {summary.isOverBudget ? (
                <>
                  <AlertTriangle size={11} />
                  <span>Lewat {formatRupiah(Math.abs(summary.budgetRemaining))}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={11} />
                  <span>Sisa {formatRupiah(summary.budgetRemaining)}</span>
                </>
              )}
            </span>
          </div>

          <div className="planner-stat-big">
            <strong>{formatRupiah(summary.totalCost)}</strong>
            <span>/ {formatRupiah(weeklyBudget)}</span>
          </div>

          <div className="planner-progress-track">
            <div
              className={`planner-progress-fill ${
                summary.isOverBudget ? 'is-over' : 'is-safe'
              }`}
              style={{ width: `${progressWidth}%` }}
            />
          </div>
          <div className="planner-stat-foot">
            <span>{summary.budgetUsedPct}% dari anggaran mingguan</span>
            <span>{summary.activeDaysCount}/7 hari terisi</span>
          </div>
        </div>

        <div className="planner-stat-card">
          <div className="planner-stat-head">
            <span className="planner-stat-title">
              <Activity size={14} />
              <span>Nutri-Meter Mingguan</span>
            </span>
            <span className="planner-nutri-badge">
              {summary.filledSlots > 0 ? `Skor ${summary.score}/100` : 'Belum dihitung'}
            </span>
          </div>

          <div className="planner-nutri-headline">
            <strong>{summary.statusLabel}</strong>
            <span>
              {summary.filledSlots > 0
                ? `Rata-rata ${summary.avgDailyCalories} kkal/hari`
                : 'Susun jadwal untuk melihat keseimbangan gizi'}
            </span>
          </div>

          <div className="planner-macro-bar" aria-label="Proporsi makronutrisi">
            <div
              className="planner-macro-seg is-karbo"
              style={{ width: `${summary.pctKarbo}%` }}
            />
            <div
              className="planner-macro-seg is-protein"
              style={{ width: `${summary.pctProtein}%` }}
            />
            <div
              className="planner-macro-seg is-lemak"
              style={{ width: `${summary.pctLemak}%` }}
            />
          </div>

          <div className="planner-macro-legend">
            <span>
              <i className="planner-dot is-karbo" />
              Karbo {summary.pctKarbo}%
            </span>
            <span>
              <i className="planner-dot is-protein" />
              Protein {summary.avgDailyProteinG}g/hr
            </span>
            <span>
              <i className="planner-dot is-serat" />
              Serat {summary.avgDailySeratG}g/hr
            </span>
          </div>
        </div>
      </section>

      <nav className="planner-tabs" aria-label="Tab Meal Planner">
        <button
          type="button"
          className={`planner-tab-btn ${activeTab === 'schedule' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <CalendarDays size={15} />
          <span>Jadwal 7 Hari</span>
          <span className="planner-tab-badge">{summary.filledSlots}</span>
        </button>
        <button
          type="button"
          className={`planner-tab-btn ${activeTab === 'shopping' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('shopping')}
        >
          <ShoppingBasket size={15} />
          <span>Daftar Belanja</span>
          <span className="planner-tab-badge">{shoppingList.totalIngredients}</span>
        </button>
      </nav>

      {activeTab === 'schedule' ? (
        <section className="planner-schedule-wrap">
          <div className="planner-day-bar-head">
            <div className="planner-day-pills">
              {DAYS.map((day) => {
                const dayStat = summary.dailyTotals[day.id] || { cost: 0, filledCount: 0 };
                const isSelected = !showAllDays && selectedDay === day.id;
                return (
                  <button
                    key={day.id}
                    type="button"
                    className={`planner-day-pill ${isSelected ? 'is-active' : ''} ${
                      dayStat.filledCount === 3 ? 'is-complete' : ''
                    }`}
                    onClick={() => {
                      setShowAllDays(false);
                      setSelectedDay(day.id);
                    }}
                  >
                    <span className="planner-day-short">{day.short}</span>
                    <span className="planner-day-dots">
                      {dayStat.filledCount}/3
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className={`planner-view-toggle ${showAllDays ? 'is-active' : ''}`}
              onClick={() => setShowAllDays((prev) => !prev)}
            >
              {showAllDays ? 'Fokus 1 Hari' : 'Lihat 7 Hari'}
            </button>
          </div>

          <div className={`planner-days-grid ${showAllDays ? 'is-all' : ''}`}>
            {visibleDays.map((day) => {
              const daySlots = plan[day.id] || {};
              const dayStat = summary.dailyTotals[day.id] || {
                cost: 0,
                calories: 0,
                filledCount: 0,
              };

              return (
                <article key={day.id} className="planner-day-card">
                  <div className="planner-day-card-head">
                    <div>
                      <h3 className="planner-day-title">{day.label}</h3>
                      <div className="planner-day-meta">
                        <span>{formatRupiah(dayStat.cost)}</span>
                        <span>·</span>
                        <span>{dayStat.calories} kkal</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="planner-btn-shuffle"
                      onClick={() => handleRandomizeDay(day.id)}
                      title={`Acak ulang menu hari ${day.label}`}
                    >
                      <Shuffle size={13} />
                      <span>Acak Hari</span>
                    </button>
                  </div>

                  <div className="planner-slots-list">
                    {MEAL_SLOTS.map((slot) => {
                      const item = getCatalogItem(daySlots[slot.id]);
                      return (
                        <div key={slot.id} className="planner-slot-row">
                          <div className="planner-slot-label-col">
                            <span className="planner-slot-badge">{slot.label}</span>
                          </div>

                          {item ? (
                            <div className="planner-slot-filled">
                              <div className="planner-slot-thumb">
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
                                  {item.type === 'resep' ? (
                                    <CookingPot size={15} />
                                  ) : (
                                    <Utensils size={15} />
                                  )}
                                </span>
                              </div>

                              <div className="planner-slot-info">
                                <div className="planner-slot-name">{item.nama}</div>
                                <div className="planner-slot-meta">
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
                                      {item.waktu}m
                                    </span>
                                  )}
                                  <span className="planner-kcal-tag">
                                    <Flame size={10} />
                                    {item.kalori} kkal
                                  </span>
                                  <span className="planner-slot-price">
                                    {formatRupiah(item.harga)}
                                  </span>
                                </div>
                              </div>

                              <div className="planner-slot-actions">
                                <button
                                  type="button"
                                  className="planner-slot-edit"
                                  onClick={() =>
                                    setPickerTarget({ dayId: day.id, slotId: slot.id })
                                  }
                                >
                                  Ganti
                                </button>
                                <button
                                  type="button"
                                  className="planner-slot-del"
                                  onClick={() => handleRemoveSlot(day.id, slot.id)}
                                  aria-label={`Hapus ${slot.label} hari ${day.label}`}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="planner-slot-empty"
                              onClick={() =>
                                setPickerTarget({ dayId: day.id, slotId: slot.id })
                              }
                            >
                              <Plus size={14} strokeWidth={2.6} />
                              <span>Pilih menu {slot.subtitle.toLowerCase()}</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        <ShoppingListPanel
          shoppingList={shoppingList}
          checkedSet={checkedSet}
          onToggleCheck={handleToggleShopCheck}
          onResetChecks={handleResetShopChecks}
          onAutoGenerate={handleAutoGenerate}
          onSwitchToSchedule={() => setActiveTab('schedule')}
        />
      )}

      {pickerTarget && activePickerDay && activePickerSlot && (
        <MealSlotPickerModal
          dayLabel={activePickerDay.label}
          slotLabel={activePickerSlot.label}
          currentUid={plan[pickerTarget.dayId]?.[pickerTarget.slotId] || null}
          defaultMode={mode}
          onSelect={(itemUid) => {
            handleAssignSlot(pickerTarget.dayId, pickerTarget.slotId, itemUid);
            setPickerTarget(null);
          }}
          onRemove={() => {
            handleRemoveSlot(pickerTarget.dayId, pickerTarget.slotId);
            setPickerTarget(null);
          }}
          onClose={() => setPickerTarget(null)}
        />
      )}

      {pendingItem && (
        <SaveItemToPlanModal
          item={pendingItem}
          onConfirm={handleConfirmPendingSave}
          onClose={onClearPendingItem}
        />
      )}
    </div>
  );
}
