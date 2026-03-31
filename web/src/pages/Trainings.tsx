import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Filter, Calendar as CalendarIcon, Loader2, RefreshCw, Users, MapPin, Building2, Clock, X } from 'lucide-react';
import {
  format, differenceInDays,
  startOfWeek, endOfWeek, startOfQuarter, endOfQuarter,
  startOfYear, endOfYear, endOfMonth,
  isWithinInterval, addDays
} from 'date-fns';
import api from '../lib/axios';
import { TRAINING_CATEGORIES, getCategoryConfig } from '../lib/trainingTypes';

type ViewMode = 'week' | 'quarter' | 'semester' | 'year';

// Whether a view mode should use weekly grouping
const isWeeklyView = (mode: ViewMode) => mode === 'semester' || mode === 'year';

// ── Week-based column type ──────────────────────────────────────────
interface WeekColumn {
  label: string;       // e.g. "W1", "W2"
  sublabel: string;    // e.g. "Jan 6"
  start: Date;
  end: Date;
  monthLabel?: string; // for month separators
}

const Trainings = () => {
  const [trainings, setTrainings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [viewMode, setViewMode] = useState<ViewMode>('quarter');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedEmp, setSelectedEmp] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // View Range State
  const [baseDate, setBaseDate] = useState(new Date());

  // Drag-to-scroll states
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Training Detail Modal
  const [selectedTraining, setSelectedTraining] = useState<any | null>(null);

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/trainings');
      setTrainings(res.data);
    } catch (error) {
      console.error('Failed to fetch trainings', error);
    } finally {
      setLoading(false);
    }
  };

  const departments = useMemo(() => {
    const depts = new Set<string>();
    trainings.forEach(t => t.participants?.forEach((p: any) => depts.add(p.employee.department)));
    return Array.from(depts);
  }, [trainings]);

  const employeesOptions = useMemo(() => {
    const emps = new Map<string, string>();
    trainings.forEach(t => t.participants?.forEach((p: any) => emps.set(p.employee.id, p.employee.name)));
    return Array.from(emps.entries()).map(([id, name]) => ({ id, name }));
  }, [trainings]);

  // ── Calculate View Range ──────────────────────────────────────────
  const viewRange = useMemo(() => {
    switch (viewMode) {
      case 'quarter':
        return { start: startOfQuarter(baseDate), end: endOfQuarter(baseDate) };
      case 'semester': {
        const year = baseDate.getFullYear();
        const isFirstHalf = baseDate.getMonth() < 6;
        return {
          start: new Date(year, isFirstHalf ? 0 : 6, 1),
          end: endOfMonth(new Date(year, isFirstHalf ? 5 : 11, 1))
        };
      }
      case 'year':
        return { start: startOfYear(baseDate), end: endOfYear(baseDate) };
      case 'week':
      default:
        return { start: startOfWeek(baseDate, { weekStartsOn: 1 }), end: endOfWeek(baseDate, { weekStartsOn: 1 }) };
    }
  }, [viewMode, baseDate]);

  const totalDays = differenceInDays(viewRange.end, viewRange.start) + 1;

  // ── Generate Week Columns (for semester & year views) ─────────────
  const weekColumns = useMemo((): WeekColumn[] => {
    if (!isWeeklyView(viewMode)) return [];
    const columns: WeekColumn[] = [];
    let current = startOfWeek(viewRange.start, { weekStartsOn: 1 });
    let weekNum = 1;
    let lastMonth = -1;

    while (current <= viewRange.end) {
      const weekEnd = endOfWeek(current, { weekStartsOn: 1 });
      const clampedStart = current < viewRange.start ? viewRange.start : current;
      const clampedEnd = weekEnd > viewRange.end ? viewRange.end : weekEnd;
      const month = clampedStart.getMonth();
      const showMonth = month !== lastMonth;
      lastMonth = month;

      columns.push({
        label: `W${weekNum}`,
        sublabel: format(clampedStart, 'MMM d'),
        start: clampedStart,
        end: clampedEnd,
        monthLabel: showMonth ? format(clampedStart, 'MMM yyyy') : undefined,
      });
      current = addDays(weekEnd, 1);
      weekNum++;
    }
    return columns;
  }, [viewMode, viewRange]);

  // ── Generate Day Columns (for week & quarter views) ───────────────
  const dateHeaders = useMemo(() => {
    if (isWeeklyView(viewMode)) return [];
    const headers: Date[] = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(viewRange.start);
      d.setDate(d.getDate() + i);
      headers.push(d);
    }
    return headers;
  }, [viewMode, viewRange, totalDays]);

  // Column count (unified for both modes)
  const columnCount = isWeeklyView(viewMode) ? weekColumns.length : dateHeaders.length;
  const colWidth = isWeeklyView(viewMode) ? 60 : 40;

  // ── Filter trainings ──────────────────────────────────────────────
  const displayedTrainings = useMemo(() => {
    return trainings.filter(t => {
      const matchType = selectedType ? t.training_type === selectedType : true;
      const matchSearch = searchTerm ? t.training_name.toLowerCase().includes(searchTerm.toLowerCase()) : true;
      const matchDate = t.start_date || t.end_date ?
        isWithinInterval(new Date(t.start_date), viewRange) || isWithinInterval(new Date(t.end_date), viewRange) ||
        (new Date(t.start_date) <= viewRange.start && new Date(t.end_date) >= viewRange.end)
        : true;
      const matchDept = selectedDept ? t.participants?.some((p: any) => p.employee.department === selectedDept) : true;
      const matchEmp = selectedEmp ? t.participants?.some((p: any) => p.employee.id === selectedEmp) : true;
      return matchType && matchSearch && matchDate && matchDept && matchEmp;
    });
  }, [trainings, selectedType, searchTerm, viewRange, selectedDept, selectedEmp]);

  const changeBaseDate = (amount: number) => {
    const newDate = new Date(baseDate);
    if (viewMode === 'week') newDate.setDate(newDate.getDate() + (7 * amount));
    else if (viewMode === 'quarter') newDate.setMonth(newDate.getMonth() + (3 * amount));
    else if (viewMode === 'semester') newDate.setMonth(newDate.getMonth() + (6 * amount));
    else if (viewMode === 'year') newDate.setFullYear(newDate.getFullYear() + amount);
    setBaseDate(newDate);
  };

  // ── Drag-to-scroll Handlers ───────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - timelineRef.current.offsetLeft);
    setScrollLeft(timelineRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !timelineRef.current) return;
    e.preventDefault();
    const x = e.pageX - timelineRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    timelineRef.current.scrollLeft = scrollLeft - walk;
  };

  // ── Bar position calculation ──────────────────────────────────────
  const getBarPosition = (training: any) => {
    const startDate = new Date(training.start_date);
    const endDate = new Date(training.end_date);
    const barStart = startDate < viewRange.start ? viewRange.start : startDate;
    const barEnd = endDate > viewRange.end ? viewRange.end : endDate;

    if (isWeeklyView(viewMode)) {
      // Find which week columns the bar spans
      let startCol = -1;
      let endCol = -1;
      for (let i = 0; i < weekColumns.length; i++) {
        const wc = weekColumns[i];
        if (startCol === -1 && barStart <= wc.end) startCol = i;
        if (barEnd >= wc.start) endCol = i;
      }
      if (startCol === -1 || endCol === -1 || endCol < startCol) return null;

      // Calculate fractional position within the start/end columns
      const startFrac = Math.max(0, differenceInDays(barStart, weekColumns[startCol].start)) / 7;
      const endFrac = Math.min(1, (differenceInDays(barEnd, weekColumns[endCol].start) + 1) / 7);

      const left = ((startCol + startFrac) / columnCount) * 100;
      const right = ((endCol + endFrac) / columnCount) * 100;
      const width = right - left;
      return width > 0 ? { left: `${left}%`, width: `${width}%` } : null;
    } else {
      const startOffset = differenceInDays(barStart, viewRange.start);
      const duration = differenceInDays(barEnd, barStart) + 1;
      if (duration <= 0) return null;
      return {
        left: `${(startOffset / totalDays) * 100}%`,
        width: `${(duration / totalDays) * 100}%`,
      };
    }
  };

  return (
    <div className="space-y-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Timeline</h1>
          <p className="text-gray-500 text-sm">Track training schedules visually</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {(['week', 'quarter', 'semester', 'year'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors
                  ${viewMode === mode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={fetchTrainings}
            className="p-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            title="Refresh Timeline"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Category Legend — clickable filter */}
      <div className="flex flex-wrap items-center gap-2">
        {TRAINING_CATEGORIES.map(cat => {
          const isActive = selectedType === cat.value;
          const isNone = selectedType === '';
          return (
            <button
              key={cat.value}
              onClick={() => setSelectedType(isActive ? '' : cat.value)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer
                ${isActive
                  ? 'ring-2 ring-offset-1 border-current'
                  : isNone
                    ? 'border-transparent'
                    : 'border-transparent opacity-40'
                }`}
              style={{
                backgroundColor: cat.color + (isActive ? '25' : '15'),
                color: cat.color,
                ...(isActive ? { '--tw-ring-color': cat.color } as React.CSSProperties : {}),
              }}
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></div>
              {cat.label}
            </button>
          );
        })}
        {selectedType && (
          <button
            onClick={() => setSelectedType('')}
            className="text-xs text-gray-500 hover:text-gray-700 underline transition-colors ml-1"
          >
            Clear
          </button>
        )}
        <span className="text-xs text-gray-400 ml-auto">
          {isWeeklyView(viewMode) ? '📅 Weekly grouping' : '📅 Daily view'}
        </span>
      </div>

      {/* Main timeline card */}
      <Card className="bg-white border-gray-200 flex-1 flex flex-col overflow-hidden min-h-[500px]">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-3 px-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Navigation Options */}
            <div className="flex items-center gap-1.5 bg-gray-100/80 p-1.5 rounded-lg border border-gray-200 shadow-inner">
              <button onClick={() => changeBaseDate(-1)} className="p-1.5 hover:bg-white rounded-md text-gray-600 transition-colors shadow-sm bg-transparent">&larr;</button>
              
              <input 
                type="month" 
                className="px-2 py-1.5 text-xs font-semibold rounded-md border border-gray-200 bg-white text-gray-700 shadow-sm cursor-pointer outline-none focus:ring-2 disabled:opacity-50"
                value={format(baseDate, 'yyyy-MM')}
                onChange={(e) => {
                  if (e.target.value) setBaseDate(new Date(e.target.value + '-01'));
                }}
              />
              
              <input 
                type="date" 
                className="px-2 py-1.5 text-xs font-semibold rounded-md border border-gray-200 bg-white text-gray-700 shadow-sm cursor-pointer outline-none focus:ring-2 disabled:opacity-50 hidden sm:block"
                value={format(baseDate, 'yyyy-MM-dd')}
                onChange={(e) => {
                  if (e.target.value) setBaseDate(new Date(e.target.value));
                }}
              />

              <button 
                onClick={() => setBaseDate(new Date())} 
                className="px-3 py-1.5 bg-white hover:bg-gray-50 text-blue-600 font-bold text-xs rounded-md shadow-sm transition-colors border border-gray-200"
              >
                Today
              </button>

              <button onClick={() => changeBaseDate(1)} className="p-1.5 hover:bg-white rounded-md text-gray-600 transition-colors shadow-sm bg-transparent">&rarr;</button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="pl-8 pr-6 py-1.5 border border-gray-200 rounded-md text-xs focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white font-medium text-gray-700 h-8"
                >
                  <option value="">All Categories</option>
                  {TRAINING_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-2.5 py-1.5 border border-gray-200 rounded-md text-xs focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white font-medium text-gray-700 h-8"
              >
                <option value="">All Depts</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select
                value={selectedEmp}
                onChange={(e) => setSelectedEmp(e.target.value)}
                className="px-2.5 py-1.5 border border-gray-200 rounded-md text-xs focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white font-medium text-gray-700 h-8 max-w-[140px] truncate"
              >
                <option value="">All Employees</option>
                {employeesOptions.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-2.5 py-1.5 border border-gray-200 rounded-md text-xs focus:ring-blue-500 focus:border-blue-500 h-8 w-28"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex flex-1 overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-30 backdrop-blur-[1px]">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          )}

          {/* ── Gantt Chart Area ── */}
          <div 
            ref={timelineRef}
            className={`flex-1 overflow-auto flex flex-col w-full ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
          >

            {/* ── Month row (weekly views only) ── */}
            {isWeeklyView(viewMode) && (
              <div className="flex sticky top-0 bg-gray-50 z-20 border-b border-gray-200" style={{ minWidth: `${columnCount * colWidth + 220}px` }}>
                <div className="w-[220px] shrink-0 border-r border-gray-200 sticky left-0 z-30 bg-gray-50" style={{ boxShadow: '4px 0 8px -2px rgba(0,0,0,0.08)' }}></div>
                <div className="flex flex-1">
                  {(() => {
                    // Group weeks by month for the month header row
                    const groups: { label: string; span: number }[] = [];
                    let currentLabel = '';
                    weekColumns.forEach(wc => {
                      const ml = format(wc.start, 'MMMM yyyy');
                      if (ml !== currentLabel) {
                        groups.push({ label: ml, span: 1 });
                        currentLabel = ml;
                      } else {
                        groups[groups.length - 1].span++;
                      }
                    });
                    return groups.map((g, i) => (
                      <div
                        key={i}
                        className="border-r border-gray-200 flex items-center justify-center py-1.5"
                        style={{ width: `${(g.span / columnCount) * 100}%` }}
                      >
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">{g.label}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* ── Column Headers ── */}
            <div
              className={`flex ${isWeeklyView(viewMode) ? 'sticky top-[33px]' : 'sticky top-0'} bg-white z-10 border-b border-gray-200`}
              style={{ minWidth: `${columnCount * colWidth + 220}px` }}
            >
              <div className="w-[220px] shrink-0 border-r border-gray-200 bg-gray-50 flex items-center px-4 py-2.5 font-semibold text-[10px] text-gray-500 uppercase tracking-wider sticky left-0 z-20" style={{ boxShadow: '4px 0 8px -2px rgba(0,0,0,0.08)' }}>
                Training
              </div>
              <div className="flex flex-1">
                {isWeeklyView(viewMode)
                  ? weekColumns.map((wc, i) => (
                    <div
                      key={i}
                      className={`flex-1 border-r border-gray-200 py-2 flex flex-col items-center justify-center ${wc.monthLabel ? 'border-l border-gray-300' : ''}`}
                      style={{ minWidth: `${colWidth}px` }}
                    >
                      <span className="text-[9px] text-gray-400 font-semibold">{wc.label}</span>
                      <span className="text-[9px] text-gray-500 mt-0.5">{wc.sublabel}</span>
                    </div>
                  ))
                  : dateHeaders.map((d, i) => {
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    const isToday = format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                    return (
                      <div
                        key={i}
                        className={`flex-1 border-r border-gray-200 py-2 flex flex-col items-center justify-center
                          ${isWeekend ? 'bg-gray-50/80' : ''}
                          ${isToday ? 'bg-blue-50' : ''}`}
                        style={{ minWidth: `${colWidth}px` }}
                      >
                        <span className="text-[9px] text-gray-400 font-medium uppercase">{format(d, 'eee')}</span>
                        <span className={`text-[11px] font-bold ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>{format(d, 'd')}</span>
                      </div>
                    );
                  })
                }
              </div>
            </div>

            {/* ── Training Rows ── */}
            <div className="flex-1" style={{ minWidth: `${columnCount * colWidth + 220}px` }}>
              {displayedTrainings.length === 0 ? (
                <div className="p-16 text-center text-gray-400 text-sm font-medium">
                  No training activities found in this date range.
                </div>
              ) : (
                displayedTrainings.map((training) => {
                  const pos = getBarPosition(training);
                  if (!pos) return null;

                  const catConfig = getCategoryConfig(training.training_type);
                  const startDate = new Date(training.start_date);
                  const endDate = new Date(training.end_date);

                  return (
                    <div key={training.id} className="flex relative border-b border-gray-100 hover:bg-gray-50/40 transition-colors group" style={{ minHeight: '52px' }}>

                      {/* Left Info Column — clickable */}
                      <div
                        className="w-[220px] shrink-0 border-r border-gray-200 bg-white group-hover:bg-gray-50 px-3 py-2.5 flex flex-col justify-center sticky left-0 z-10 transition-colors cursor-pointer"
                        style={{ boxShadow: '4px 0 8px -2px rgba(0,0,0,0.08)' }}
                        onClick={() => setSelectedTraining(training)}
                      >
                        <div className="font-semibold text-xs text-gray-900 truncate leading-tight hover:text-blue-600 transition-colors" title={training.training_name}>
                          {training.training_name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm truncate max-w-[100px]"
                            style={{
                              backgroundColor: catConfig.color + '18',
                              color: catConfig.color,
                            }}
                          >
                            {training.training_type}
                          </span>
                          <span className="text-[10px] text-gray-400 flex items-center font-medium">
                            <CalendarIcon className="h-2.5 w-2.5 mr-0.5" /> {training.total_jp} JP
                          </span>
                        </div>
                      </div>

                      {/* Timeline Grid */}
                      <div className="flex flex-1 relative">
                        {/* Background grid lines */}
                        {isWeeklyView(viewMode)
                          ? weekColumns.map((wc, i) => (
                            <div key={i} className={`flex-1 border-r border-gray-100 ${wc.monthLabel ? 'border-l border-gray-200' : ''}`} style={{ minWidth: `${colWidth}px` }} />
                          ))
                          : dateHeaders.map((d, i) => (
                            <div key={i} className={`flex-1 border-r border-gray-100 ${(d.getDay() === 0 || d.getDay() === 6) ? 'bg-gray-50/30' : ''}`} style={{ minWidth: `${colWidth}px` }} />
                          ))
                        }

                        {/* ── Training Bar (inline color — never purged) ── */}
                        <div
                          onClick={() => setSelectedTraining(training)}
                          className="absolute h-7 top-1/2 -translate-y-1/2 rounded-lg shadow-sm transition-all flex items-center px-2.5 overflow-hidden cursor-pointer group/bar hover:brightness-110"
                          style={{
                            left: pos.left,
                            width: pos.width,
                            backgroundColor: catConfig.color,
                            borderBottom: `2px solid ${catConfig.color}dd`,
                          }}
                        >
                          <span className="text-white text-[10px] font-semibold truncate drop-shadow-sm">
                            {training.training_name} · {training.total_jp} JP
                          </span>

                          {/* Hover Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/bar:block z-50 pointer-events-none">
                            <div className="bg-gray-900 text-white text-[10px] rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
                              <div className="font-bold text-[11px] mb-1">{training.training_name}</div>
                              <div className="text-gray-300">{format(startDate, 'MMM d, yyyy')} – {format(endDate, 'MMM d, yyyy')}</div>
                              <div className="flex items-center gap-3 mt-1">
                                <span style={{ color: catConfig.color }}>{training.training_type}</span>
                                <span className="text-gray-400">•</span>
                                <span>{training.total_jp} JP</span>
                                <span className="text-gray-400">•</span>
                                <span>{training.participants?.length || 0} peserta</span>
                              </div>
                              {/* Arrow */}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </CardContent>
      </Card>

      {/* ── Training Detail Modal ── */}
      {selectedTraining && (() => {
        const t = selectedTraining;
        const cat = getCategoryConfig(t.training_type);
        const startDate = new Date(t.start_date);
        const endDate = new Date(t.end_date);
        const duration = differenceInDays(endDate, startDate) + 1;
        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedTraining(null)}>
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="p-5 border-b border-gray-100 relative" style={{ borderTop: `4px solid ${cat.color}` }}>
                <button
                  onClick={() => setSelectedTraining(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                <h2 className="text-lg font-bold text-gray-900 pr-8 leading-snug">{t.training_name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: cat.color + '18', color: cat.color }}
                  >
                    {t.training_type}
                  </span>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 px-5 py-4 bg-gray-50/60 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color + '15' }}>
                    <CalendarIcon className="h-4 w-4" style={{ color: cat.color }} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium">Tanggal</p>
                    <p className="text-xs font-semibold text-gray-800">{format(startDate, 'dd MMM')} – {format(endDate, 'dd MMM yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium">Durasi & JP</p>
                    <p className="text-xs font-semibold text-gray-800">{duration} hari · {t.total_jp} JP</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium">Penyelenggara</p>
                    <p className="text-xs font-semibold text-gray-800 truncate">{t.organizer || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium">Lokasi</p>
                    <p className="text-xs font-semibold text-gray-800 truncate">{t.location || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Participants List */}
              <div className="flex-1 overflow-y-auto">
                <div className="px-5 py-3 flex items-center justify-between border-b border-gray-100 sticky top-0 bg-white z-10">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-bold text-gray-800">Peserta</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {t.participants?.length || 0} orang
                  </span>
                </div>

                {t.participants?.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {t.participants.map((p: any, idx: number) => (
                      <div key={p.id || idx} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                        <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: cat.color }}>
                          {p.employee?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-gray-900 truncate">{p.employee?.name || 'Unknown'}</div>
                          <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                            <span>{p.employee?.position || '-'}</span>
                            <span>·</span>
                            <span>{p.employee?.department || '-'}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono shrink-0">{p.employee?.employee_id || ''}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-10 text-center text-gray-400 text-sm">
                    Belum ada peserta terdaftar.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                <button
                  onClick={() => {
                    setSelectedTraining(null);
                    window.location.href = `/edit-training/${t.id}`;
                  }}
                  className="px-5 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-sm font-semibold hover:bg-blue-100 hover:text-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Edit Data & Peserta
                </button>
                <button
                  onClick={() => setSelectedTraining(null)}
                  className="px-5 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Trainings;
