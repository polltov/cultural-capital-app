import Image from "next/image";
import Link from "next/link";
import { db } from "@/src/db/client";
import { listPublishedTours } from "@/src/db/queries/tours";
import { earliestUpcomingSlotsByTour } from "@/src/db/queries/slots";
import { TourCard } from "@/src/components/public/TourCard";
import { PublicShell } from "@/src/components/public/PublicShell";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const d = db();
  const rows = await listPublishedTours(d);
  const earliest = await earliestUpcomingSlotsByTour(
    d,
    rows.map((r) => r.id),
  );
  const toursWithSlot = rows.map((r) => {
    const s = earliest.get(r.id);
    return {
      ...r,
      earliestSlotAt: s ? s.startsAt.toISOString() : null,
      seatsLeft: s ? s.seatsTotal - s.seatsBooked : null,
    };
  });
  return (
    <PublicShell>
      <Hero />
      <CatalogSection tours={toursWithSlot} />
      <WhyBand />
      <StepsSection />
      <GuidesSection />
      <FaqSection />
    </PublicShell>
  );
}

/* -------------------- Hero -------------------- */
function Hero() {
  return (
    <section
      className="relative z-10 grid gap-9 items-center px-10 pt-12 pb-10 max-md:px-6 max-md:pt-8 max-md:grid-cols-1"
      style={{ gridTemplateColumns: "1.4fr 1fr" }}
    >
      <div>
        <div
          className="cc-reveal cc-delay-1 text-[12px] tracking-[0.3em] uppercase text-terracotta font-bold mb-4.5"
          style={{ fontFamily: "var(--font-sans-ui)" }}
        >
          Санкт-Петербург · экскурсии для семьи
        </div>
        <h1
          className="cc-reveal cc-delay-2 text-[54px] md:text-[62px] leading-[0.98] text-ink tracking-[-0.01em]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
        >
          Петербург, <em className="italic text-terracotta">вдохновляющий</em>
          <br />с первого шага
        </h1>
        <p
          className="cc-reveal cc-delay-3 mt-6 text-[16px] leading-[1.6] max-w-[420px]"
          style={{ color: "var(--cc-slate)" }}
        >
          Авторские маршруты для детей и взрослых. Историки и искусствоведы,
          которые умеют говорить с детьми на одном языке.
        </p>
        <div className="cc-reveal cc-delay-4 mt-7 flex gap-3.5 flex-wrap">
          <Link
            href="#catalog"
            className="bg-ink text-paper py-3.5 px-7 text-[13px] font-bold tracking-[0.06em] rounded-sm"
            style={{ fontFamily: "var(--font-sans-ui)" }}
          >
            Выбрать экскурсию →
          </Link>
          <a
            href="#guides"
            className="py-3.5 px-6 text-[13px] font-bold tracking-[0.06em] rounded-sm text-ink"
            style={{
              fontFamily: "var(--font-sans-ui)",
              border: "1px solid rgba(34,41,58,0.28)",
            }}
          >
            Наши гиды
          </a>
        </div>
      </div>

      <div className="cc-reveal cc-delay-3 relative h-[340px] max-md:h-[300px]">
        <div
          className="cc-hero-img absolute top-0 right-0 w-[76%] rounded-[6px] overflow-hidden shadow-[0_24px_44px_-22px_rgba(34,41,58,0.55)] transition-transform duration-500 ease-out will-change-transform hover:-rotate-[1.2deg] hover:scale-[1.02] hover:z-10"
          style={{ aspectRatio: "3 / 4" }}
        >
          <Image
            src="/mockup/dvortsovaya.jpg"
            alt="Дворцовая набережная"
            fill
            sizes="(max-width: 768px) 60vw, 30vw"
            priority
            className="object-cover"
            style={{
              filter:
                "brightness(0.9) contrast(1.02)",
            }}
          />
          <span
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(80% 100% at 30% 30%, rgba(163,74,47,0.4), transparent 60%)",
            }}
          />
          <span
            className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
            style={{
              background:
                "linear-gradient(0deg, rgba(20,27,33,0.7), transparent)",
            }}
          />
          <span
            className="absolute left-3.5 bottom-3 text-[11px] tracking-[0.14em] uppercase z-10"
            style={{
              color: "rgba(251,246,240,0.96)",
              fontFamily: "var(--font-sans-ui)",
            }}
          >
            Дворцовая
          </span>
        </div>
        <div
          className="cc-hero-img absolute bottom-14 left-0 w-[46%] rounded-[6px] overflow-hidden shadow-[0_18px_36px_-20px_rgba(34,41,58,0.55)] transition-transform duration-500 ease-out will-change-transform hover:rotate-[1.8deg] hover:-translate-y-1 hover:scale-[1.04] hover:z-20"
          style={{ aspectRatio: "4 / 5" }}
        >
          <Image
            src="/mockup/spas.jpg"
            alt="Спас на Крови"
            fill
            sizes="(max-width: 768px) 40vw, 20vw"
            className="object-cover"
          />
          <span
            className="absolute inset-x-0 bottom-0 h-14 pointer-events-none"
            style={{
              background:
                "linear-gradient(0deg, rgba(20,27,33,0.7), transparent)",
            }}
          />
          <span
            className="absolute left-3 bottom-2.5 text-[11px] tracking-[0.14em] uppercase z-10"
            style={{
              color: "rgba(251,246,240,0.96)",
              fontFamily: "var(--font-sans-ui)",
            }}
          >
            Спас на Крови
          </span>
        </div>
      </div>
    </section>
  );
}

/* -------------------- Catalog -------------------- */
function CatalogSection({
  tours,
}: {
  tours: Array<{
    id: string;
    slug: string;
    title: string;
    tag: string;
    route: string;
    priceAdult: number;
    priceChild: number;
    photoUrl: string | null;
    meta: string;
    durationMin: number;
    earliestSlotAt: string | null;
    seatsLeft: number | null;
  }>;
}) {
  return (
    <section id="catalog" className="relative z-10">
      <div className="text-center pt-16 pb-5 px-10 max-md:px-6">
        <div
          className="text-[11px] tracking-[0.28em] uppercase text-terracotta font-bold mb-3"
          style={{ fontFamily: "var(--font-sans-ui)" }}
        >
          каталог
        </div>
        <div
          className="text-[36px] md:text-[42px] leading-none text-ink"
          style={{ fontFamily: "var(--font-antiqua)" }}
        >
          Наши{" "}
          <em
            className="italic text-terracotta"
            style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
          >
            экскурсии
          </em>
        </div>
        <p
          className="text-[15px] mt-4 max-w-[500px] mx-auto leading-[1.55]"
          style={{ color: "var(--cc-slate)" }}
        >
          Каждая прогулка — как маленький спектакль: сюжет, герои и город,
          который открывается заново.
        </p>
      </div>

      {tours.length === 0 ? (
        <p
          className="text-center pb-16 px-10 text-[15px]"
          style={{ color: "var(--cc-slate)" }}
        >
          Пока пусто. Загляните позже.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-10 pt-5 pb-10 max-md:px-6">
          {tours.map((t, i) => (
            <TourCard key={t.id} index={i} {...t} />
          ))}
        </div>
      )}
    </section>
  );
}

/* -------------------- Why band -------------------- */
function WhyBand() {
  const items = [
    {
      icon: <IconGroup />,
      title: "Маленькие группы",
      sub: "не больше восьми человек — чтобы услышать каждого",
    },
    {
      icon: <IconBook />,
      title: "Через игры и истории",
      sub: "материал подаём так, чтобы дети сами хотели слушать дальше",
    },
    {
      icon: <IconCompass />,
      title: "Авторские маршруты",
      sub: "не туристические тропы — свои сюжеты для каждой прогулки",
    },
    {
      icon: <IconWalk />,
      title: "Комфортный темп",
      sub: "паузы, отдых, никаких «скорее-скорее» — гуляем в удовольствие",
    },
    {
      icon: <IconArch />,
      title: "Историки-искусствоведы",
      sub: "профильное образование и любовь к Петербургу — обязательны",
    },
  ];
  return (
    <section
      className="relative z-10 mt-10 py-16 mx-[calc(50%-50vw)] w-screen"
      style={{
        background: "rgba(251,246,240,0.55)",
        borderTop: "1px solid rgba(194,154,91,0.4)",
        borderBottom: "1px solid rgba(194,154,91,0.4)",
      }}
    >
     <div className="max-w-[1000px] mx-auto px-10 max-md:px-6">
      <div className="grid gap-10 md:grid-cols-[1fr_1.35fr] md:gap-14 md:items-start">
        <div className="relative">
          <span
            className="cc-stamp absolute -top-3 -right-1 md:right-4 w-[86px] h-[86px] max-md:hidden"
            aria-hidden
          >
            <span>
              СПб
              <br />
              2026
            </span>
          </span>
          <div
            className="text-[11px] tracking-[0.28em] uppercase text-terracotta font-bold mb-3"
            style={{ fontFamily: "var(--font-sans-ui)" }}
          >
            Про нас коротко
          </div>
          <h2
            className="text-[38px] md:text-[46px] leading-[1.02] text-ink relative"
            style={{ fontFamily: "var(--font-antiqua)" }}
          >
            Пять причин,{" "}
            <em
              className="italic text-terracotta block"
              style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
            >
              почему нас выбирают
            </em>
          </h2>
          <p
            className="mt-5 text-[15px] leading-[1.65] max-w-[320px]"
            style={{
              color: "var(--cc-slate)",
              fontFamily: "var(--font-serif-body)",
            }}
          >
            Мы не про заученные лекции. Про живой Петербург — тот, в который
            хочется возвращаться и приводить своих детей.
          </p>
        </div>
        <ol className="grid">
          {items.map((it, i) => (
            <li
              key={i}
              className="cc-why-row grid grid-cols-[42px_44px_1fr] items-center gap-4 md:gap-5 py-4"
              style={{
                borderTop:
                  i === 0 ? "1px solid rgba(34,41,58,0.14)" : undefined,
                borderBottom: "1px solid rgba(34,41,58,0.14)",
              }}
            >
              <span
                className="cc-why-num text-[11px] tracking-[0.18em] text-terracotta font-bold transition-colors"
                style={{ fontFamily: "var(--font-sans-ui)" }}
              >
                {`№0${i + 1}`}
              </span>
              <span
                className="cc-why-icon flex-none flex items-center justify-center w-11 h-11 rounded-full bg-paper"
                style={{ border: "1px solid rgba(194,154,91,0.55)" }}
              >
                {it.icon}
              </span>
              <div>
                <div
                  className="text-[17px] md:text-[18.5px] leading-[1.2] text-ink"
                  style={{ fontFamily: "var(--font-antiqua)" }}
                >
                  {it.title}
                </div>
                <div
                  className="mt-1 text-[13px] leading-[1.5] max-md:hidden"
                  style={{
                    color: "var(--cc-slate)",
                    fontFamily: "var(--font-serif-body)",
                  }}
                >
                  {it.sub}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
     </div>
    </section>
  );
}

/* -------------------- Steps -------------------- */
function StepsSection() {
  const steps = [
    { n: "01", title: "Покупаете билет", icon: <IconTicket /> },
    { n: "02", title: "Получаете письмо", icon: <IconMail /> },
    { n: "03", title: "Приходите к месту старта", icon: <IconPin /> },
    { n: "04", title: "Гуляете и слушаете", icon: <IconRun /> },
    { n: "05", title: "Получаете фотографии", icon: <IconCamera /> },
    { n: "06", title: "Возвращаетесь снова", icon: <IconHeart /> },
  ];
  return (
    <section className="relative z-10 px-10 pt-20 pb-8 max-md:px-6">
      <div className="text-center mb-14">
        <div
          className="text-[11px] tracking-[0.28em] uppercase text-terracotta font-bold mb-2.5"
          style={{ fontFamily: "var(--font-sans-ui)" }}
        >
          Всё просто
        </div>
        <div
          className="text-[30px] md:text-[36px] leading-none text-ink"
          style={{ fontFamily: "var(--font-antiqua)" }}
        >
          Как проходит{" "}
          <em
            className="italic text-terracotta"
            style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
          >
            экскурсия
          </em>
        </div>
      </div>
      <div className="relative">
        {/* Dashed journey line — desktop only, sits behind the station circles */}
        <div
          className="hidden md:block absolute cc-step-connector pointer-events-none"
          style={{ top: 34, left: "8.3%", right: "8.3%", height: 1.5 }}
          aria-hidden
        />
        <div className="relative grid grid-cols-2 md:grid-cols-6 gap-y-8 md:gap-2">
          {steps.map((s, i) => {
            const last = i === steps.length - 1;
            return (
              <div
                key={i}
                className="cc-step-station text-center relative px-1"
                data-rot={i + 1}
              >
                <div
                  className={
                    "cc-step-circle" +
                    (last ? " cc-step-heart-glow" : "") +
                    " relative z-10 w-[68px] h-[68px] mx-auto mb-4 rounded-full flex items-center justify-center " +
                    (last ? "" : "bg-paper")
                  }
                  style={{
                    border: last
                      ? "1px solid #a34a2f"
                      : "1px solid rgba(194,154,91,0.55)",
                    background: last ? "#f7d9c9" : undefined,
                    boxShadow: "0 6px 14px -10px rgba(34,41,58,0.35)",
                  }}
                >
                  <span
                    className="cc-step-badge absolute -top-2 -right-1.5 min-w-[26px] h-[22px] px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold tracking-[0.08em] transition-colors"
                    style={{
                      background: last ? "var(--cc-terracotta)" : "var(--cc-ink)",
                      color: "var(--cc-paper)",
                      fontFamily: "var(--font-sans-ui)",
                    }}
                  >
                    {s.n}
                  </span>
                  <span className={last ? "cc-step-heart inline-flex" : "inline-flex"}>
                    {s.icon}
                  </span>
                </div>
                <h4
                  className="text-[15px] md:text-[15.5px] leading-[1.22] text-ink italic max-w-[130px] mx-auto"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
                >
                  {s.title}
                </h4>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* -------------------- Guides -------------------- */
function GuidesSection() {
  const guides = [
    {
      photo: "/mockup/pavel.jpg",
      tag: "Историк",
      name: "Павел",
      role: "Опыт 5 лет",
      quote:
        "Мне всегда была интересна сфера науки и преподавания, но особое место для меня занимают экскурсии, которые позволяют по-настоящему влюбиться в город.",
    },
    {
      photo: "/mockup/svetlana.jpg",
      tag: "Педагог-историк",
      name: "Светлана",
      role: "Опыт 7 лет",
      quote:
        "Интерес к истории расширяет познание мира и делает вас и вашего ребёнка разносторонней личностью.",
    },
    {
      photo: "/mockup/darya.jpg",
      tag: "Педагог-историк",
      name: "Дарья",
      role: "Опыт 9 лет",
      quote:
        "Во время прогулки я делюсь историями и предлагаю детям тематические задания. Знакомство с Петербургом превращается в приключение.",
    },
  ];
  return (
    <section id="guides" className="relative z-10 px-10 pt-20 pb-8 max-md:px-6">
      <div className="text-center mb-11">
        <div
          className="text-[11px] tracking-[0.28em] uppercase text-terracotta font-bold mb-2.5"
          style={{ fontFamily: "var(--font-sans-ui)" }}
        >
          кто ведёт экскурсии
        </div>
        <div
          className="text-[30px] md:text-[36px] leading-none text-ink"
          style={{ fontFamily: "var(--font-antiqua)" }}
        >
          Наши{" "}
          <em
            className="italic text-terracotta"
            style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
          >
            экскурсоводы
          </em>
        </div>
        <p
          className="mt-3.5 text-[14px] max-w-[520px] mx-auto leading-[1.55]"
          style={{ color: "var(--cc-slate)" }}
        >
          Историки, искусствоведы и педагоги. Каждый — специалист в своей эпохе
          и умеет рассказывать так, чтобы слушали и взрослые, и дети.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[900px] mx-auto">
        {guides.map((g) => (
          <article
            key={g.name}
            className="bg-paper rounded-lg overflow-hidden shadow-[0_12px_22px_-18px_rgba(34,41,58,0.35)] flex flex-col transition-transform hover:-translate-y-1"
          >
            <div className="relative" style={{ aspectRatio: "4 / 5" }}>
              <Image
                src={g.photo}
                alt={g.name}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
                style={{ objectPosition: "center 20%" }}
              />
              <span
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(0deg, rgba(20,27,33,0.55), transparent 50%)",
                }}
              />
              <span
                className="absolute top-3 left-3 z-10 bg-ivory px-2.5 py-1 rounded-sm text-[9.5px] tracking-[0.22em] uppercase text-ink font-bold"
                style={{ fontFamily: "var(--font-sans-ui)" }}
              >
                {g.tag}
              </span>
            </div>
            <div className="p-5 pt-4.5 flex flex-col flex-1">
              <div
                className="text-[20px] leading-[1.15] text-ink mb-1"
                style={{ fontFamily: "var(--font-antiqua)" }}
              >
                {g.name}
              </div>
              <div
                className="italic text-[12.5px] text-terracotta mb-3.5"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {g.role}
              </div>
              <div
                className="italic text-[14px] leading-[1.55] text-ink flex-1"
                style={{ fontFamily: "var(--font-display)" }}
              >
                «{g.quote}»
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* -------------------- FAQ -------------------- */
function FaqSection() {
  const faqs = [
    {
      q: "С какого возраста подходят экскурсии?",
      a: "У нас есть маршруты для детей от 5 лет, для школьников и для подростков. Формат подачи и продолжительность подбираем под возраст группы — так, чтобы было интересно и не утомительно.",
    },
    {
      q: "Сколько длится экскурсия?",
      a: "Стандартная прогулка — 1,5–2 часа. Музейные маршруты — от 1 часа. Точное время указано в карточке каждой экскурсии; если нужен более длинный или короткий формат — договоримся индивидуально.",
    },
    {
      q: "Что делать, если плохая погода?",
      a: "Дождь или снег — не повод отменять. У нас есть «погодные» варианты: перенос на музейный маршрут или на другой день без потери оплаты. Решаем гибко за пару часов до начала.",
    },
    {
      q: "Проводите индивидуальные экскурсии?",
      a: "Да. Любая экскурсия из каталога может пройти в формате «только ваша семья»: выбираете удобное время, темп и акценты. Стоимость и детали — по запросу через форму или в личном сообщении.",
    },
    {
      q: "Как оплатить и можно ли отменить бронь?",
      a: "После заявки мы согласуем детали и присылаем ссылку на оплату. Отменить или перенести бронь без потерь можно за 24 часа до начала. При отмене позже — возврат 50%.",
    },
  ];
  return (
    <section
      className="relative z-10 mt-5 px-10 pt-16 pb-20 max-md:px-6"
      style={{ borderTop: "1px solid rgba(34,41,58,0.14)" }}
    >
      <div className="text-center mb-10">
        <div
          className="text-[11px] tracking-[0.28em] uppercase text-terracotta font-bold mb-2.5"
          style={{ fontFamily: "var(--font-sans-ui)" }}
        >
          Часто спрашивают
        </div>
        <div
          className="text-[30px] md:text-[36px] leading-none text-ink"
          style={{ fontFamily: "var(--font-antiqua)" }}
        >
          Ответы на{" "}
          <em
            className="italic text-terracotta"
            style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
          >
            популярные вопросы
          </em>
        </div>
      </div>
      <div className="max-w-[760px] mx-auto">
        {faqs.map((f, i) => (
          <details
            key={i}
            className="group"
            style={{
              borderTop: i === 0 ? "1px solid rgba(34,41,58,0.16)" : undefined,
              borderBottom: "1px solid rgba(34,41,58,0.16)",
            }}
          >
            <summary
              className="list-none cursor-pointer py-5 flex items-center justify-between gap-5 text-[18px] md:text-[19px] leading-[1.35] text-ink hover:text-terracotta transition-colors"
              style={{ fontFamily: "var(--font-antiqua)" }}
            >
              {f.q}
              <span
                className="flex-none w-7 h-7 rounded-full flex items-center justify-center text-[18px] text-ink transition-all group-open:rotate-45 group-open:bg-terracotta group-open:text-paper group-open:border-terracotta"
                style={{
                  border: "1px solid rgba(34,41,58,0.35)",
                  fontFamily: "var(--font-sans-ui)",
                }}
              >
                +
              </span>
            </summary>
            <div
              className="px-1 pb-6 text-[15px] leading-[1.65] max-w-[640px]"
              style={{
                color: "var(--cc-slate)",
                fontFamily: "var(--font-sans-ui)",
              }}
            >
              {f.a}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

/* -------------------- Inline SVG icons (from mockup) -------------------- */
const svgCls =
  "w-[34px] h-[34px] stroke-[#5e6b50] fill-none stroke-[1.6] [stroke-linecap:round] [stroke-linejoin:round]";
const stepCls =
  "w-[34px] h-[34px] stroke-[#5e6b50] fill-none stroke-[1.5] [stroke-linecap:round] [stroke-linejoin:round]";
const stepLastCls =
  "w-[34px] h-[34px] stroke-terracotta fill-none stroke-[1.5] [stroke-linecap:round] [stroke-linejoin:round]";

function IconGroup() {
  return (
    <svg viewBox="0 0 48 48" className={svgCls}>
      <circle cx="16" cy="18" r="5" />
      <circle cx="32" cy="18" r="5" />
      <circle cx="24" cy="14" r="4" />
      <path d="M8 38 C8 31 11 27 16 27 M40 38 C40 31 37 27 32 27 M16 40 C16 32 20 28 24 28 C28 28 32 32 32 40" />
    </svg>
  );
}
function IconBook() {
  return (
    <svg viewBox="0 0 48 48" className={svgCls}>
      <path d="M24 12 C20 9 12 9 8 11 V36 C12 34 20 34 24 37 C28 34 36 34 40 36 V11 C36 9 28 9 24 12 Z M24 12 V37" />
    </svg>
  );
}
function IconCompass() {
  return (
    <svg viewBox="0 0 48 48" className={svgCls}>
      <circle cx="24" cy="24" r="15" />
      <path d="M24 24 L30 16 L26 26 L18 32 Z" />
      <path d="M24 9 V12 M24 36 V39 M9 24 H12 M36 24 H39" />
    </svg>
  );
}
function IconWalk() {
  return (
    <svg viewBox="0 0 48 48" className={svgCls}>
      <path d="M12 22 H34 V30 C34 35 30 38 23 38 C16 38 12 35 12 30 Z M34 24 C39 24 41 27 41 30 C41 33 39 35 34 35 M18 14 C16 16 18 18 17 20 M24 12 C22 14 24 16 23 18 M30 14 C28 16 30 18 29 20" />
    </svg>
  );
}
function IconArch() {
  return (
    <svg viewBox="0 0 48 48" className={svgCls}>
      <path d="M8 40 H40 M12 40 V20 M20 40 V20 M28 40 V20 M36 40 V20 M9 20 H39 M9 16 H39 M14 16 L24 8 L34 16" />
    </svg>
  );
}
function IconTicket() {
  return (
    <svg viewBox="0 0 48 48" className={stepCls}>
      <path d="M8 16 H40 V21 A3 3 0 0 0 40 27 V32 H8 V27 A3 3 0 0 0 8 21 Z" />
      <path d="M24 16 V32" strokeDasharray="2 3" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg viewBox="0 0 48 48" className={stepCls}>
      <rect x="8" y="13" width="32" height="22" rx="2" />
      <path d="M8 15 L24 27 L40 15" />
    </svg>
  );
}
function IconPin() {
  return (
    <svg viewBox="0 0 48 48" className={stepCls}>
      <path d="M24 40 C24 40 36 28 36 19 A12 12 0 0 0 12 19 C12 28 24 40 24 40 Z" />
      <circle cx="24" cy="19" r="4.5" />
    </svg>
  );
}
function IconRun() {
  return (
    <svg viewBox="0 0 48 48" className={stepCls}>
      <circle cx="26" cy="10" r="3.4" />
      <path d="M26 14 L23 24 L27 24 L31 34 M23 24 L18 32 M26 18 L33 21 M26 18 L20 20" />
    </svg>
  );
}
function IconCamera() {
  return (
    <svg viewBox="0 0 48 48" className={stepCls}>
      <rect x="7" y="16" width="34" height="22" rx="3" />
      <path d="M17 16 L20 11 H28 L31 16" />
      <circle cx="24" cy="27" r="6" />
    </svg>
  );
}
function IconHeart() {
  return (
    <svg viewBox="0 0 48 48" className={stepLastCls}>
      <path d="M24 38 C10 29 8 20 8 16 C8 11 12 8 16 8 C20 8 23 11 24 14 C25 11 28 8 32 8 C36 8 40 11 40 16 C40 20 38 29 24 38 Z" />
    </svg>
  );
}
