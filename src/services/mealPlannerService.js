import menuData from '../data/menu.json';
import bahanData from '../data/bahan.json';
import resepData from '../data/resep.json';

export const DAYS = [
  { id: 'senin', label: 'Senin', short: 'Sen' },
  { id: 'selasa', label: 'Selasa', short: 'Sel' },
  { id: 'rabu', label: 'Rabu', short: 'Rab' },
  { id: 'kamis', label: 'Kamis', short: 'Kam' },
  { id: 'jumat', label: 'Jumat', short: 'Jum' },
  { id: 'sabtu', label: 'Sabtu', short: 'Sab' },
  { id: 'minggu', label: 'Minggu', short: 'Min' },
];

export const MEAL_SLOTS = [
  { id: 'pagi', label: 'Pagi', subtitle: 'Sarapan', weight: 0.27 },
  { id: 'siang', label: 'Siang', subtitle: 'Makan Siang', weight: 0.38 },
  { id: 'malam', label: 'Malam', subtitle: 'Makan Malam', weight: 0.35 },
];

export const PLANNER_MODES = [
  { id: 'semua', label: 'Semua' },
  { id: 'resep', label: 'Masak Sendiri' },
  { id: 'menu', label: 'Beli Jadi' },
];

export const MODE_BUDGET_CONFIG = {
  semua: {
    minBudget: 120000,
    defaultBudget: 250000,
    presets: [150000, 200000, 250000, 350000, 500000],
  },
  resep: {
    minBudget: 100000,
    defaultBudget: 200000,
    presets: [120000, 150000, 200000, 250000, 350000],
  },
  menu: {
    minBudget: 220000,
    defaultBudget: 300000,
    presets: [220000, 250000, 300000, 400000, 500000],
  },
};

export function getModeBudgetConfig(mode) {
  return Object.hasOwn(MODE_BUDGET_CONFIG, mode)
    ? MODE_BUDGET_CONFIG[mode]
    : MODE_BUDGET_CONFIG.semua;
}

export const DEFAULT_WEEKLY_BUDGET = MODE_BUDGET_CONFIG.semua.defaultBudget;
export const QUICK_WEEKLY_BUDGETS = MODE_BUDGET_CONFIG.semua.presets;

const bahanMap = Object.fromEntries(bahanData.map((b) => [b.id, b]));

function getBahanRef(id) {
  return typeof id === 'string' && Object.hasOwn(bahanMap, id) ? bahanMap[id] : null;
}

export function isValidBahanId(id) {
  return typeof id === 'string' && Object.hasOwn(bahanMap, id);
}

export function sanitizeCheckedBahanIds(ids) {
  if (!Array.isArray(ids)) return [];
  return Array.from(new Set(ids.filter((id) => isValidBahanId(id))));
}

const LEAN_PROTEINS = new Set(['ayam', 'ikan', 'udang', 'cumi', 'kerang', 'kepiting', 'ikan-teri']);
const RICH_PROTEINS = new Set(['daging-sapi', 'telur', 'sosis']);
const FIBER_CARBS = new Set(['ubi', 'singkong', 'jagung', 'pisang']);
const CATEGORY_ORDER = { protein: 1, sayur: 2, karbo: 3, bumbu: 4 };

function buildCatalog() {
  const menuItems = menuData.map((m) => {
    const bahanIds = Array.isArray(m.bahanUtama) ? m.bahanUtama : [];
    return {
      uid: `menu:${m.id}`,
      type: 'menu',
      id: m.id,
      nama: m.nama,
      harga: Number(m.harga) || 0,
      kalori: Number(m.kalori) || 0,
      kategori: m.kategori || 'makan-siang',
      tempat: m.tempat || 'Warung',
      waktu: null,
      isFast: false,
      gambar: m.gambar || `/images/menu/${m.id}.jpg`,
      bahanIds,
      bahanEntries: bahanIds.map((id) => ({ id, jumlah: 1 })),
      raw: m,
    };
  });

  const resepItems = resepData.map((r) => {
    let totalHarga = 0;
    let totalKalori = 0;
    const entries = Array.isArray(r.bahan) ? r.bahan : [];
    const bahanIds = [];

    for (const entry of entries) {
      const ref = bahanMap[entry.id];
      const qty = Number(entry.jumlah) || 1;
      bahanIds.push(entry.id);
      if (ref) {
        totalHarga += (Number(ref.harga) || 0) * qty;
        totalKalori += (Number(ref.kalori) || 0) * qty;
      }
    }

    const waktu = Number(r.waktu) || parseInt(r.waktuMasak, 10) || 15;
    return {
      uid: `resep:${r.id}`,
      type: 'resep',
      id: r.id,
      nama: r.nama,
      harga: totalHarga,
      kalori: totalKalori,
      kategori: inferRecipeSlotCategory(r.nama, totalKalori, bahanIds),
      tempat: 'Masak Sendiri',
      waktu,
      isFast: waktu <= 15,
      gambar: r.gambar || `/images/resep/${r.id}.jpg`,
      bahanIds,
      bahanEntries: entries.map((e) => ({ id: e.id, jumlah: Number(e.jumlah) || 1 })),
      raw: r,
    };
  });

  return [...menuItems, ...resepItems];
}

function inferRecipeSlotCategory(nama, kalori, bahanIds) {
  const lower = (nama || '').toLowerCase();
  if (
    lower.includes('bubur') ||
    lower.includes('oat') ||
    lower.includes('telur rebus') ||
    lower.includes('dadar') ||
    lower.includes('ceplok') ||
    lower.includes('pisang') ||
    lower.includes('ubi') ||
    lower.includes('singkong') ||
    kalori <= 320
  ) {
    return 'sarapan';
  }
  const hasProtein = bahanIds.some((id) => bahanMap[id]?.kategori === 'protein');
  const hasSayur = bahanIds.some((id) => bahanMap[id]?.kategori === 'sayur');
  if (hasProtein && hasSayur) return 'makan-siang';
  return 'makan-malam';
}

export const PLANNER_CATALOG = buildCatalog();
export const CATALOG_MAP = Object.fromEntries(PLANNER_CATALOG.map((item) => [item.uid, item]));

export function formatRupiah(num) {
  return 'Rp ' + Math.round(Number(num) || 0).toLocaleString('id-ID');
}

export function getCatalogItem(uid) {
  return typeof uid === 'string' && Object.hasOwn(CATALOG_MAP, uid) ? CATALOG_MAP[uid] : null;
}

export function normalizeDetailToPlannerItem(data, type) {
  if (!data || !type) return null;
  const uid = `${type}:${data.id}`;
  return Object.hasOwn(CATALOG_MAP, uid) ? CATALOG_MAP[uid] : null;
}

export function createEmptyPlan() {
  const plan = {};
  for (const day of DAYS) {
    plan[day.id] = { pagi: null, siang: null, malam: null };
  }
  return plan;
}

function isSubstantialMeal(item) {
  if (!item) return false;
  if (item.type === 'menu') return item.kategori !== 'cemilan' || item.kalori >= 250;
  const nonBumbuCount = item.bahanIds.filter((id) => bahanMap[id]?.kategori !== 'bumbu').length;
  return nonBumbuCount >= 1 && item.kalori >= 140;
}

function scoreCandidate(item, slot, targetPrice, usedInWeek, usedToday, usedYesterday) {
  let score = 0;

  const price = item.harga;
  if (price <= targetPrice) {
    const ratio = targetPrice > 0 ? price / targetPrice : 0.8;
    score += 38 - Math.abs(0.82 - ratio) * 18;
  } else {
    const overRatio = targetPrice > 0 ? (price - targetPrice) / targetPrice : 1;
    score -= Math.min(60, overRatio * 55);
  }

  if (slot.id === 'pagi' && item.kategori === 'sarapan') score += 16;
  if (slot.id === 'siang' && item.kategori === 'makan-siang') score += 15;
  if (slot.id === 'malam' && item.kategori === 'makan-malam') score += 15;
  if (slot.id !== 'pagi' && item.kategori === 'cemilan') score -= 18;

  let hasProtein = false;
  let hasSayur = false;
  let hasKarbo = false;
  for (const bid of item.bahanIds) {
    const kat = bahanMap[bid]?.kategori;
    if (kat === 'protein') hasProtein = true;
    else if (kat === 'sayur') hasSayur = true;
    else if (kat === 'karbo') hasKarbo = true;
  }
  if (hasProtein) score += 10;
  if (hasSayur) score += 10;
  if (hasKarbo) score += 6;
  if (item.isFast) score += 3;

  if (usedToday.has(item.uid)) score -= 80;
  else if (usedYesterday.has(item.uid)) score -= 35;
  else if (usedInWeek.has(item.uid)) score -= 22;
  else score += 14;

  score += Math.random() * 9;
  return score;
}

function getPoolForMode(mode) {
  const filtered = PLANNER_CATALOG.filter((item) => {
    if (mode === 'menu' && item.type !== 'menu') return false;
    if (mode === 'resep' && item.type !== 'resep') return false;
    return isSubstantialMeal(item);
  });
  return filtered.length > 0 ? filtered : PLANNER_CATALOG;
}

export function generateWeeklyPlan({ weeklyBudget = DEFAULT_WEEKLY_BUDGET, mode = 'semua' }) {
  const pool = getPoolForMode(mode);
  const minPrice = Math.min(...pool.map((i) => i.harga));
  const plan = createEmptyPlan();
  const usedInWeek = new Set();
  let spent = 0;
  let remainingSlots = DAYS.length * MEAL_SLOTS.length;
  let prevDaySet = new Set();

  for (const day of DAYS) {
    const todaySet = new Set();
    const dailyBase = Math.max(minPrice * 3, (weeklyBudget - spent) / (remainingSlots / 3));

    for (const slot of MEAL_SLOTS) {
      const reserveForRest = Math.max(0, (remainingSlots - 1) * minPrice);
      const maxAllowed = Math.max(minPrice, weeklyBudget - spent - reserveForRest);
      const targetPrice = Math.min(maxAllowed, Math.max(minPrice, dailyBase * slot.weight));

      const affordable = pool.filter((item) => item.harga <= maxAllowed);
      let candidates = affordable.length > 0 ? affordable : pool;

      const freshToday = candidates.filter((item) => !todaySet.has(item.uid));
      if (freshToday.length > 0) {
        candidates = freshToday;
      } else {
        const poolFreshToday = pool
          .filter((item) => !todaySet.has(item.uid))
          .sort((a, b) => a.harga - b.harga)
          .slice(0, 6);
        if (poolFreshToday.length > 0) {
          candidates = poolFreshToday;
        }
      }

      let bestItem = candidates[0];
      let bestScore = -Infinity;

      for (const item of candidates) {
        const s = scoreCandidate(item, slot, targetPrice, usedInWeek, todaySet, prevDaySet);
        if (s > bestScore) {
          bestScore = s;
          bestItem = item;
        }
      }

      plan[day.id][slot.id] = bestItem ? bestItem.uid : null;
      if (bestItem) {
        spent += bestItem.harga;
        usedInWeek.add(bestItem.uid);
        todaySet.add(bestItem.uid);
      }
      remainingSlots -= 1;
    }

    prevDaySet = todaySet;
  }

  return plan;
}

export function randomizeSingleDay(currentPlan, dayId, { weeklyBudget = DEFAULT_WEEKLY_BUDGET, mode = 'semua' }) {
  const pool = getPoolForMode(mode);
  const nextPlan = { ...createEmptyPlan(), ...currentPlan };
  const usedOtherDays = new Set();
  let otherDaysCost = 0;

  for (const day of DAYS) {
    if (day.id === dayId) continue;
    const daySlots = nextPlan[day.id] || {};
    for (const slot of MEAL_SLOTS) {
      const item = getCatalogItem(daySlots[slot.id]);
      if (item) {
        usedOtherDays.add(item.uid);
        otherDaysCost += item.harga;
      }
    }
  }

  const dailyBudget = Math.max(
    Math.min(...pool.map((i) => i.harga)) * 3,
    Math.min(weeklyBudget / 7, Math.max(weeklyBudget - otherDaysCost, weeklyBudget / 7))
  );
  const todaySet = new Set();
  const newDay = { pagi: null, siang: null, malam: null };

  for (const slot of MEAL_SLOTS) {
    const targetPrice = dailyBudget * slot.weight;
    const freshPool = pool.filter((item) => !todaySet.has(item.uid));
    const candidates = freshPool.length > 0 ? freshPool : pool;
    let bestItem = candidates[0];
    let bestScore = -Infinity;

    for (const item of candidates) {
      const s = scoreCandidate(item, slot, targetPrice, usedOtherDays, todaySet, new Set());
      if (s > bestScore) {
        bestScore = s;
        bestItem = item;
      }
    }

    newDay[slot.id] = bestItem ? bestItem.uid : null;
    if (bestItem) todaySet.add(bestItem.uid);
  }

  nextPlan[dayId] = newDay;
  return nextPlan;
}

export function computeWeeklySummary(plan, weeklyBudget = DEFAULT_WEEKLY_BUDGET) {
  let totalCost = 0;
  let totalCalories = 0;
  let filledSlots = 0;
  let carbKcal = 0;
  let protKcal = 0;
  let fatKcal = 0;
  let seratTotal = 0;
  const activeDays = new Set();
  const uniqueBahanIds = new Set();
  const dailyTotals = {};

  for (const day of DAYS) {
    let dayCost = 0;
    let dayCal = 0;
    let dayCount = 0;
    const slots = plan?.[day.id] || {};

    for (const slot of MEAL_SLOTS) {
      const item = getCatalogItem(slots[slot.id]);
      if (!item) continue;

      filledSlots += 1;
      dayCount += 1;
      dayCost += item.harga;
      dayCal += item.kalori;
      totalCost += item.harga;
      totalCalories += item.kalori;
      activeDays.add(day.id);

      let wCarb = 0;
      let wProt = 0;
      let wFat = 0;
      let mealSerat = 0;

      if (item.bahanIds.length === 0) {
        wCarb = 52;
        wProt = 20;
        wFat = 28;
        mealSerat = 2.5;
      } else {
        for (const bid of item.bahanIds) {
          uniqueBahanIds.add(bid);
          const kat = bahanMap[bid]?.kategori;
          if (kat === 'karbo') {
            if (bid === 'mie-instan') {
              wCarb += 110; wProt += 22; wFat += 68; mealSerat += 1.8;
            } else if (FIBER_CARBS.has(bid)) {
              wCarb += 130; wProt += 12; wFat += 8; mealSerat += 3.6;
            } else {
              wCarb += 145; wProt += 16; wFat += 10; mealSerat += 1.6;
            }
          } else if (kat === 'protein') {
            if (LEAN_PROTEINS.has(bid)) {
              wCarb += 6; wProt += 115; wFat += 45;
            } else if (RICH_PROTEINS.has(bid)) {
              wCarb += 8; wProt += 85; wFat += 95;
            } else {
              wCarb += 28; wProt += 72; wFat += 48; mealSerat += 2.8;
            }
          } else if (kat === 'sayur') {
            wCarb += 24; wProt += 12; wFat += 4; mealSerat += 2.8;
          } else if (bid === 'minyak' || bid === 'santan') {
            wCarb += 6; wProt += 4; wFat += 115; mealSerat += 0.2;
          } else {
            wCarb += 10; wProt += 3; wFat += 1; mealSerat += 0.3;
          }
        }
      }

      const wSum = wCarb + wProt + wFat || 1;
      carbKcal += item.kalori * (wCarb / wSum);
      protKcal += item.kalori * (wProt / wSum);
      fatKcal += item.kalori * (wFat / wSum);
      seratTotal += Math.min(11, Math.max(1, mealSerat));
    }

    dailyTotals[day.id] = { cost: dayCost, calories: dayCal, filledCount: dayCount };
  }

  const dayDivisor = Math.max(1, activeDays.size);
  const avgDailyCalories = filledSlots > 0 ? Math.round(totalCalories / dayDivisor) : 0;
  const avgDailyKarboG = filledSlots > 0 ? Math.round(carbKcal / 4 / dayDivisor) : 0;
  const avgDailyProteinG = filledSlots > 0 ? Math.round(protKcal / 4 / dayDivisor) : 0;
  const avgDailyLemakG = filledSlots > 0 ? Math.round(fatKcal / 9 / dayDivisor) : 0;
  const avgDailySeratG = filledSlots > 0 ? Math.round((seratTotal / dayDivisor) * 10) / 10 : 0;

  const macroSum = carbKcal + protKcal + fatKcal || 1;
  const pctKarbo = filledSlots > 0 ? Math.round((carbKcal / macroSum) * 100) : 50;
  const pctProtein = filledSlots > 0 ? Math.round((protKcal / macroSum) * 100) : 20;
  const pctLemak = filledSlots > 0 ? Math.max(0, 100 - pctKarbo - pctProtein) : 30;

  let score = 0;
  let statusLabel = 'Belum Ada Jadwal';
  if (filledSlots > 0) {
    let macroPts = 26;
    if (pctProtein >= 15) macroPts += 8;
    if (pctLemak <= 38) macroPts += 6;
    const protPts = Math.min(24, Math.round((avgDailyProteinG / 52) * 24));
    const fiberPts = Math.min(22, Math.round((avgDailySeratG / 14) * 22));
    const varietyPts = Math.min(14, Math.round((uniqueBahanIds.size / 10) * 14));
    score = Math.max(58, Math.min(98, macroPts + protPts + fiberPts + varietyPts));

    if (score >= 86) statusLabel = 'Gizi Sangat Seimbang';
    else if (score >= 74) statusLabel = 'Nutrisi Mantap';
    else statusLabel = 'Cukup Baik';
  }

  const budgetRemaining = weeklyBudget - totalCost;
  const budgetUsedPct = weeklyBudget > 0 ? Math.round((totalCost / weeklyBudget) * 100) : 0;

  return {
    filledSlots,
    totalSlots: DAYS.length * MEAL_SLOTS.length,
    activeDaysCount: activeDays.size,
    totalCost,
    budgetRemaining,
    isOverBudget: budgetRemaining < 0,
    budgetUsedPct,
    totalCalories,
    avgDailyCalories,
    avgDailyKarboG,
    avgDailyProteinG,
    avgDailyLemakG,
    avgDailySeratG,
    pctKarbo,
    pctProtein,
    pctLemak,
    score,
    statusLabel,
    dailyTotals,
  };
}

export function buildShoppingList(plan) {
  const map = new Map();

  for (const day of DAYS) {
    const slots = plan?.[day.id] || {};
    for (const slot of MEAL_SLOTS) {
      const item = getCatalogItem(slots[slot.id]);
      if (!item) continue;

      for (const entry of item.bahanEntries) {
        const ref = getBahanRef(entry.id);
        if (!ref) continue;

        const existing = map.get(ref.id);
        const qty = Number(entry.jumlah) || 1;
        if (existing) {
          existing.totalUnits += qty;
          existing.occurrences += 1;
          existing.estimatedCost += (Number(ref.harga) || 0) * qty;
          if (item.type === 'resep') existing.fromRecipes += 1;
          else existing.fromMenus += 1;
        } else {
          map.set(ref.id, {
            id: ref.id,
            nama: ref.nama,
            kategori: ref.kategori || 'bumbu',
            satuan: ref.satuan || 'porsi',
            unitPrice: Number(ref.harga) || 0,
            totalUnits: qty,
            occurrences: 1,
            estimatedCost: (Number(ref.harga) || 0) * qty,
            fromRecipes: item.type === 'resep' ? 1 : 0,
            fromMenus: item.type === 'menu' ? 1 : 0,
            gambar: ref.gambar || `/images/bahan/${ref.id}.jpg`,
          });
        }
      }
    }
  }

  const items = Array.from(map.values()).sort((a, b) => {
    const catDiff = (CATEGORY_ORDER[a.kategori] || 9) - (CATEGORY_ORDER[b.kategori] || 9);
    if (catDiff !== 0) return catDiff;
    if (b.occurrences !== a.occurrences) return b.occurrences - a.occurrences;
    return a.nama.localeCompare(b.nama, 'id');
  });

  const totalEstimatedBahanCost = items.reduce((acc, item) => acc + item.estimatedCost, 0);

  return {
    items,
    totalIngredients: items.length,
    totalEstimatedBahanCost,
  };
}

function getStorageKey(uid) {
  const cleanUid = typeof uid === 'string' ? uid.trim() : '';
  return cleanUid === 'guest' ? 'mami_meal_plan_guest' : `mami_meal_plan_${cleanUid}`;
}

export function loadUserMealPlan(uid) {
  const fallback = {
    weeklyBudget: DEFAULT_WEEKLY_BUDGET,
    mode: 'semua',
    plan: createEmptyPlan(),
    checkedBahanIds: [],
  };

  if (typeof uid !== 'string' || !uid.trim() || typeof window === 'undefined') {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(uid));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);

    const mode = ['semua', 'resep', 'menu'].includes(parsed?.mode) ? parsed.mode : 'semua';
    const modeCfg = getModeBudgetConfig(mode);
    const parsedBudget = Number(parsed?.weeklyBudget);
    const weeklyBudget =
      Number.isFinite(parsedBudget) && parsedBudget >= modeCfg.minBudget
        ? Math.min(5000000, parsedBudget)
        : modeCfg.defaultBudget;

    const cleanPlan = createEmptyPlan();
    if (parsed?.plan && typeof parsed.plan === 'object') {
      for (const day of DAYS) {
        const storedDay = Object.hasOwn(parsed.plan, day.id) ? parsed.plan[day.id] : null;
        if (!storedDay || typeof storedDay !== 'object') continue;
        for (const slot of MEAL_SLOTS) {
          const storedUid = Object.hasOwn(storedDay, slot.id) ? storedDay[slot.id] : null;
          if (typeof storedUid === 'string' && Object.hasOwn(CATALOG_MAP, storedUid)) {
            cleanPlan[day.id][slot.id] = storedUid;
          }
        }
      }
    }

    const checkedBahanIds = sanitizeCheckedBahanIds(parsed?.checkedBahanIds);

    return {
      weeklyBudget,
      mode,
      plan: cleanPlan,
      checkedBahanIds,
    };
  } catch {
    return fallback;
  }
}

export function saveUserMealPlan(uid, data) {
  if (typeof uid !== 'string' || !uid.trim() || typeof window === 'undefined') {
    return false;
  }
  try {
    const safeMode = ['semua', 'resep', 'menu'].includes(data?.mode) ? data.mode : 'semua';
    const safeChecked = sanitizeCheckedBahanIds(data?.checkedBahanIds);
    window.localStorage.setItem(
      getStorageKey(uid),
      JSON.stringify({
        weeklyBudget: data.weeklyBudget,
        mode: safeMode,
        plan: data.plan,
        checkedBahanIds: safeChecked,
        updatedAt: Date.now(),
      })
    );
    return true;
  } catch {
    return false;
  }
}

export function getSavedMealPlanSlotCount(uid) {
  if (typeof uid !== 'string' || !uid.trim()) return 0;
  const { plan } = loadUserMealPlan(uid);
  let count = 0;
  for (const day of DAYS) {
    const slots = plan[day.id] || {};
    for (const slot of MEAL_SLOTS) {
      if (slots[slot.id]) count += 1;
    }
  }
  return count;
}
