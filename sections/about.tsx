import { business } from '../config/business';
export function About() {
  return (
    <section
      id="about"
      className="about-section wrap"
      aria-labelledby="about-title"
    >
      <div>
        <p className="eyebrow">ТРОХИ ПРО НАС</p>
        <h2 id="about-title">
          СМАКУЄ
          <br />
          <span>ПО-ОДЕСЬКИ.</span>
        </h2>
      </div>
      <div>
        <p>{business.description}</p>
        <p>
          Зайти по шаурму, зібрати обід або вибрати щось на компанію — знайди
          свій варіант у меню.
        </p>
        <a href="#menu" className="text-link">
          Обрати свою страву ↗
        </a>
      </div>
    </section>
  );
}
