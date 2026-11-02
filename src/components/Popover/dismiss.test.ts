/// <reference types="vitest" />

import { afterEach, describe, expect, it } from 'vitest';
import { isInsideOwnedPortal } from '@/components/Popover';

function setup() {
  document.body.innerHTML = `
    <div id="root"><button id="trigger" aria-controls="owned-listbox"></button><span id="inner"></span></div>
    <div id="owned-listbox" role="listbox"><button id="owned-option" role="option"></button></div>
    <div id="foreign-listbox" role="listbox"><button id="foreign-option" role="option"></button></div>
    <div id="bare"><span id="bare-inner"></span></div>`;
  const get = (id: string) => document.getElementById(id) as HTMLElement;
  return { root: get('root'), get };
}

describe('isInsideOwnedPortal', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('is true inside a listbox referenced by aria-controls within root', () => {
    const { root, get } = setup();
    expect(isInsideOwnedPortal(get('owned-option'), root)).toBe(true);
    expect(isInsideOwnedPortal(get('owned-listbox'), root)).toBe(true);
  });

  it('is false inside a listbox not owned by root', () => {
    const { root, get } = setup();
    expect(isInsideOwnedPortal(get('foreign-option'), root)).toBe(false);
  });

  it('is false for null or non-Element targets and a null root', () => {
    const { root, get } = setup();
    expect(isInsideOwnedPortal(null, root)).toBe(false);
    expect(isInsideOwnedPortal(window, root)).toBe(false);
    expect(isInsideOwnedPortal(document, root)).toBe(false);
    expect(isInsideOwnedPortal(document.createTextNode('x'), root)).toBe(false);
    expect(isInsideOwnedPortal(get('owned-option'), null)).toBe(false);
  });

  it('is false when root has no aria-controls', () => {
    const { get } = setup();
    expect(isInsideOwnedPortal(get('owned-option'), get('bare'))).toBe(false);
  });

  it('is false for targets inside root itself', () => {
    const { root, get } = setup();
    expect(isInsideOwnedPortal(get('inner'), root)).toBe(false);
    expect(isInsideOwnedPortal(get('trigger'), root)).toBe(false);
  });
});
