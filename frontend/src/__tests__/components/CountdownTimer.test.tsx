import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CountdownTimer from '../../components/CountdownTimer';

describe('CountdownTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the label', () => {
    render(<CountdownTimer targetMs={Date.now() + 86_400_000} label="Pot Reveals In" />);
    expect(screen.getByText('Pot Reveals In')).toBeInTheDocument();
  });

  it('renders unit labels: Days, Hrs, Min, Sec', () => {
    render(<CountdownTimer targetMs={Date.now() + 86_400_000} />);
    expect(screen.getByText('Days')).toBeInTheDocument();
    expect(screen.getByText('Hrs')).toBeInTheDocument();
    expect(screen.getByText('Min')).toBeInTheDocument();
    expect(screen.getByText('Sec')).toBeInTheDocument();
  });

  it('shows "Revealing..." when expired', () => {
    render(<CountdownTimer targetMs={Date.now() - 1_000} />);
    expect(screen.getByText('Revealing...')).toBeInTheDocument();
  });

  it('does not show unit labels when expired', () => {
    render(<CountdownTimer targetMs={Date.now() - 1_000} />);
    expect(screen.queryByText('Days')).not.toBeInTheDocument();
  });

  it('uses urgent (red) styling when under 1 hour', () => {
    const { container } = render(<CountdownTimer targetMs={Date.now() + 1_800_000} />); // 30 min
    const redEl = container.querySelector('.text-red-400');
    expect(redEl).toBeInTheDocument();
  });

  it('uses normal (white) styling when more than 1 hour remains', () => {
    const { container } = render(<CountdownTimer targetMs={Date.now() + 7_200_000} />); // 2 hours
    const whiteEl = container.querySelector('.text-white');
    expect(whiteEl).toBeInTheDocument();
  });

  it('uses default label "Reveals In" when no label prop passed', () => {
    render(<CountdownTimer targetMs={Date.now() + 86_400_000} />);
    expect(screen.getByText('Reveals In')).toBeInTheDocument();
  });
});
