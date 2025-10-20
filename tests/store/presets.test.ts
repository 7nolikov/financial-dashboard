import { describe, it, expect } from 'vitest';
import { useStore } from '../../src/state/store';

describe('Store Presets', () => {
  it('should load worker preset with correct data', () => {
    const store = useStore.getState();
    store.loadPreset('worker');
    
    const state = useStore.getState();
    expect(state.dobISO).toBe('1990-01-01');
    expect(state.incomes).toHaveLength(4); // Updated: 4 income sources with career progression
    expect(state.incomes[0]?.label).toBe('Salary');
    expect(state.incomes[0]?.amount).toBe(4200); // Updated: realistic entry-level salary
    expect(state.expenses).toHaveLength(6); // Updated: more detailed expense categories
    expect(state.investments).toHaveLength(2); // Updated: 401k + Roth IRA
    expect(state.investments[0]?.label).toBe('401k (6% match)');
  });

  it('should load investor preset with correct data', () => {
    const store = useStore.getState();
    store.loadPreset('investor');
    
    const state = useStore.getState();
    expect(state.dobISO).toBe('1985-01-01');
    expect(state.incomes).toHaveLength(3); // Updated: salary + bonus + dividends
    expect(state.incomes[0]?.label).toBe('Tech Salary');
    expect(state.incomes[0]?.amount).toBe(10000); // Updated: realistic tech salary
    expect(state.investments).toHaveLength(3); // Updated: index fund + stocks + 401k max
    expect(state.retirement?.age).toBe(55);
  });

  it('should clear all data when clearAllData is called', () => {
    const store = useStore.getState();
    store.loadPreset('investor'); // Load some data first
    
    const stateBefore = useStore.getState();
    expect(stateBefore.incomes.length).toBeGreaterThan(0);
    
    store.clearAllData();
    
    const stateAfter = useStore.getState();
    expect(stateAfter.incomes).toHaveLength(0);
    expect(stateAfter.expenses).toHaveLength(0);
    expect(stateAfter.investments).toHaveLength(0);
    expect(stateAfter.safetySavings).toHaveLength(0);
    expect(stateAfter.milestones).toHaveLength(0);
    // Should still have basic settings
    expect(stateAfter.dobISO).toBe('1990-01-01');
    expect(stateAfter.inflation).toBeDefined();
  });
});
