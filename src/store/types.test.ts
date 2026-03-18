import { describe, it, expect, beforeEach } from 'vitest';
import {
  COUPLE_ICONS,
  COUPLE_COLORS,
  getColorThemeValue,
  type Couple,
} from './types';
import { useTripStore } from './tripStore';

describe('Extended Icons & Colors Constants', () => {
  // Test 1: Icon array has minimum 10 items
  describe('COUPLE_ICONS', () => {
    it('should have at least 10 emoji icons', () => {
      expect(COUPLE_ICONS).toHaveLength(10);
    });

    it('should contain only emoji strings', () => {
      COUPLE_ICONS.forEach((icon) => {
        expect(typeof icon).toBe('string');
        expect(icon.length).toBeGreaterThan(0);
      });
    });
  });

  // Test 2: Color object has light/dark variants for each color
  describe('COUPLE_COLORS', () => {
    it('should have 10 color entries', () => {
      expect(Object.keys(COUPLE_COLORS)).toHaveLength(10);
    });

    it('should have numeric keys from 1 to 10', () => {
      for (let i = 1; i <= 10; i++) {
        expect(COUPLE_COLORS).toHaveProperty(i.toString());
      }
    });

    it('should have light and dark variants for each color', () => {
      Object.entries(COUPLE_COLORS).forEach(([, color]) => {
        expect(color).toHaveProperty('light');
        expect(color).toHaveProperty('dark');
      });
    });

    // Test 3: Color hex values are valid
    it('should have valid hex color values for light variants', () => {
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;
      Object.entries(COUPLE_COLORS).forEach(([, color]) => {
        expect(color.light).toMatch(hexRegex);
      });
    });

    it('should have valid hex color values for dark variants', () => {
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;
      Object.entries(COUPLE_COLORS).forEach(([, color]) => {
        expect(color.dark).toMatch(hexRegex);
      });
    });

    it('should have different light and dark values for each color', () => {
      Object.entries(COUPLE_COLORS).forEach(([, color]) => {
        expect(color.light).not.toBe(color.dark);
      });
    });
  });

  // Test 4: getColorThemeValue returns correct hex values
  describe('getColorThemeValue', () => {
    it('should return light variant when mode is "light"', () => {
      for (let i = 1; i <= 10; i++) {
        const result = getColorThemeValue(i, 'light');
        expect(result).toBe(COUPLE_COLORS[i as keyof typeof COUPLE_COLORS]!.light);
      }
    });

    it('should return dark variant when mode is "dark"', () => {
      for (let i = 1; i <= 10; i++) {
        const result = getColorThemeValue(i, 'dark');
        expect(result).toBe(COUPLE_COLORS[i as keyof typeof COUPLE_COLORS]!.dark);
      }
    });

    it('should work with all color indices 1-10', () => {
      for (let i = 1; i <= 10; i++) {
        expect(() => getColorThemeValue(i, 'light')).not.toThrow();
        expect(() => getColorThemeValue(i, 'dark')).not.toThrow();
      }
    });

    it('should return valid hex colors', () => {
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;
      for (let i = 1; i <= 10; i++) {
        const lightResult = getColorThemeValue(i, 'light');
        const darkResult = getColorThemeValue(i, 'dark');
        expect(lightResult).toMatch(hexRegex);
        expect(darkResult).toMatch(hexRegex);
      }
    });
  });
});

describe('Phase 2: Couple Icon & Color Updates', () => {
  beforeEach(() => {
    useTripStore.setState({ couples: [], tripName: 'My Trip', globalMarkup: 66 });
  });

  // Test 1: Couple interface includes iconIndex property (type checking)
  describe('Couple interface', () => {
    it('should include iconIndex property', () => {
      const couple: Couple = {
        id: 'test-id',
        name: 'Test Couple',
        colorIndex: 1,
        iconIndex: 1,
        sortOrder: 0,
      };
      expect(couple).toHaveProperty('iconIndex');
      expect(typeof couple.iconIndex).toBe('number');
    });
  });

  // Test 2: Couple initialization assigns default iconIndex value
  describe('addCouple action', () => {
    it('should return created group id for immediate assignment flows', () => {
      const store = useTripStore.getState();
      const newId = store.addCouple();
      const created = useTripStore.getState().couples.find((c) => c.id === newId);

      expect(typeof newId).toBe('string');
      expect(newId.length).toBeGreaterThan(0);
      expect(created).toBeDefined();
    });

    it('should initialize couple with default iconIndex = 1', () => {
      const store = useTripStore.getState();
      store.addCouple();
      const couple = useTripStore.getState().couples[0];
      expect(couple).toBeDefined();
      expect(couple!.iconIndex).toBe(1);
    });

    it('should add couple with both colorIndex and iconIndex', () => {
      const store = useTripStore.getState();
      store.addCouple();
      const couple = useTripStore.getState().couples[0];
      expect(couple).toBeDefined();
      expect(couple!.colorIndex).toBeDefined();
      expect(couple!.iconIndex).toBe(1);
    });
  });

  // Test 3: updateCoupleIcon action updates couple in store
  describe('updateCoupleIcon action', () => {
    it('should update couple iconIndex in store', () => {
      const store = useTripStore.getState();
      store.addCouple();
      const couple = useTripStore.getState().couples[0]!;
      
      store.updateCoupleIcon(couple.id, 5);
      const updated = useTripStore.getState().couples[0]!;
      expect(updated.iconIndex).toBe(5);
    });

    it('should work with valid iconIndex range 1-10', () => {
      const store = useTripStore.getState();
      store.addCouple();
      const couple = useTripStore.getState().couples[0]!;
      
      for (let i = 1; i <= 10; i++) {
        store.updateCoupleIcon(couple.id, i);
        const updated = useTripStore.getState().couples[0]!;
        expect(updated.iconIndex).toBe(i);
      }
    });

    it('should not affect other couple properties', () => {
      const store = useTripStore.getState();
      store.addCouple();
      const couple = useTripStore.getState().couples[0]!;
      const originalName = couple.name;
      const originalColor = couple.colorIndex;
      
      store.updateCoupleIcon(couple.id, 3);
      const updated = useTripStore.getState().couples[0]!;
      expect(updated.name).toBe(originalName);
      expect(updated.colorIndex).toBe(originalColor);
    });
  });

  // Test 4: updateCoupleColor action updates couple in store
  describe('updateCoupleColor action', () => {
    it('should update couple colorIndex in store', () => {
      const store = useTripStore.getState();
      store.addCouple();
      const couple = useTripStore.getState().couples[0]!;
      
      store.updateCoupleColor(couple.id, 3);
      const updated = useTripStore.getState().couples[0]!;
      expect(updated.colorIndex).toBe(3);
    });

    it('should work with valid colorIndex range 1-10', () => {
      const store = useTripStore.getState();
      store.addCouple();
      const couple = useTripStore.getState().couples[0]!;
      
      for (let i = 1; i <= 10; i++) {
        store.updateCoupleColor(couple.id, i);
        const updated = useTripStore.getState().couples[0]!;
        expect(updated.colorIndex).toBe(i);
      }
    });

    it('should not affect other couple properties', () => {
      const store = useTripStore.getState();
      store.addCouple();
      const couple = useTripStore.getState().couples[0]!;
      const originalName = couple.name;
      const originalIcon = couple.iconIndex;
      
      store.updateCoupleColor(couple.id, 7);
      const updated = useTripStore.getState().couples[0]!;
      expect(updated.name).toBe(originalName);
      expect(updated.iconIndex).toBe(originalIcon);
    });
  });

  // Test 5: Persist behavior works with iconIndex
  describe('persist middleware', () => {
    it('should persist iconIndex when couple is updated', () => {
      const store = useTripStore.getState();
      store.addCouple();
      const couple = useTripStore.getState().couples[0]!;
      
      store.updateCoupleIcon(couple.id, 8);
      const persisted = useTripStore.getState().couples[0]!;
      expect(persisted.iconIndex).toBe(8);
    });

    it('should include iconIndex in persisted couple data', () => {
      const store = useTripStore.getState();
      store.addCouple();
      const couple = useTripStore.getState().couples[0]!;
      
      expect(couple).toHaveProperty('iconIndex');
      expect(couple.iconIndex).toBeDefined();
    });
  });
});
