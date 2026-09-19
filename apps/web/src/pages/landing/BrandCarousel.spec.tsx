import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BrandCarousel } from './BrandCarousel';
import { BRANDS_HEADING, DEALER_BRANDS } from './landing-content';

function renderCarousel() {
  return render(
    <MemoryRouter>
      <BrandCarousel />
    </MemoryRouter>,
  );
}

describe('BrandCarousel', () => {
  test('is titled as the authorized dealer strip', () => {
    renderCarousel();

    expect(screen.getByRole('heading', { name: BRANDS_HEADING })).toBeInTheDocument();
    expect(BRANDS_HEADING).toBe('Authorized dealer for');
  });

  test('offers Squirrel, Vigil and FlySight, each exactly once to assistive technology', () => {
    renderCarousel();

    expect(DEALER_BRANDS.map((brand) => brand.name)).toEqual(['Squirrel', 'Vigil', 'FlySight']);
    expect(screen.getAllByRole('link')).toHaveLength(3);
    for (const brand of DEALER_BRANDS) {
      expect(screen.getByRole('link', { name: brand.name })).toBeInTheDocument();
    }
  });

  test('each logo opens the shop filtered to that brand', () => {
    renderCarousel();

    for (const brand of DEALER_BRANDS) {
      expect(screen.getByRole('link', { name: brand.name })).toHaveAttribute('href', `/shop?brand=${brand.slug}`);
    }
  });

  test('every logo image is the brand file from public/brands', () => {
    renderCarousel();

    for (const brand of DEALER_BRANDS) {
      expect(screen.getByRole('img', { name: brand.name })).toHaveAttribute('src', `/brands/${brand.file}`);
    }
  });

  test('every logo is shown in greyscale so the strip stays in the site palette', () => {
    renderCarousel();

    for (const brand of DEALER_BRANDS) {
      expect(screen.getByRole('img', { name: brand.name })).toHaveStyle('filter: grayscale(1) brightness(0.65)');
    }
  });

  test('the repeated copies that make the loop seamless are hidden from assistive technology and the tab order', () => {
    const { container } = renderCarousel();

    const hiddenItems = container.querySelectorAll('li[aria-hidden="true"]');
    expect(hiddenItems.length).toBeGreaterThan(DEALER_BRANDS.length);
    for (const item of hiddenItems) {
      expect(item.querySelector('a')).toHaveAttribute('tabindex', '-1');
    }
  });
});
