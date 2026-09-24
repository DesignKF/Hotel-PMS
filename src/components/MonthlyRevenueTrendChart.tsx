import React, { useState, useMemo } from 'react';
import { useBooking } from '../context/BookingContext';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell
} from 'recharts';
import { formatMoney, formatDateDisplay } from '../utils/formatters';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar as CalendarIcon, 
  DollarSign, 
  CreditCard, 
  AlertTriangle, 
  XCircle, 
  UserX, 
  RotateCcw, 
  Table, 
  Check, 
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

type ChartType = 'block' | 'line';
type StatusOption = 'all_active' | 'confirmed_only' | 'all_including_cancelled';

interface RevenuePoint {
  key: string;
  label: string;
  revenue: number;
  revenueTZS: number;
  bookingsCount: number;
  unpaidBalanceTZS: number;
  cancellationsCount: number;
  noShowsCount: number;
  refundsTZS: number;
  hasData: boolean;
}

export const MonthlyRevenueTrendChart: React.FC = () => {
  const { bookings, currency, exchangeRates } = useBooking();

  // 1. Chart type toggle: block (BarChart) vs line (LineChart)
  const [chartType, setChartType] = useState<ChartType>('block');

  // 2. Flexible Date Range State (default to user's example: 2025-04-01 to 2026-09-30)
  const [startDate, setStartDate] = useState<string>('2025-04-01');
  const [endDate, setEndDate] = useState<string>('2026-09-30');
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState<boolean>(true);

  // Status Filter
  const [status, setStatus] = useState<StatusOption>('all_active');
  const [showTableView, setShowTableView] = useState<boolean>(false);

  // Quick Preset Helper
  const setRangePreset = (preset: string) => {
    const today = new Date('2026-09-24');
    if (preset === 'this_month') {
      setStartDate('2026-09-01');
      setEndDate('2026-09-30');
    } else if (preset === 'last_3_months') {
      setStartDate('2026-07-01');
      setEndDate('2026-09-30');
    } else if (preset === 'last_6_months') {
      setStartDate('2026-04-01');
      setEndDate('2026-09-30');
    } else if (preset === 'year_2026') {
      setStartDate('2026-01-01');
      setEndDate('2026-12-31');
    } else if (preset === 'year_2025') {
      setStartDate('2025-01-01');
      setEndDate('2025-12-31');
    } else if (preset === 'apr25_sep26') {
      // User's specific target example
      setStartDate('2025-04-01');
      setEndDate('2026-09-30');
    }
  };

  // Determine active preset key for button highlights
  const activePreset = useMemo(() => {
    if (startDate === '2025-04-01' && endDate === '2026-09-30') return 'apr25_sep26';
    if (startDate === '2026-09-01' && endDate === '2026-09-30') return 'this_month';
    if (startDate === '2026-07-01' && endDate === '2026-09-30') return 'last_3_months';
    if (startDate === '2026-04-01' && endDate === '2026-09-30') return 'last_6_months';
    if (startDate === '2026-01-01' && endDate === '2026-12-31') return 'year_2026';
    if (startDate === '2025-01-01' && endDate === '2025-12-31') return 'year_2025';
    return 'custom';
  }, [startDate, endDate]);

  // Filter all bookings within the selected flexible date range
  const periodBookings = useMemo(() => {
    return bookings.filter(b => {
      // Booking overlaps or falls in the date window
      const inWindow = b.checkIn >= startDate && b.checkIn <= endDate;
      return inWindow;
    });
  }, [bookings, startDate, endDate]);

  // Measurable Metrics Computations for the selected period
  const metrics = useMemo(() => {
    // 1. Active Stays (for revenue)
    const activeStays = periodBookings.filter(b => 
      b.status !== 'Cancelled' && 
      b.status !== 'Refunded' && 
      b.status !== 'No-show'
    );
    const bookedRevenueTZS = activeStays.reduce((sum, b) => sum + (b.stayTotalTZS || 0), 0);

    // 2. Collected Payments
    const collectedPaymentsTZS = activeStays.reduce((sum, b) => {
      if (b.paymentStatus === 'Paid in Full') return sum + b.stayTotalTZS;
      return sum + (b.depositPaidTZS || 0);
    }, 0);

    // 3. Unpaid Balances (Service Rendered): guests who checked-in or checked-out with unpaid balance
    const servicedWithBalance = periodBookings.filter(b => 
      (b.status === 'Checked-in' || b.status === 'Checked-out') && 
      b.balanceDueTZS > 0
    );
    const totalUnpaidBalancesTZS = servicedWithBalance.reduce((sum, b) => sum + b.balanceDueTZS, 0);

    // 4. Cancellations
    const cancellations = periodBookings.filter(b => b.status === 'Cancelled');
    const cancelledLostRevenueTZS = cancellations.reduce((sum, b) => sum + b.stayTotalTZS, 0);

    // 5. No-shows
    const noShows = periodBookings.filter(b => b.status === 'No-show' || b.isNoShow);
    const noShowLostRevenueTZS = noShows.reduce((sum, b) => sum + b.stayTotalTZS, 0);

    // 6. Refunds
    const refunds = periodBookings.filter(b => b.status === 'Refunded' || (b.refundAmountTZS && b.refundAmountTZS > 0));
    const totalRefundsTZS = refunds.reduce((sum, b) => sum + (b.refundAmountTZS || b.depositPaidTZS || b.stayTotalTZS), 0);

    return {
      activeStaysCount: activeStays.length,
      bookedRevenueTZS,
      collectedPaymentsTZS,
      servicedWithBalanceCount: servicedWithBalance.length,
      totalUnpaidBalancesTZS,
      cancellationsCount: cancellations.length,
      cancelledLostRevenueTZS,
      noShowsCount: noShows.length,
      noShowLostRevenueTZS,
      refundsCount: refunds.length,
      totalRefundsTZS
    };
  }, [periodBookings]);

  // Generate bucket intervals for the chart dynamically based on startDate & endDate
  const chartData: RevenuePoint[] = useMemo(() => {
    if (!startDate || !endDate) return [];

    const start = new Date(startDate);
    const end = new Date(endDate);
    const daySpan = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Case A: Short duration (<= 35 days) -> breakdown by weekly or 5-day intervals
    if (daySpan <= 35) {
      const buckets: { key: string; label: string; start: string; end: string }[] = [];
      let cur = new Date(start);

      let stepDays = daySpan <= 14 ? 2 : 7;
      let idx = 1;

      while (cur <= end) {
        const bStart = cur.toISOString().slice(0, 10);
        const next = new Date(cur);
        next.setDate(next.getDate() + (stepDays - 1));
        const bEnd = next > end ? end.toISOString().slice(0, 10) : next.toISOString().slice(0, 10);

        const sDay = cur.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
        const eDay = next > end ? end.toLocaleDateString('en-GB', { day: 'numeric' }) : next.toLocaleDateString('en-GB', { day: 'numeric' });

        buckets.push({
          key: `bucket-${idx++}`,
          label: `${sDay}–${eDay}`,
          start: bStart,
          end: bEnd
        });

        cur.setDate(cur.getDate() + stepDays);
      }

      return buckets.map(b => {
        const bBookings = periodBookings.filter(item => {
          if (status === 'confirmed_only' && item.status !== 'Confirmed') return false;
          if (status === 'all_active' && (item.status === 'Cancelled' || item.status === 'Refunded')) return false;
          return item.checkIn >= b.start && item.checkIn <= b.end;
        });

        const revenueTZS = bBookings.reduce((sum, item) => sum + (item.stayTotalTZS || 0), 0);
        const converted = currency === 'TZS' ? revenueTZS : revenueTZS / (exchangeRates[currency] || 2650);

        const unpaidBalances = bBookings
          .filter(item => (item.status === 'Checked-in' || item.status === 'Checked-out') && item.balanceDueTZS > 0)
          .reduce((sum, item) => sum + item.balanceDueTZS, 0);

        const cancels = periodBookings.filter(item => item.status === 'Cancelled' && item.checkIn >= b.start && item.checkIn <= b.end).length;
        const noShows = periodBookings.filter(item => (item.status === 'No-show' || item.isNoShow) && item.checkIn >= b.start && item.checkIn <= b.end).length;
        const refTZS = periodBookings.filter(item => item.status === 'Refunded' && item.checkIn >= b.start && item.checkIn <= b.end).reduce((sum, item) => sum + (item.refundAmountTZS || item.stayTotalTZS), 0);

        return {
          key: b.key,
          label: b.label,
          revenue: Math.round(converted),
          revenueTZS,
          bookingsCount: bBookings.length,
          unpaidBalanceTZS: unpaidBalances,
          cancellationsCount: cancels,
          noShowsCount: noShows,
          refundsTZS: refTZS,
          hasData: revenueTZS > 0
        };
      });
    }

    // Case B: Multi-month duration (> 35 days) -> iterate months across calendar years
    const months: { key: string; label: string; year: number; month: number }[] = [];
    const curDate = new Date(start.getFullYear(), start.getMonth(), 1);
    const lastDate = new Date(end.getFullYear(), end.getMonth(), 1);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    while (curDate <= lastDate) {
      const y = curDate.getFullYear();
      const m = curDate.getMonth();
      const mKey = `${y}-${String(m + 1).padStart(2, '0')}`;
      const shortYear = String(y).slice(-2);
      const isMultiYear = start.getFullYear() !== end.getFullYear();
      const label = isMultiYear ? `${monthNames[m]} '${shortYear}` : monthNames[m];

      months.push({
        key: mKey,
        label,
        year: y,
        month: m + 1
      });

      curDate.setMonth(curDate.getMonth() + 1);
    }

    return months.map(m => {
      const monthBookings = periodBookings.filter(item => {
        if (status === 'confirmed_only' && item.status !== 'Confirmed') return false;
        if (status === 'all_active' && (item.status === 'Cancelled' || item.status === 'Refunded')) return false;
        return item.checkIn.startsWith(m.key);
      });

      const revenueTZS = monthBookings.reduce((sum, item) => sum + (item.stayTotalTZS || 0), 0);
      const converted = currency === 'TZS' ? revenueTZS : revenueTZS / (exchangeRates[currency] || 2650);

      const unpaidBalances = monthBookings
        .filter(item => (item.status === 'Checked-in' || item.status === 'Checked-out') && item.balanceDueTZS > 0)
        .reduce((sum, item) => sum + item.balanceDueTZS, 0);

      const cancels = periodBookings.filter(item => item.status === 'Cancelled' && item.checkIn.startsWith(m.key)).length;
      const noShows = periodBookings.filter(item => (item.status === 'No-show' || item.isNoShow) && item.checkIn.startsWith(m.key)).length;
      const refTZS = periodBookings.filter(item => item.status === 'Refunded' && item.checkIn.startsWith(m.key)).reduce((sum, item) => sum + (item.refundAmountTZS || item.stayTotalTZS), 0);

      return {
        key: m.key,
        label: m.label,
        revenue: Math.round(converted),
        revenueTZS,
        bookingsCount: monthBookings.length,
        unpaidBalanceTZS: unpaidBalances,
        cancellationsCount: cancels,
        noShowsCount: noShows,
        refundsTZS: refTZS,
        hasData: revenueTZS > 0
      };
    });

  }, [startDate, endDate, periodBookings, status, currency, exchangeRates]);

  const totalPeriodRevenueTZS = chartData.reduce((sum, d) => sum + d.revenueTZS, 0);
  const totalPeriodMoney = formatMoney(
    currency === 'TZS' ? totalPeriodRevenueTZS : totalPeriodRevenueTZS / (exchangeRates[currency] || 2650),
    currency,
    exchangeRates
  );

  const pointsWithDataCount = chartData.filter(d => d.hasData).length;

  return (
    <div className="card-surface p-5 space-y-5">
      {/* 1. Header with Period Title, Dual Total & Action Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-subtle">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-bold text-primary">
              Revenue summary
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--primary-gold)]/15 text-[var(--primary-gold)] border border-[var(--primary-gold)]/30 font-bold">
              {formatDateDisplay(startDate)} – {formatDateDisplay(endDate)}
            </span>
          </div>

          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-xs text-secondary">
              Period Booked Revenue:
            </span>
            <span className="text-sm font-bold text-primary tabular-nums">
              {totalPeriodMoney.primary}
            </span>
            <span className="text-xs text-tertiary tabular-nums">
              ({totalPeriodMoney.secondary})
            </span>
          </div>
        </div>

        {/* Top Control Bar: Chart Toggle, Presets, Accessible Table */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Chart View Toggle: Block (Bar) vs Line */}
          <div className="flex items-center bg-surface-2 p-1 rounded-xl border border-subtle text-xs">
            <button
              type="button"
              onClick={() => setChartType('block')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                chartType === 'block'
                  ? 'bg-surface-1 text-primary shadow-xs font-bold border border-subtle'
                  : 'text-secondary hover:text-primary'
              }`}
              title="Switch to Block (Bar) Chart"
            >
              <BarChart3 className="w-3.5 h-3.5 text-[var(--primary-gold)]" />
              <span>Block</span>
            </button>

            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                chartType === 'line'
                  ? 'bg-surface-1 text-primary shadow-xs font-bold border border-subtle'
                  : 'text-secondary hover:text-primary'
              }`}
              title="Switch to Line Chart"
            >
              <TrendingUp className="w-3.5 h-3.5 text-[var(--primary-gold)]" />
              <span>Line</span>
            </button>
          </div>

          {/* Table Alternative Toggle */}
          <button
            type="button"
            onClick={() => setShowTableView(!showTableView)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-subtle bg-surface-2 text-secondary hover:text-primary transition-colors cursor-pointer flex items-center gap-1"
          >
            <Table className="w-3.5 h-3.5" />
            <span>{showTableView ? 'Show Graph' : 'Table View'}</span>
          </button>

          {/* Status selector */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusOption)}
            className="input-surface !py-1 !px-2.5 !text-xs font-semibold cursor-pointer"
          >
            <option value="all_active">All active stays</option>
            <option value="confirmed_only">Confirmed only</option>
            <option value="all_including_cancelled">All records (incl. cancellations)</option>
          </select>
        </div>
      </div>

      {/* 2. Flexible Date Widget & Quick Presets Bar */}
      <div className="p-3 bg-surface-2 rounded-2xl border border-subtle space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Quick Presets Pills */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-[11px] font-bold text-tertiary uppercase tracking-wider mr-1 flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Period:</span>
            </span>

            {[
              { id: 'apr25_sep26', label: '1 Apr 2025 – 30 Sep 2026' },
              { id: 'year_2026', label: 'Full Year 2026' },
              { id: 'year_2025', label: 'Full Year 2025' },
              { id: 'last_6_months', label: 'Last 6 Months' },
              { id: 'last_3_months', label: 'Last 3 Months' },
              { id: 'this_month', label: 'Sep 2026' }
            ].map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setRangePreset(preset.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activePreset === preset.id
                    ? 'bg-[var(--primary-gold)] text-[var(--primary-gold-text)] font-bold shadow-xs'
                    : 'bg-surface-1 text-secondary hover:text-primary border border-subtle'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Date Widget Inputs (From / To) */}
          <div className="flex items-center gap-2 self-start md:self-auto bg-surface-1 p-1.5 rounded-xl border border-subtle text-xs">
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] text-tertiary font-semibold">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-surface !py-0.5 !px-2 !text-xs font-semibold"
              />
            </div>

            <span className="text-tertiary">→</span>

            <div className="flex items-center gap-1.5">
              <label className="text-[11px] text-tertiary font-semibold">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-surface !py-0.5 !px-2 !text-xs font-semibold"
              />
            </div>
          </div>

        </div>
      </div>

      {/* 3. Measurable Metrics Grid (Cancellations, No-shows, Balances from service rendered, Refunds, Collections) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: Booked Revenue */}
        <div className="p-3 rounded-xl bg-surface-2 border border-subtle space-y-1">
          <div className="flex items-center justify-between text-secondary">
            <span className="text-[11px] font-semibold text-tertiary uppercase">Booked Revenue</span>
            <DollarSign className="w-3.5 h-3.5 text-[var(--primary-gold)]" />
          </div>
          <div className="text-base font-bold text-primary tabular-nums">
            {formatMoney(currency === 'TZS' ? metrics.bookedRevenueTZS : metrics.bookedRevenueTZS / (exchangeRates[currency] || 2650), currency, exchangeRates).primary}
          </div>
          <span className="text-[11px] text-secondary block">
            {metrics.activeStaysCount} stays in period
          </span>
        </div>

        {/* Metric 2: Collected Payments */}
        <div className="p-3 rounded-xl bg-surface-2 border border-subtle space-y-1">
          <div className="flex items-center justify-between text-secondary">
            <span className="text-[11px] font-semibold text-tertiary uppercase">Collected</span>
            <CreditCard className="w-3.5 h-3.5 text-[var(--status-success-text)]" />
          </div>
          <div className="text-base font-bold text-[var(--status-success-text)] tabular-nums">
            {formatMoney(currency === 'TZS' ? metrics.collectedPaymentsTZS : metrics.collectedPaymentsTZS / (exchangeRates[currency] || 2650), currency, exchangeRates).primary}
          </div>
          <span className="text-[11px] text-secondary block">
            {metrics.bookedRevenueTZS > 0 
              ? `${Math.round((metrics.collectedPaymentsTZS / metrics.bookedRevenueTZS) * 100)}% realization`
              : '100% realization'}
          </span>
        </div>

        {/* Metric 3: Balances Due (Service Rendered) */}
        <div className="p-3 rounded-xl bg-surface-2 border border-[var(--status-warning-border)] space-y-1">
          <div className="flex items-center justify-between text-secondary">
            <span className="text-[11px] font-semibold text-[var(--status-warning-text)] uppercase">Unpaid Balances</span>
            <AlertTriangle className="w-3.5 h-3.5 text-[var(--status-warning-text)]" />
          </div>
          <div className="text-base font-bold text-[var(--status-warning-text)] tabular-nums">
            {formatMoney(currency === 'TZS' ? metrics.totalUnpaidBalancesTZS : metrics.totalUnpaidBalancesTZS / (exchangeRates[currency] || 2650), currency, exchangeRates).primary}
          </div>
          <span className="text-[11px] text-secondary block line-clamp-1" title="Guests who received service but have an outstanding balance">
            {metrics.servicedWithBalanceCount} serviced guest{metrics.servicedWithBalanceCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Metric 4: Cancellations */}
        <div className="p-3 rounded-xl bg-surface-2 border border-subtle space-y-1">
          <div className="flex items-center justify-between text-secondary">
            <span className="text-[11px] font-semibold text-tertiary uppercase">Cancellations</span>
            <XCircle className="w-3.5 h-3.5 text-[var(--status-danger-text)]" />
          </div>
          <div className="text-base font-bold text-primary tabular-nums">
            {metrics.cancellationsCount}
          </div>
          <span className="text-[11px] text-tertiary block">
            {formatMoney(currency === 'TZS' ? metrics.cancelledLostRevenueTZS : metrics.cancelledLostRevenueTZS / (exchangeRates[currency] || 2650), currency, exchangeRates).primary} lost
          </span>
        </div>

        {/* Metric 5: No-Shows */}
        <div className="p-3 rounded-xl bg-surface-2 border border-subtle space-y-1">
          <div className="flex items-center justify-between text-secondary">
            <span className="text-[11px] font-semibold text-tertiary uppercase">No-Shows</span>
            <UserX className="w-3.5 h-3.5 text-[var(--status-danger-text)]" />
          </div>
          <div className="text-base font-bold text-primary tabular-nums">
            {metrics.noShowsCount}
          </div>
          <span className="text-[11px] text-tertiary block">
            {formatMoney(currency === 'TZS' ? metrics.noShowLostRevenueTZS : metrics.noShowLostRevenueTZS / (exchangeRates[currency] || 2650), currency, exchangeRates).primary} lost
          </span>
        </div>

        {/* Metric 6: Refunds */}
        <div className="p-3 rounded-xl bg-surface-2 border border-subtle space-y-1">
          <div className="flex items-center justify-between text-secondary">
            <span className="text-[11px] font-semibold text-tertiary uppercase">Refunds</span>
            <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-base font-bold text-primary tabular-nums">
            {metrics.refundsCount}
          </div>
          <span className="text-[11px] text-tertiary block">
            {formatMoney(currency === 'TZS' ? metrics.totalRefundsTZS : metrics.totalRefundsTZS / (exchangeRates[currency] || 2650), currency, exchangeRates).primary} returned
          </span>
        </div>
      </div>

      {/* 4. Chart or Accessible Table View */}
      {showTableView ? (
        <div className="overflow-x-auto border border-subtle rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-2 text-secondary border-b border-subtle">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Period Interval</th>
                <th className="py-2.5 px-3 font-semibold">Active Stays</th>
                <th className="py-2.5 px-3 font-semibold text-right">Revenue ({currency})</th>
                <th className="py-2.5 px-3 font-semibold text-right">Serviced Balance</th>
                <th className="py-2.5 px-3 font-semibold text-center">Cancellations</th>
                <th className="py-2.5 px-3 font-semibold text-center">No-Shows</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {chartData.map((d) => (
                <tr key={d.key} className="hover:bg-surface-2/50">
                  <td className="py-2 px-3 font-semibold text-primary">{d.label}</td>
                  <td className="py-2 px-3 text-secondary">{d.bookingsCount}</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-primary">
                    {formatMoney(currency === 'TZS' ? d.revenueTZS : d.revenueTZS / (exchangeRates[currency] || 2650), currency, exchangeRates).primary}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-[var(--status-warning-text)]">
                    {d.unpaidBalanceTZS > 0
                      ? formatMoney(currency === 'TZS' ? d.unpaidBalanceTZS : d.unpaidBalanceTZS / (exchangeRates[currency] || 2650), currency, exchangeRates).primary
                      : '—'}
                  </td>
                  <td className="py-2 px-3 text-center text-secondary">
                    {d.cancellationsCount > 0 ? (
                      <span className="text-[var(--status-danger-text)] font-semibold">{d.cancellationsCount}</span>
                    ) : '0'}
                  </td>
                  <td className="py-2 px-3 text-center text-secondary">
                    {d.noShowsCount > 0 ? (
                      <span className="text-[var(--status-danger-text)] font-semibold">{d.noShowsCount}</span>
                    ) : '0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : pointsWithDataCount === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-surface-2 rounded-xl border border-dashed border-strong">
          <CalendarIcon className="w-8 h-8 text-tertiary mb-2" />
          <span className="text-sm font-semibold text-primary">No revenue recorded in this custom range</span>
          <span className="text-xs text-secondary mt-1">
            Pick a wider range like "1 Apr 2025 – 30 Sep 2026" or "Full Year 2026" to view historical revenue.
          </span>
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'block' ? (
              /* Block (Bar) Chart */
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} 
                  axisLine={{ stroke: 'var(--border-subtle)' }}
                  tickLine={false}
                />
                <YAxis 
                  domain={[0, 'auto']}
                  tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} 
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val}`}
                />
                <Tooltip 
                  cursor={{ fill: 'var(--surface-2)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as RevenuePoint;
                      const money = formatMoney(
                        currency === 'TZS' ? data.revenueTZS : data.revenueTZS / (exchangeRates[currency] || 2650),
                        currency,
                        exchangeRates
                      );
                      const balMoney = formatMoney(
                        currency === 'TZS' ? data.unpaidBalanceTZS : data.unpaidBalanceTZS / (exchangeRates[currency] || 2650),
                        currency,
                        exchangeRates
                      );

                      return (
                        <div className="bg-surface-2 text-primary border border-strong p-3.5 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[200px]">
                          <div className="font-bold text-primary border-b border-subtle pb-1">
                            {data.label}
                          </div>
                          <div className="flex justify-between items-center text-secondary">
                            <span>Revenue:</span>
                            <span className="font-bold text-primary">{money.primary}</span>
                          </div>
                          <div className="text-[11px] text-tertiary flex justify-between">
                            <span>Dual:</span>
                            <span>{money.secondary}</span>
                          </div>
                          <div className="flex justify-between items-center text-secondary">
                            <span>Stays:</span>
                            <span className="font-semibold text-primary">{data.bookingsCount}</span>
                          </div>
                          {data.unpaidBalanceTZS > 0 && (
                            <div className="flex justify-between items-center text-[var(--status-warning-text)] border-t border-subtle pt-1">
                              <span>Unpaid Balance:</span>
                              <span className="font-semibold">{balMoney.primary}</span>
                            </div>
                          )}
                          {(data.cancellationsCount > 0 || data.noShowsCount > 0) && (
                            <div className="text-[11px] text-tertiary border-t border-subtle pt-1 flex justify-between">
                              <span>Cancels / No-shows:</span>
                              <span>{data.cancellationsCount} / {data.noShowsCount}</span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={44}>
                  {chartData.map((entry) => (
                    <Cell 
                      key={entry.key} 
                      fill={entry.hasData ? '#f8b742' : 'var(--surface-3)'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              /* Line Chart */
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} 
                  axisLine={{ stroke: 'var(--border-subtle)' }}
                  tickLine={false}
                />
                <YAxis 
                  domain={[0, 'auto']}
                  tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} 
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val}`}
                />
                <Tooltip 
                  cursor={{ stroke: 'var(--primary-gold)', strokeWidth: 1, strokeDasharray: '4 4' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as RevenuePoint;
                      const money = formatMoney(
                        currency === 'TZS' ? data.revenueTZS : data.revenueTZS / (exchangeRates[currency] || 2650),
                        currency,
                        exchangeRates
                      );
                      const balMoney = formatMoney(
                        currency === 'TZS' ? data.unpaidBalanceTZS : data.unpaidBalanceTZS / (exchangeRates[currency] || 2650),
                        currency,
                        exchangeRates
                      );

                      return (
                        <div className="bg-surface-2 text-primary border border-strong p-3.5 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[200px]">
                          <div className="font-bold text-primary border-b border-subtle pb-1">
                            {data.label}
                          </div>
                          <div className="flex justify-between items-center text-secondary">
                            <span>Revenue:</span>
                            <span className="font-bold text-primary">{money.primary}</span>
                          </div>
                          <div className="text-[11px] text-tertiary flex justify-between">
                            <span>Dual:</span>
                            <span>{money.secondary}</span>
                          </div>
                          <div className="flex justify-between items-center text-secondary">
                            <span>Stays:</span>
                            <span className="font-semibold text-primary">{data.bookingsCount}</span>
                          </div>
                          {data.unpaidBalanceTZS > 0 && (
                            <div className="flex justify-between items-center text-[var(--status-warning-text)] border-t border-subtle pt-1">
                              <span>Unpaid Balance:</span>
                              <span className="font-semibold">{balMoney.primary}</span>
                            </div>
                          )}
                          {(data.cancellationsCount > 0 || data.noShowsCount > 0) && (
                            <div className="text-[11px] text-tertiary border-t border-subtle pt-1 flex justify-between">
                              <span>Cancels / No-shows:</span>
                              <span>{data.cancellationsCount} / {data.noShowsCount}</span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#f8b742" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#f8b742', stroke: 'var(--surface-1)', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#f8b742', stroke: 'var(--surface-1)', strokeWidth: 2 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* 5. Footer Legend & Indicator */}
      <div className="pt-3 border-t border-subtle flex items-center justify-between text-xs text-secondary flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[var(--primary-gold)]" />
            <span className="font-semibold text-primary">Revenue Trend ({chartType === 'block' ? 'Block Bars' : 'Line Curve'})</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[var(--status-warning-bg)] border border-[var(--status-warning-border)]" />
            <span>Unpaid Balances Tracked</span>
          </span>
        </div>
        <span className="text-tertiary">
          Moshi Urban Hostel PMS · Historical &amp; Live Financial Ledger
        </span>
      </div>

    </div>
  );
};
