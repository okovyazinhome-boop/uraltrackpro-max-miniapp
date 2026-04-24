import {
  Bell,
  CalendarCheck,
  Car,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Download,
  FileText,
  Fuel,
  Moon,
  ReceiptText,
  RotateCcw,
  Settings2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

type ModeId = "drive" | "break" | "rest" | "work" | "ready";
type ViewId = "rto" | "fuel" | "reminders" | "fines" | "profile";
type Theme = "light" | "dark";

const modes: Array<{ id: ModeId; short: string; title: string; status: string }> = [
  { id: "drive", short: "Вожд.", title: "Вождение", status: "Вождение записано" },
  { id: "break", short: "Перер.", title: "Перерыв", status: "Перерыв записан" },
  { id: "rest", short: "Отдых", title: "Отдых", status: "Отдых записан" },
  { id: "work", short: "Работа", title: "Работа", status: "Работа записана" },
  { id: "ready", short: "Готовн.", title: "Готовность", status: "Готовность записана" },
];

const navItems: Array<{ id: ViewId; label: string; icon: typeof Clock3 }> = [
  { id: "rto", label: "Режим труда и отдыха", icon: Clock3 },
  { id: "fuel", label: "Топливо и расход", icon: Fuel },
  { id: "reminders", label: "Сроки и уведомления", icon: CalendarCheck },
  { id: "fines", label: "Штрафы и оплата", icon: ReceiptText },
  { id: "profile", label: "Профиль водителя", icon: UserRound },
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
  const hour = Number(hourText);
  return hour >= 8 && hour < 17;
}

export function App() {
  const [theme, setTheme] = useState<Theme>("light");
  const [view, setView] = useState<ViewId>("rto");
  const [mode, setMode] = useState<ModeId>("drive");
  const [statusVisible, setStatusVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [actionDone, setActionDone] = useState<string | null>(null);

  const activeMode = useMemo(() => modes.find((item) => item.id === mode) ?? modes[0], [mode]);
  const pageTitle = view === "profile" ? "Профиль водителя" : "Режим труда и отдыха";

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

  return (
    <div className={`app ${theme}`}>
      <main className="screen" aria-label="УралТрекПро mini-app">
        <Header
          title={pageTitle}
          onHelp={() => setHelpOpen(true)}
          onSettings={() => setSettingsOpen(true)}
        />

        <section className="content">
          {view === "profile" ? (
            <ProfileView />
          ) : view === "rto" ? (
            <RtoView
              activeMode={activeMode}
              mode={mode}
              statusVisible={statusVisible}
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
        <SettingsSheet theme={theme} onTheme={setTheme} onClose={() => setSettingsOpen(false)} />
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
          {isSupportLive() && <span className="support-live">Мы на связи</span>}
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
  onModeChange,
  onCorrection,
}: {
  activeMode: (typeof modes)[number];
  mode: ModeId;
  statusVisible: boolean;
  onModeChange: (mode: ModeId) => void;
  onCorrection: () => void;
}) {
  return (
    <>
      <article className="timer-card">
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
          <Stat label="Стоп" value="18:22" />
          <Stat label="Сегодня" value="4ч23м/9ч" />
          <Stat label="Неделя" value="5ч42м/56ч" />
          <Stat label="2 недели" value="5ч42м/90ч" />
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
  return (
    <article className="profile-card">
      <label className="driver-row">
        <span className="avatar">
          <UserRound />
        </span>
        <span>
          <small>ФИО</small>
          <input aria-label="ФИО" defaultValue="Иванов Сергей" />
        </span>
      </label>

      <div className="plate" aria-label="Госномер">
        <span className="plate-dot">•</span>
        <input defaultValue="А123ВС" aria-label="Госномер" />
        <span className="plate-region">
          <b>196</b>
          <small>RUS</small>
          <i />
        </span>
      </div>

      <div className="vehicle-grid">
        <Field label="Марка" defaultValue="КАМАЗ" />
        <Field label="Модель" defaultValue="5490" />
        <SelectField label="Тип ТС" defaultValue="грузовой" options={["грузовой", "легковой", "спецтехника"]} />
        <SelectField label="Топливо" defaultValue="ДТ летнее" options={fuelOptions} />
        <Field label="Расход на 100 км" defaultValue="28 л" />
        <Field label="СТС" defaultValue="66 00 123456" />
      </div>

      <button className="primary-button" type="button">Сменить авто</button>
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
  onTheme,
  onClose,
}: {
  theme: Theme;
  onTheme: (theme: Theme) => void;
  onClose: () => void;
}) {
  return (
    <Sheet onClose={onClose}>
      <h2>Настройки</h2>
      <div className="sheet-list">
        <SheetSelect icon={UsersRound} label="Рейс" defaultValue="Водитель" options={["Водитель", "Экипаж"]} />
        <SheetSelect
          icon={Clock3}
          label="Часовой пояс"
          defaultValue="UTC+5 Екатеринбург"
          options={[
            "UTC+2 Калининград",
            "UTC+3 Москва",
            "UTC+4 Самара",
            "UTC+5 Екатеринбург",
            "UTC+6 Омск",
            "UTC+7 Красноярск",
            "UTC+8 Иркутск",
            "UTC+9 Якутск",
            "UTC+10 Владивосток",
            "UTC+11 Магадан",
            "UTC+12 Камчатка",
          ]}
        />
        <label className="sheet-row">
          <Moon />
          <span>Тема</span>
          <select value={theme} onChange={(event) => onTheme(event.target.value as Theme)}>
            <option value="light">Светлая</option>
            <option value="dark">Тёмная</option>
          </select>
          <ChevronDown />
        </label>
        <button className="sheet-row" type="button">
          <Download />
          <span>Экспорт</span>
          <b>xls</b>
        </button>
        <a className="sheet-row" href="https://uraltrackpro.ru/wp-content/uploads/2026/04/pamyatka-rto.pdf" target="_blank" rel="noreferrer">
          <FileText />
          <span>Памятка РТО</span>
          <b>PDF</b>
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
          <p>Заполни ФИО, госномер, марку, модель, тип ТС, топливо, расход и СТС. Поля редактируются нажатием.</p>
          <p>Кнопка «Сменить авто» нужна для быстрого перехода на другое транспортное средство.</p>
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
  const [minutes, setMinutes] = useState("20");
  const [preset, setPreset] = useState("-5 мин");

  return (
    <Sheet onClose={onClose}>
      <h2>Коррекция записи</h2>
      <p className="sheet-note">Используй, если режим был включён позже фактического начала или нужно отменить последнюю запись.</p>
      <label className="sheet-row">
        <Clock3 />
        <span>Начал раньше</span>
        <select value={preset} onChange={(event) => setPreset(event.target.value)}>
          <option>-5 мин</option>
          <option>-10 мин</option>
          <option>-15 мин</option>
          <option>указать время</option>
        </select>
        <ChevronDown />
      </label>
      <label className="custom-minutes">
        <span>Свой интервал</span>
        <b>-</b>
        <input
          inputMode="numeric"
          value={minutes}
          onChange={(event) => {
            setMinutes(event.target.value.replace(/\D/g, ""));
            setPreset("указать время");
          }}
          aria-label="Свой интервал в минутах"
        />
        <small>мин</small>
      </label>
      <div className="sheet-buttons">
        <button className="primary-button" type="button" onClick={() => onAction("Начал раньше")}>
          {doneLabel === "Начал раньше" ? <Check /> : null}
          Начал раньше
        </button>
        <button className="danger-button" type="button" onClick={() => onAction("Отменить последнее")}>
          {doneLabel === "Отменить последнее" ? <Check /> : null}
          Отменить последнее
        </button>
      </div>
    </Sheet>
  );
}

function Sheet({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="sheet" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
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

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <label className="field">
      <small>{label}</small>
      <input defaultValue={defaultValue} aria-label={label} />
    </label>
  );
}

function SelectField({ label, defaultValue, options }: { label: string; defaultValue: string; options: string[] }) {
  return (
    <label className="field select-field">
      <small>{label}</small>
      <select defaultValue={defaultValue} aria-label={label}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <ChevronDown />
    </label>
  );
}

function SheetSelect({
  icon: Icon,
  label,
  defaultValue,
  options,
}: {
  icon: typeof Clock3;
  label: string;
  defaultValue: string;
  options: string[];
}) {
  return (
    <label className="sheet-row">
      <Icon />
      <span>{label}</span>
      <select defaultValue={defaultValue}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <ChevronDown />
    </label>
  );
}
