import React from "react";
import { CalendarDays, TicketCheck, UtensilsCrossed } from "lucide-react";
const details = [
  { icon: CalendarDays, title: "برای همان روز", text: "بلیت تا پایان روز کاری خرید معتبر است و امکان پیش‌خرید برای روزهای بعد وجود ندارد." },
  { icon: TicketCheck, title: "ورود با کد بلیت", text: "بعد از پرداخت، کد هر بلیت را به مسئول پذیرش نشان دهید. هر کد یک‌بار قابل استفاده است." },
  { icon: UtensilsCrossed, title: "فقط ورودی سالن", text: "بلیت شامل رزرو میز یا هزینه غذا و نوشیدنی نمی‌شود." },
];
export function LoungeExperience() { return <section id="about-lounge" className="details-section"><div className="wrap"><div className="section-heading"><div><p className="section-kicker">خوب است بدانید</p><h2>پیش از خرید بلیت</h2></div><p>چند نکته کوتاه برای اینکه با خیال راحت برنامه‌ریزی کنید.</p></div><div className="details-grid">{details.map(({icon: Icon,title,text},i) => <article className="detail-item" key={title}><span className={`detail-icon detail-icon-${i}`}><Icon size={22}/></span><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>; }
