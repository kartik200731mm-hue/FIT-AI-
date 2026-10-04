import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { IMealLog, IMealSummary } from '../types';
import { MacroBar } from '../components/MacroBar';
import { HealthDisclaimer } from '../components/HealthDisclaimer';
import {
  Sparkles,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowRightLeft,
  CheckCircle2,
} from 'lucide-react';

export const MealsPage: React.FC = () => {
  const { profile } = useAuth();
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [mealLogs, setMealLogs] = useState<IMealLog[]>([]);
  const [mealSummary, setMealSummary] = useState<IMealSummary | null>(null);
  const [commonFoods, setCommonFoods] = useState<any[]>([]);
  const [searchFoodQuery, setSearchFoodQuery] = useState('');

  // Quick Log Modal
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [customName, setCustomName] = useState('');
  const [customCalories, setCustomCalories] = useState<number>(300);
  const [customProtein, setCustomProtein] = useState<number>(20);
  const [customCarbs, setCustomCarbs] = useState<number>(35);
  const [customFat, setCustomFat] = useState<number>(10);
  const [customPortion, setCustomPortion] = useState('1 serving');

  // AI Meal Gen Modal
  const [isAiMealModalOpen, setIsAiMealModalOpen] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiMealPlan, setAiMealPlan] = useState<any | null>(null);

  // AI Food Swap Modal
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [swapInput, setSwapInput] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapResult, setSwapResult] = useState<{
    original: string;
    swap: string;
    benefit: string;
    estimatedMacros: string;
    source: string;
  } | null>(null);

  useEffect(() => {
    loadDailyMeals(currentDate);
    loadCommonFoods();
  }, [currentDate]);

  const loadDailyMeals = async (date: string) => {
    try {
      const res = await api.getMealSummary(date);
      setMealLogs(res.logs || []);
      setMealSummary(res.summary);
    } catch (err) {
      console.error('Failed loading meals:', err);
    }
  };

  const loadCommonFoods = async () => {
    try {
      const res = await api.getCommonFoods();
      setCommonFoods(res.foods || []);
    } catch (err) {
      console.warn('Failed loading common foods catalog:', err);
    }
  };

  const handleDateChange = (deltaDays: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + deltaDays);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const handleLogCustomFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    try {
      await api.logMeal({
        date: currentDate,
        mealType: selectedMealType,
        items: [
          {
            name: customName.trim(),
            calories: Number(customCalories),
            protein: Number(customProtein),
            carbs: Number(customCarbs),
            fat: Number(customFat),
            portion: customPortion.trim(),
            isEstimated: true,
          },
        ],
      });

      setIsLogModalOpen(false);
      // Reset
      setCustomName('');
      setCustomCalories(300);
      setCustomProtein(20);
      setCustomCarbs(35);
      setCustomFat(10);
      loadDailyMeals(currentDate);
    } catch (err) {
      console.error('Failed logging food:', err);
    }
  };

  const handleQuickAddCommonFood = async (food: any, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    try {
      await api.logMeal({
        date: currentDate,
        mealType,
        items: [
          {
            name: food.name,
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat,
            portion: food.portion,
            isEstimated: true,
          },
        ],
      });
      loadDailyMeals(currentDate);
    } catch (err) {
      console.error('Failed quick adding food:', err);
    }
  };

  const handleDeleteItem = async (mealId: string, itemId: string) => {
    try {
      await api.deleteMealItem(mealId, itemId);
      loadDailyMeals(currentDate);
    } catch (err) {
      console.error('Failed deleting meal item:', err);
    }
  };

  const handleGenerateAiMealPlan = async () => {
    setGeneratingAi(true);
    try {
      const res = await api.generateMealPlan();
      setAiMealPlan(res.recommendations);
    } catch (err: any) {
      alert(err.message || 'Failed generating meal plan');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleApplyAiMealPlan = async () => {
    if (!aiMealPlan) return;
    try {
      // Log all recommended meal categories to current day
      for (const mealType of ['breakfast', 'lunch', 'dinner', 'snack'] as const) {
        if (aiMealPlan[mealType] && aiMealPlan[mealType].length > 0) {
          await api.logMeal({
            date: currentDate,
            mealType,
            items: aiMealPlan[mealType],
          });
        }
      }
      setIsAiMealModalOpen(false);
      setAiMealPlan(null);
      loadDailyMeals(currentDate);
    } catch (err) {
      console.error('Failed applying meal plan:', err);
    }
  };

  const handleRequestSwap = async (foodToSwap?: string) => {
    const query = (foodToSwap || swapInput).trim();
    if (!query) return;
    setIsSwapping(true);
    try {
      const res = await api.getHealthySwap(query);
      setSwapResult(res);
      setSwapInput(query);
      setIsSwapModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed getting swap recommendation');
    } finally {
      setIsSwapping(false);
    }
  };

  const handleApplySwapAsFood = async (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    if (!swapResult) return;
    try {
      await api.logMeal({
        date: currentDate,
        mealType,
        items: [
          {
            name: swapResult.swap,
            calories: 220, // default estimation
            protein: 15,
            carbs: 25,
            fat: 6,
            portion: '1 wholesome serving',
            isEstimated: true,
          },
        ],
      });
      setIsSwapModalOpen(false);
      setSwapResult(null);
      setSwapInput('');
      loadDailyMeals(currentDate);
    } catch (err) {
      console.error('Failed logging swapped food:', err);
    }
  };

  const mealSlots: { id: 'breakfast' | 'lunch' | 'dinner' | 'snack'; label: string; icon: string }[] = [
    { id: 'breakfast', label: 'Breakfast', icon: '🍳' },
    { id: 'lunch', label: 'Lunch', icon: '🥗' },
    { id: 'dinner', label: 'Dinner', icon: '🍲' },
    { id: 'snack', label: 'Snacks & Supplements', icon: '🍎' },
  ];

  const filteredFoods = commonFoods.filter((f) =>
    f.name.toLowerCase().includes(searchFoodQuery.toLowerCase())
  );

  return (
    <div>
      {/* Top Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-emerald">Nutrition Tracker</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Diet: <strong style={{ textTransform: 'capitalize', color: 'var(--text-primary)' }}>{profile?.dietaryPreference?.replace('_', ' ')}</strong>
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Meals & Calorie Guidance</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Track daily nutrient pacing with estimated calorie and macronutrient logging.
          </p>
        </div>

        {/* Date Selector & AI Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.25rem 0.5rem',
            }}
          >
            <button
              onClick={() => handleDateChange(-1)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
            >
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', padding: '0 0.5rem' }}>
              {currentDate === new Date().toISOString().split('T')[0] ? 'Today' : currentDate}
            </span>
            <button
              onClick={() => handleDateChange(1)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            className="btn-secondary"
            onClick={() => {
              setSwapResult(null);
              setIsSwapModalOpen(true);
            }}
          >
            <ArrowRightLeft size={16} /> AI Food Swap
          </button>

          <button className="btn-primary" onClick={() => setIsAiMealModalOpen(true)}>
            <Sparkles size={18} /> AI Meal Plan Generator
          </button>
        </div>
      </div>

      <HealthDisclaimer compact />

      {/* Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="surface-card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem' }}>Calorie Summary</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>
              {mealSummary?.consumed.calories || 0}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Target: {profile?.dailyCalorieTarget || 2000} kcal
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Remaining budget:{' '}
            <strong style={{ color: '#06b6d4' }}>
              {mealSummary?.remainingCalories ?? (profile?.dailyCalorieTarget || 2000)} kcal
            </strong>
          </div>
        </div>

        <div className="surface-card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem' }}>Macronutrient Split</h3>
          <MacroBar
            label="Protein"
            current={mealSummary?.consumed.protein || 0}
            target={profile?.dailyProteinTarget || 120}
            color="#10b981"
          />
          <MacroBar
            label="Carbs"
            current={mealSummary?.consumed.carbs || 0}
            target={profile?.dailyCarbsTarget || 220}
            color="#06b6d4"
          />
          <MacroBar
            label="Fats"
            current={mealSummary?.consumed.fat || 0}
            target={profile?.dailyFatTarget || 60}
            color="#f59e0b"
          />
        </div>
      </div>

      {/* Meal Slots Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        {mealSlots.map((slot) => {
          const log = mealLogs.find((m) => m.mealType === slot.id);
          const items = log?.items || [];
          const slotCalories = items.reduce((acc, i) => acc + i.calories, 0);

          return (
            <div key={slot.id} className="surface-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>{slot.icon}</span>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{slot.label}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {slotCalories} kcal logged
                    </span>
                  </div>
                </div>

                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                  onClick={() => {
                    setSelectedMealType(slot.id);
                    setIsLogModalOpen(true);
                  }}
                >
                  <Plus size={14} /> Add Food
                </button>
              </div>

              {/* Items List */}
              {items.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        background: 'var(--bg-surface-elevated)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.65rem 0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Portion: {item.portion} • P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 800, color: '#10b981' }}>{item.calories}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '2px' }}>kcal</span>
                          {item.isEstimated && (
                            <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                              ~Estimated
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleRequestSwap(item.name)}
                            style={{ background: 'none', border: 'none', color: '#06b6d4', cursor: 'pointer', padding: '4px' }}
                            title="Find smart healthy swap with AI"
                            aria-label="Suggest swap"
                          >
                            <ArrowRightLeft size={15} />
                          </button>

                          {log && (
                            <button
                              onClick={() => handleDeleteItem(log.id, item.id)}
                              style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '4px' }}
                              aria-label="Remove item"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No items logged for {slot.label.toLowerCase()} yet.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Common Foods Catalog */}
      <div className="surface-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Common Wholesome Foods</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>One-click smart logging</p>
          </div>
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ padding: '0.4rem 0.6rem 0.4rem 2rem', fontSize: '0.8rem' }}
              placeholder="Filter foods..."
              value={searchFoodQuery}
              onChange={(e) => setSearchFoodQuery(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.65rem' }}>
          {filteredFoods.slice(0, 8).map((food, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.65rem 0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{food.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {food.calories} kcal ({food.portion})
                </div>
              </div>

              <button
                className="btn-secondary"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                onClick={() => handleQuickAddCommonFood(food, 'snack')}
              >
                + Log
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Food Logging Modal */}
      {isLogModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsLogModalOpen(false)}>
          <div className="modal-content" style={{ padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem' }}>
              Log Food to <span style={{ textTransform: 'capitalize', color: '#10b981' }}>{selectedMealType}</span>
            </h3>

            <form onSubmit={handleLogCustomFood}>
              <div className="form-group">
                <label className="form-label">Food / Meal Description</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Grilled Chicken Wrap with Avocado"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Portion Size</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 1 bowl, 200g, 1 slice"
                    value={customPortion}
                    onChange={(e) => setCustomPortion(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Estimated Calories (kcal)</label>
                  <input
                    type="number"
                    min="0"
                    max="5000"
                    className="form-input"
                    value={customCalories}
                    onChange={(e) => setCustomCalories(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Protein (g)</label>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    className="form-input"
                    value={customProtein}
                    onChange={(e) => setCustomProtein(Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Carbs (g)</label>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    className="form-input"
                    value={customCarbs}
                    onChange={(e) => setCustomCarbs(Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Fats (g)</label>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    className="form-input"
                    value={customFat}
                    onChange={(e) => setCustomFat(Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsLogModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 2 }}>
                  Log to Meal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Meal Plan Generator Modal */}
      {isAiMealModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAiMealModalOpen(false)}>
          <div className="modal-content" style={{ padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Sparkles size={22} color="#10b981" />
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>AI Nutrition & Meal Recommendations</h3>
              </div>
              <button onClick={() => setIsAiMealModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Generates a full day of wholesome meals calibrated to your ~{profile?.dailyCalorieTarget || 2000} kcal target and {profile?.dietaryPreference} dietary style.
            </p>

            {!aiMealPlan ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={generatingAi}
                  onClick={handleGenerateAiMealPlan}
                >
                  {generatingAi ? 'Generating Custom Meals...' : 'Generate Daily Meal Plan'}
                  {!generatingAi && <Sparkles size={18} />}
                </button>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    marginBottom: '1rem',
                    maxHeight: '300px',
                    overflowY: 'auto',
                  }}
                >
                  {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                    <div key={type} style={{ marginBottom: '0.75rem' }}>
                      <strong style={{ textTransform: 'capitalize', color: '#10b981', fontSize: '0.9rem' }}>
                        {type}:
                      </strong>
                      <div style={{ marginTop: '4px', fontSize: '0.85rem' }}>
                        {aiMealPlan[type]?.map((item: any) => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                            <span>{item.name} ({item.portion})</span>
                            <span style={{ color: 'var(--text-muted)' }}>{item.calories} kcal</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setAiMealPlan(null)}>
                    Re-roll
                  </button>
                  <button type="button" className="btn-primary" style={{ flex: 2 }} onClick={handleApplyAiMealPlan}>
                    Apply to Today's Food Log
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Healthy Food Swap Modal */}
      {isSwapModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsSwapModalOpen(false)}>
          <div className="modal-content" style={{ padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <ArrowRightLeft size={22} color="#06b6d4" />
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>AI Healthy Food Swap</h3>
              </div>
              <button onClick={() => setIsSwapModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Craving high-calorie snacks or refined foods? Get nutrient-dense, satisfying alternatives with clear wellness benefits.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Potato chips, Vanilla ice cream, Donut, Soda..."
                value={swapInput}
                onChange={(e) => setSwapInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleRequestSwap();
                  }
                }}
              />
              <button
                type="button"
                className="btn-primary"
                disabled={isSwapping || !swapInput.trim()}
                onClick={() => handleRequestSwap()}
                style={{ whiteSpace: 'nowrap' }}
              >
                {isSwapping ? 'Analyzing...' : 'Find Swap'}
              </button>
            </div>

            {/* Quick Suggestions Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
              {['Potato Chips', 'Ice Cream', 'Soda', 'White Bread', 'Fried Chicken', 'Candy Bar'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setSwapInput(preset);
                    handleRequestSwap(preset);
                  }}
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-full)',
                    padding: '0.25rem 0.65rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Swap Results Display */}
            {swapResult && (
              <div
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <CheckCircle2 size={18} color="#10b981" />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Original: <del>{swapResult.original}</del>
                  </span>
                </div>

                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981', marginBottom: '0.5rem' }}>
                  {swapResult.swap}
                </div>

                <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                  {swapResult.benefit}
                </p>

                <div style={{ fontSize: '0.8rem', color: '#06b6d4', background: 'rgba(6, 182, 212, 0.1)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
                  Estimated Profile: {swapResult.estimatedMacros}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Quick Log to:</span>
                  {(['snack', 'breakfast', 'lunch', 'dinner'] as const).map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', textTransform: 'capitalize' }}
                      onClick={() => handleApplySwapAsFood(slot)}
                    >
                      + {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
