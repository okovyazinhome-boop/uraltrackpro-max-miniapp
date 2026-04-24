import {
  ArrowBigLeftDash,
  Bell,
  CalendarCheck,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileText,
  Fuel,
  History,
  Moon,
  PencilLine,
  ReceiptText,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type ModeId = "drive" | "break" | "rest" | "work" | "ready";
type ViewId = "rto" | "fuel" | "reminders" | "fines" | "profile";
type Theme = "light" | "dark";
type PickerKind = "trip" | "timezone" | "theme";
type TimerTone = "normal" | "warning" | "danger";

type PickerOption = {
  value: string;
  label: string;
  hint?: string;
};

const modes: Array<{ id: ModeId; short: string; title: string; status: string }> = [
  { id: "drive", short: "Вожд.", title: "Вождение", status: "Вождение записано" },
  { id: "break", short: "Перер.", title: "Перерыв", status: "Перерыв записан" },
  { id: "rest", short: "Отдых", title: "Отдых", status: "Отдых записан" },
  { id: "work", short: "Работа", title: "Работа", status: "Работа записана" },
  { id: "ready", short: "Готовн.", title: "Готовность", status: "Готовность записана" },
];

const navItems: Array<{ id: ViewId; label: string; icon: typeof Clock3 }> = [
  { id: "rto", label: "Режим работы", icon: Clock3 },
  { id: "fuel", label: "Топливо и расход", icon: Fuel },
  { id: "reminders", label: "Сроки и уведомления", icon: CalendarCheck },
  { id: "fines", label: "Штрафы и оплата", icon: ReceiptText },
  { id: "profile", label: "Профиль водителя", icon: UserRound },
];

const supportChatUrl = "https://max.ru/u/f9LHodD0cOI05uuXKOEbgubLgi5ulbx6vBSZkvnKFBQr2W7XTI2hCGA83yU";
const consentStorageKey = "uraltrackpro:max-miniapp:pd-consent";
const remainingDriveMinutes = 258;

const tripOptions: PickerOption[] = [
  { value: "Водитель", label: "Водитель", hint: "Один водитель в рейсе" },
  { value: "Экипаж", label: "Экипаж", hint: "Два водителя в одном ТС" },
];

const timeZoneOptions: PickerOption[] = [
  { value: "UTC-12 Линия дат", label: "UTC-12 Линия дат" },
  { value: "UTC-11 Самоа", label: "UTC-11 Самоа" },
  { value: "UTC-10 Гонолулу", label: "UTC-10 Гонолулу" },
  { value: "UTC-9 Аляска", label: "UTC-9 Аляска" },
  { value: "UTC-8 Лос-Анджелес", label: "UTC-8 Лос-Анджелес" },
  { value: "UTC-7 Денвер", label: "UTC-7 Денвер" },
  { value: "UTC-6 Чикаго", label: "UTC-6 Чикаго" },
  { value: "UTC-5 Нью-Йорк", label: "UTC-5 Нью-Йорк" },
  { value: "UTC-4 Каракас", label: "UTC-4 Каракас" },
  { value: "UTC-3 Буэнос-Айрес", label: "UTC-3 Буэнос-Айрес" },
  { value: "UTC-2 Южная Георгия", label: "UTC-2 Южная Георгия" },
  { value: "UTC-1 Азоры", label: "UTC-1 Азоры" },
  { value: "UTC+0 Лондон", label: "UTC+0 Лондон" },
  { value: "UTC+1 Берлин", label: "UTC+1 Берлин" },
  { value: "UTC+2 Калининград", label: "UTC+2 Калининград" },
  { value: "UTC+3 Москва", label: "UTC+3 Москва" },
  { value: "UTC+4 Самара", label: "UTC+4 Самара" },
  { value: "UTC+5 Екатеринбург", label: "UTC+5 Екатеринбург" },
  { value: "UTC+6 Омск", label: "UTC+6 Омск" },
  { value: "UTC+7 Красноярск", label: "UTC+7 Красноярск" },
  { value: "UTC+8 Иркутск", label: "UTC+8 Иркутск" },
  { value: "UTC+9 Якутск", label: "UTC+9 Якутск" },
  { value: "UTC+10 Владивосток", label: "UTC+10 Владивосток" },
  { value: "UTC+11 Магадан", label: "UTC+11 Магадан" },
  { value: "UTC+12 Камчатка", label: "UTC+12 Камчатка" },
];

const themeOptions: Array<PickerOption & { theme: Theme }> = [
  { value: "light", label: "Светлая", theme: "light", hint: "Светлый интерфейс" },
  { value: "dark", label: "Тёмная", theme: "dark", hint: "Для работы в тёмное время" },
];

const historyDays = [
  {
    day: "Сегодня, 24 апреля",
    total: "Итог: вождение 4ч 23м, работа 1ч 10м, отдых 8ч 05м",
    items: [
      { time: "06:40-07:15", label: "Работа", duration: "35м" },
      { time: "07:15-09:52", label: "Вождение", duration: "2ч 37м" },
      { time: "09:52-10:07", label: "Перерыв", duration: "15м" },
      { time: "10:07-11:53", label: "Вождение", duration: "1ч 46м" },
      { time: "11:55", label: "Коррекция", duration: "-10м", note: "Начал раньше" },
    ],
  },
  {
    day: "Вчера, 23 апреля",
    total: "Итог: вождение 7ч 10м, работа 58м, отдых 9ч 22м",
    items: [
      { time: "08:05-10:58", label: "Вождение", duration: "2ч 53м" },
      { time: "10:58-11:43", label: "Работа", duration: "45м" },
      { time: "11:43-15:00", label: "Вождение", duration: "3ч 17м" },
      { time: "15:00-15:30", label: "Перерыв", duration: "30м" },
      { time: "15:30-16:30", label: "Вождение", duration: "1ч" },
      { time: "16:32", label: "Коррекция", duration: "отмена", note: "Отменить последнее" },
    ],
  },
  {
    day: "22 апреля",
    total: "Итог: вождение 5ч 48м, работа 1ч 25м, отдых 10ч 12м",
    items: [
      { time: "07:10-08:00", label: "Работа", duration: "50м" },
      { time: "08:00-10:44", label: "Вождение", duration: "2ч 44м" },
      { time: "10:44-11:14", label: "Перерыв", duration: "30м" },
      { time: "11:14-14:18", label: "Вождение", duration: "3ч 04м" },
      { time: "14:18-14:53", label: "Работа", duration: "35м" },
    ],
  },
];

const fuelOptions = [
  "АИ-92",
  "АИ-95",
  "АИ-95 G-Drive",
  "АИ-98/100",
  "ДТ летнее",
  "ДТ зимнее",
  "ДТ межсезон",
];

function isSupportLive() {
  const hourText = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    hour12: false,
    timeZone: "Asia/Yekaterinburg",
  }).format(new Date());
  const weekDay = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "Asia/Yekaterinburg",
  }).format(new Date());
  const hour = Number(hourText);
  return ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(weekDay) && hour >= 8 && hour < 17;
}

function getTimerTone(minutesLeft: number): TimerTone {
  if (minutesLeft <= 30) return "danger";
  if (minutesLeft <= 60) return "warning";
  return "normal";
}

export function App() {
  const [theme, setTheme] = useState<Theme>("light");
  const [view, setView] = useState<ViewId>("rto");
  const [mode, setMode] = useState<ModeId>("drive");
  const [tripMode, setTripMode] = useState(tripOptions[0].value);
  const [timeZone, setTimeZone] = useState("UTC+5 Екатеринбург");
  const [statusVisible, setStatusVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState<PickerKind | null>(null);
  const [actionDone, setActionDone] = useState<string | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);

  const activeMode = useMemo(() => modes.find((item) => item.id === mode) ?? modes[0], [mode]);
  const timerTone = getTimerTone(remainingDriveMinutes);
  const pageTitle = view === "profile" ? "Профиль водителя" : "Режим труда и отдыха";

  useEffect(() => {
    setConsentAccepted(window.localStorage.getItem(consentStorageKey) === "accepted");
  }, []);

  useEffect(() => {
    if (!statusVisible) return;
    const timer = window.setTimeout(() => setStatusVisible(false), 5000);
    return () => window.clearTimeout(timer);
  }, [statusVisible, mode]);

  function changeMode(nextMode: ModeId) {
    setMode(nextMode);
    setStatusVisible(true);
  }

  function confirmAction(label: string) {
    setActionDone(label);
    window.setTimeout(() => {
      setActionDone(null);
      setCorrectionOpen(false);
    }, 1200);
  }

  function acceptConsent() {
    window.localStorage.setItem(consentStorageKey, "accepted");
    setConsentAccepted(true);
  }

  function declineConsent() {
    window.history.back();
    window.setTimeout(() => window.close(), 180);
  }

  return (
    <div className={`app ${theme}`}>
      <main className="screen" aria-label="УралТрекПро mini-app">
        <Header
          title={pageTitle}
          onHelp={() => setHelpOpen(true)}
          onSettings={() => setSettingsOpen(true)}
        />

        <section className={`content content-${view}`}>
          {view === "profile" ? (
            <ProfileView />
          ) : view === "rto" ? (
            <RtoView
              activeMode={activeMode}
              mode={mode}
              statusVisible={statusVisible}
              timerTone={timerTone}
              onModeChange={changeMode}
              onCorrection={() => setCorrectionOpen(true)}
            />
          ) : (
            <PlaceholderView view={view} />
          )}
        </section>

        <BottomNav active={view} onChange={setView} />
      </main>

      {settingsOpen && (
        <SettingsSheet
          theme={theme}
          tripMode={tripMode}
          timeZone={timeZone}
          onOpenPicker={setPickerOpen}
          onOpenHistory={() => setHistoryOpen(true)}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {helpOpen && (
        <HelpSheet view={view === "profile" ? "profile" : "rto"} onClose={() => setHelpOpen(false)} />
      )}

      {correctionOpen && (
        <CorrectionSheet
          doneLabel={actionDone}
          onAction={confirmAction}
          onClose={() => setCorrectionOpen(false)}
        />
      )}

      {pickerOpen === "trip" && (
        <PickerSheet
          title="Рейс"
          value={tripMode}
          options={tripOptions}
          onSelect={(value) => {
            setTripMode(value);
            setPickerOpen(null);
          }}
          onClose={() => setPickerOpen(null)}
        />
      )}

      {pickerOpen === "timezone" && (
        <PickerSheet
          title="Часовой пояс"
          value={timeZone}
          options={timeZoneOptions}
          onSelect={(value) => {
            setTimeZone(value);
            setPickerOpen(null);
          }}
          onClose={() => setPickerOpen(null)}
        />
      )}

      {pickerOpen === "theme" && (
        <PickerSheet
          title="Тема"
          value={theme}
          options={themeOptions}
          onSelect={(value) => {
            const nextTheme = themeOptions.find((item) => item.value === value)?.theme;
            if (nextTheme) setTheme(nextTheme);
            setPickerOpen(null);
          }}
          onClose={() => setPickerOpen(null)}
        />
      )}

      {historyOpen && <HistorySheet onClose={() => setHistoryOpen(false)} />}

      {!consentAccepted && <ConsentModal onAccept={acceptConsent} onDecline={declineConsent} />}
    </div>
  );
}

function Header({
  title,
  onHelp,
  onSettings,
}: {
  title: string;
  onHelp: () => void;
  onSettings: () => void;
}) {
  return (
    <header className="header">
      <div className="brand-block">
        <div className="brand-line">
          <a href="https://uraltrackpro.store/CONTACTS" target="_blank" rel="noreferrer">
            УралТрекПро
          </a>
          {isSupportLive() && (
            <a className="support-live" href={supportChatUrl} target="_blank" rel="noreferrer">
              <span aria-hidden="true" />
              Мы на связи
            </a>
          )}
        </div>
        <h1>{title}</h1>
      </div>
      <div className="header-actions">
        <IconButton label="Инструкция" onClick={onHelp}>
          <CircleHelp />
        </IconButton>
        <IconButton label="Настройки" onClick={onSettings}>
          <Settings2 />
        </IconButton>
      </div>
    </header>
  );
}

function RtoView({
  activeMode,
  mode,
  statusVisible,
  timerTone,
  onModeChange,
  onCorrection,
}: {
  activeMode: (typeof modes)[number];
  mode: ModeId;
  statusVisible: boolean;
  timerTone: TimerTone;
  onModeChange: (mode: ModeId) => void;
  onCorrection: () => void;
}) {
  return (
    <>
      <article className={`timer-card timer-${timerTone}`}>
        <button className="undo-button" type="button" aria-label="Коррекция записи" onClick={onCorrection}>
          <RotateCcw />
        </button>

        <div className={`mode-status ${statusVisible ? "visible" : ""}`} aria-live="polite">
          <span />
          {activeMode.status}
        </div>

        <div className="ring-wrap">
          <svg className="ring" viewBox="0 0 220 220" role="img" aria-label="Осталось 4 часа 18 минут">
            <circle className="ring-track" cx="110" cy="110" r="82" />
            <circle className="ring-progress" cx="110" cy="110" r="82" pathLength="100" />
          </svg>
          <div className="ring-copy">
            <span>Сейчас</span>
            <strong>{activeMode.title}</strong>
            <b>4ч 18м</b>
            <small>до остановки</small>
          </div>
        </div>

        <div className="stats-grid">
          <Stat label="Остановка до" value="18:22" />
          <Stat label="Сегодня" value="4ч 23м / 9ч" />
          <Stat label="Неделя" value="5ч 42м / 56ч" />
          <Stat label="2 недели" value="5ч 42м / 90ч" />
        </div>
      </article>

      <div className="segmented" role="group" aria-label="Режим РТО">
        {modes.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === mode ? "active" : ""}
            onClick={() => onModeChange(item.id)}
            aria-pressed={item.id === mode}
          >
            {item.short}
          </button>
        ))}
      </div>
    </>
  );
}

function ProfileView() {
  const [driverName, setDriverName] = useState("Иванов Иван");
  const initials = getInitials(driverName);

  return (
    <article className="profile-card">
      <label className="driver-row">
        <span className="avatar avatar-initials">{initials}</span>
        <span className="driver-name-field">
          <small>Фамилия и Имя</small>
          <EditableInput
            ariaLabel="Фамилия и Имя"
            initialValue="Иванов Иван"
            value={driverName}
            onValueChange={setDriverName}
          />
        </span>
      </label>

      <div className="plate" aria-label="Госномер">
        <span className="plate-dot">•</span>
        <EditableInput className="plate-input" ariaLabel="Госномер" initialValue="А123ВС" />
        <span className="plate-region">
          <b>196</b>
          <small>RUS</small>
          <i />
        </span>
      </div>

      <div className="vehicle-grid">
        <Field label="Марка" defaultValue="КАМАЗ" muted />
        <Field label="Модель" defaultValue="5490" muted />
        <SelectField label="Тип ТС" options={["грузовой", "легковой", "спецтехника"]} />
        <SelectField label="Топливо" options={fuelOptions} />
        <Field label="Расход на 100 км" defaultValue="28 л" muted />
        <StsField />
      </div>
    </article>
  );
}

function PlaceholderView({ view }: { view: ViewId }) {
  const item = navItems.find((nav) => nav.id === view);
  return (
    <article className="placeholder">
      <Bell />
      <h2>{item?.label}</h2>
      <p>Раздел готов к подключению данных. Сейчас активен основной экран РТО и профиль водителя.</p>
    </article>
  );
}

function SettingsSheet({
  theme,
  tripMode,
  timeZone,
  onOpenPicker,
  onOpenHistory,
  onClose,
}: {
  theme: Theme;
  tripMode: string;
  timeZone: string;
  onOpenPicker: (picker: PickerKind) => void;
  onOpenHistory: () => void;
  onClose: () => void;
}) {
  const themeLabel = theme === "light" ? "Светлая" : "Тёмная";

  return (
    <Sheet onClose={onClose}>
      <h2>Настройки</h2>
      <div className="sheet-list">
        <SheetActionRow
          icon={Truck}
          label="Рейс"
          value={tripMode}
          onClick={() => onOpenPicker("trip")}
        />
        <SheetActionRow
          icon={Clock3}
          label="Часовой пояс"
          value={timeZone}
          onClick={() => onOpenPicker("timezone")}
        />
        <SheetActionRow
          icon={Moon}
          label="Тема"
          value={themeLabel}
          onClick={() => onOpenPicker("theme")}
        />
        <SheetActionRow
          icon={History}
          label="История"
          value="Открыть"
          onClick={onOpenHistory}
        />
        <a className="sheet-row" href="https://uraltrackpro.ru/wp-content/uploads/2026/04/pamyatka-rto.pdf" target="_blank" rel="noreferrer">
          <FileText />
          <span className="sheet-row-copy">
            <b>Памятка РТО</b>
            <small>PDF</small>
          </span>
          <ChevronDown />
        </a>
      </div>
    </Sheet>
  );
}

function HelpSheet({ view, onClose }: { view: "rto" | "profile"; onClose: () => void }) {
  return (
    <Sheet onClose={onClose}>
      <h2>{view === "profile" ? "Профиль водителя" : "Инструкция по РТО"}</h2>
      {view === "profile" ? (
        <div className="help-copy">
          <p><b>Фамилия и Имя.</b> Укажите фамилию и имя водителя так, как они указаны в документах.</p>
          <p><b>Госномер.</b> Введите номер без пробелов: буква, три цифры, две буквы. Код региона указывается справа на табличке.</p>
          <p><b>Марка и модель.</b> Заполните данные автомобиля, например КАМАЗ и 5490.</p>
          <p><b>Тип ТС.</b> Выберите подходящий тип: грузовой, легковой или спецтехника.</p>
          <p><b>Топливо.</b> Выберите фактический тип топлива, чтобы расход и история были понятны.</p>
          <p><b>Расход на 100 км.</b> Укажите средний расход в литрах. Это поле можно менять при смене условий эксплуатации.</p>
          <p><b>СТС.</b> Введите серию и номер свидетельства в формате: 2 цифры, пробел, 2 буквы, пробел, 6 цифр. Пример: 66 АА 123456.</p>
        </div>
      ) : (
        <div className="help-copy">
          <p><b>Вожд.</b> — нажимай при начале движения.</p>
          <p><b>Перер.</b> — короткая пауза без полноценного отдыха.</p>
          <p><b>Отдых</b> — ежедневный или недельный отдых.</p>
          <p><b>Работа</b> — погрузка, документы, ожидание на базе.</p>
          <p><b>Готовн.</b> — водитель готов ехать, но не управляет ТС.</p>
          <p>Уведомления придут перед окончанием допустимого времени вождения, при риске превышения дневной/недельной нормы и при необходимости отдыха.</p>
        </div>
      )}
    </Sheet>
  );
}

function CorrectionSheet({
  doneLabel,
  onAction,
  onClose,
}: {
  doneLabel: string | null;
  onAction: (label: string) => void;
  onClose: () => void;
}) {
  const [minutes, setMinutes] = useState("5");

  return (
    <Sheet onClose={onClose}>
      <h2>Коррекция записи</h2>
      <p className="sheet-note">Укажи интервал, если режим был включён позже фактического начала. Например, если водитель начал движение или работу на несколько минут раньше, чем отметил это в приложении.</p>
      <label className="correction-control-row custom-minutes correction-interval-row">
        <span>Свой интервал</span>
        <span className="custom-minutes-control">
          <b>-</b>
          <input
            inputMode="numeric"
            value={minutes}
            onChange={(event) => {
              setMinutes(event.target.value.replace(/\D/g, ""));
            }}
            aria-label="Свой интервал в минутах"
          />
          <small>мин</small>
        </span>
      </label>
      <p className="sheet-note sheet-note-secondary">Кнопку «Отменить последнее» используй, если последний установленный статус был нажат ошибочно и его нужно сразу убрать из учёта.</p>
      <div className="sheet-buttons">
        <button className="action-button" type="button" onClick={() => onAction("Начал раньше")}>
          {doneLabel === "Начал раньше" ? <Check /> : <PencilLine />}
          Применить интервал
        </button>
        <button className="action-button" type="button" onClick={() => onAction("Отменить последнее")}>
          {doneLabel === "Отменить последнее" ? <Check /> : <ArrowBigLeftDash />}
          Отменить последнее
        </button>
      </div>
    </Sheet>
  );
}

function Sheet({
  children,
  onClose,
  className,
}: {
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <section className={`sheet ${className ?? ""}`.trim()} role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="grabber" />
        <button className="close-button" type="button" aria-label="Закрыть" onClick={onClose}>
          <X />
        </button>
        {children}
      </section>
    </div>
  );
}

function BottomNav({ active, onChange }: { active: ViewId; onChange: (view: ViewId) => void }) {
  return (
    <nav className="bottom-nav" aria-label="Основное меню">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <button key={item.id} type="button" className={active === item.id ? "active" : ""} onClick={() => onChange(item.id)}>
            <Icon />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button className="icon-button" type="button" aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Field({
  label,
  defaultValue,
  muted = false,
  inputMode,
  pattern,
}: {
  label: string;
  defaultValue: string;
  muted?: boolean;
  inputMode?: "text" | "numeric" | "decimal";
  pattern?: string;
}) {
  return (
    <label className={`field ${muted ? "field-muted" : ""}`}>
      <small>{label}</small>
      <EditableInput ariaLabel={label} initialValue={defaultValue} inputMode={inputMode} pattern={pattern} />
    </label>
  );
}

function getInitials(value: string) {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "ИИ";
}

function EditableInput({
  ariaLabel,
  initialValue,
  className,
  inputMode,
  pattern,
  format,
  value: externalValue,
  onValueChange,
}: {
  ariaLabel: string;
  initialValue: string;
  className?: string;
  inputMode?: "text" | "numeric" | "decimal";
  pattern?: string;
  format?: (value: string) => string;
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  const [internalValue, setInternalValue] = useState(initialValue);
  const [edited, setEdited] = useState(false);
  const [dirty, setDirty] = useState(false);
  const value = externalValue ?? internalValue;

  function updateValue(nextValue: string) {
    if (onValueChange) {
      onValueChange(nextValue);
      return;
    }

    setInternalValue(nextValue);
  }

  return (
    <input
      className={`${className ?? ""} ${edited ? "is-edited" : ""}`.trim()}
      aria-label={ariaLabel}
      inputMode={inputMode}
      pattern={pattern}
      value={value}
      onFocus={() => {
        if (!edited) {
          updateValue("");
          setEdited(true);
        }
      }}
      onBlur={() => {
        if (edited && !dirty && value.trim() === "") {
          updateValue(initialValue);
          setEdited(false);
        }
      }}
      onChange={(event) => {
        setDirty(true);
        updateValue(format ? format(event.target.value) : event.target.value);
      }}
    />
  );
}

function formatStsValue(value: string) {
  const normalized = value.toUpperCase().replace(/[^0-9A-ZА-Я]/g, "").slice(0, 10);
  return [normalized.slice(0, 2), normalized.slice(2, 4), normalized.slice(4, 10)].filter(Boolean).join(" ");
}

function StsField() {
  return (
    <label className="field field-muted">
      <small>СТС</small>
      <EditableInput
        ariaLabel="СТС"
        initialValue="66 АА 123456"
        inputMode="text"
        pattern="[0-9]{2}\\s[А-ЯA-Z0-9]{2}\\s[0-9]{6}"
        format={formatStsValue}
      />
    </label>
  );
}

function SelectField({
  label,
  options,
}: {
  label: string;
  options: string[];
}) {
  const [value, setValue] = useState("");

  return (
    <label className={`field select-field ${value ? "select-field-selected" : ""}`}>
      <small>{label}</small>
      <select value={value} aria-label={label} onChange={(event) => setValue(event.target.value)}>
        <option value="" disabled />
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <span className="select-display" aria-hidden="true">{value}</span>
      <ChevronDown />
    </label>
  );
}

function SheetActionRow({
  icon: Icon,
  label,
  value,
  onClick,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button className="sheet-row" type="button" onClick={onClick}>
      <Icon />
      <span className="sheet-row-copy">
        <b>{label}</b>
        <small>{value}</small>
      </span>
      <ChevronDown />
    </button>
  );
}

function PickerSheet({
  title,
  value,
  options,
  onSelect,
  onClose,
}: {
  title: string;
  value: string;
  options: PickerOption[];
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  const selectedRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "center", behavior: "auto" });
  }, [value]);

  return (
    <Sheet onClose={onClose} className="picker-sheet">
      <h2>{title}</h2>
      <div className="picker-list" role="listbox" aria-label={title}>
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <button
              key={option.value}
              ref={isSelected ? selectedRef : null}
              className={`picker-option ${isSelected ? "selected" : ""}`}
              type="button"
              onClick={() => onSelect(option.value)}
              role="option"
              aria-selected={isSelected}
            >
              <span className="picker-option-copy">
                <b>{option.label}</b>
                {option.hint ? <small>{option.hint}</small> : null}
              </span>
              {isSelected ? <Check /> : null}
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

function HistorySheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet onClose={onClose}>
      <h2>История статусов</h2>
      <p className="sheet-note">Показываем все режимы, длительность каждого статуса и внесённые корректировки по дням.</p>
      <div className="history-list">
        {historyDays.map((day) => (
          <section key={day.day} className="history-day">
            <header>
              <strong>{day.day}</strong>
              <span>{day.total}</span>
            </header>
            <div className="history-items">
              {day.items.map((item) => (
                <div key={`${day.day}-${item.time}-${item.label}`} className={`history-item ${item.label === "Коррекция" ? "history-item-correction" : ""}`}>
                  <span>{item.time}</span>
                  <b>{item.label}</b>
                  <strong>{item.duration}</strong>
                  {item.note ? <small>{item.note}</small> : <small> </small>}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Sheet>
  );
}

function ConsentModal({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) {
  return (
    <div className="consent-backdrop" role="presentation">
      <section className="consent-modal" role="dialog" aria-modal="true" aria-labelledby="consent-title">
        <button className="consent-close" type="button" aria-label="Закрыть mini-app" onClick={onDecline}>
          <X />
        </button>
        <div className="consent-badge">
          <ShieldCheck />
        </div>
        <h2 id="consent-title">Согласие на обработку персональных данных</h2>
        <p>Для продолжения работы подтвердите согласие на обработку персональных данных.</p>

        <div className="consent-links">
          <a href="https://uraltrackpro.store/position" target="_blank" rel="noreferrer">
            <FileText />
            Положение
          </a>
          <a href="https://uraltrackpro.store/agreement" target="_blank" rel="noreferrer">
            <FileText />
            Согласие
          </a>
          <a href="https://uraltrackpro.ru/wp-content/uploads/2026/04/rekvizity-ip-kovyazin.pdf" target="_blank" rel="noreferrer">
            <FileText />
            Реквизиты
          </a>
        </div>

        <button className="consent-button" type="button" onClick={onAccept}>
          <Check />
          Согласен и продолжаю
        </button>
      </section>
    </div>
  );
}
