import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

// Swipeable banner. Each slide is { id, tone, kicker, title, text, cta, to, image }.
export default function HeroCarousel({ slides }) {
  const track = useRef(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setIndex(Number(e.target.dataset.i)); });
    }, { root: el, threshold: 0.6 });
    el.querySelectorAll('.slide').forEach(s => io.observe(s));
    return () => io.disconnect();
  }, [slides.length]);

  const go = i => track.current?.querySelector(`[data-i="${i}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });

  return (
    <section className="carousel" aria-roledescription="carousel" aria-label="عروض تير">
      <div className="carousel-track" ref={track}>
        {slides.map((s, i) => (
          <article key={s.id} className={`slide ${s.tone}`} data-i={i} aria-roledescription="slide" aria-label={`${i + 1} من ${slides.length}`}>
            <div className="slide-text">
              <p className="slide-kicker latin">{s.kicker}</p>
              {i === 0 ? <h1>{s.title}</h1> : <h2>{s.title}</h2>}
              <p className="slide-lede">{s.text}</p>
              <Link to={s.to} className="btn ink">{s.cta}</Link>
            </div>
            <Link to={s.to} className="slide-img" tabIndex={-1} aria-hidden="true">
              {s.image && <img src={s.image} alt="" width="1200" height="900" loading={i ? 'lazy' : 'eager'} />}
            </Link>
          </article>
        ))}
      </div>
      {slides.length > 1 && (
        <div className="dots-nav">
          {slides.map((s, i) => (
            <button key={s.id} type="button" aria-label={`الشريحة ${i + 1}`} aria-current={i === index} onClick={() => go(i)} />
          ))}
        </div>
      )}
    </section>
  );
}
