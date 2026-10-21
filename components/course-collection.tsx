"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowUpRight,
  Search,
  MapPin,
  Play,
  SlidersHorizontal,
} from "lucide-react";
import { clubhouseCourses, topCourses, type Course } from "@/lib/courses";

export default function CourseCollection() {
  const [collection, setCollection] = useState("Top 20");
  const [query, setQuery] = useState("");
  const [style, setStyle] = useState("All landscapes");
  const [access, setAccess] = useState("All access");
  const entries =
    collection === "Top 20"
      ? topCourses
      : collection === "Clubhouse courses"
        ? clubhouseCourses
        : [...topCourses, ...clubhouseCourses];
  const visible = entries.filter(
    (c) =>
      `${c.name} ${c.location} ${c.country} ${c.designer ?? ""}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()) &&
      (style === "All landscapes" || c.style === style) &&
      (access === "All access" || c.access === access),
  );
  function reset() {
    setQuery("");
    setStyle("All landscapes");
    setAccess("All access");
  }
  return (
    <section className="wide-panel course-collection">
      <div className="collection-intro">
        <div>
          <div className="eyebrow">THE BUNKER SELECTS · GSPRO</div>
          <h1>A world of fairways.</h1>
          <p>
            Twenty courses worth staying in for. A graphics-first collection of
            community favourites, scenic standouts and beautifully detailed
            builds.
          </p>
        </div>
        <div className="collection-count">
          <strong>20</strong>
          <span>COURSES TO DISCOVER</span>
          <small>Curated October 2026</small>
        </div>
      </div>
      <div className="collection-banner">
        <Image
          src="/images/courses/cabot-cliffs.jpg"
          alt="GSPro view of the coast and fairways at Cabot Cliffs, built by Tekbud"
          fill
          sizes="(max-width: 1400px) 92vw, 1300px"
          priority
        />
        <div className="collection-banner-copy">
          <div className="eyebrow gold">GREAT GOLF. EVEN BETTER SCENERY.</div>
          <h2>
            Your next great round
            <br />
            is out there.
          </h2>
          <span>Cabot Cliffs · Tekbud’s updated build</span>
        </div>
        <a
          href="https://tekbud.com/courses/cabot-cliffs"
          target="_blank"
          rel="noreferrer"
          className="collection-banner-credit"
        >
          GSPro preview: Tekbud Designs <ArrowUpRight size={12} />
        </a>
      </div>
      <div className="collection-toolbar">
        <div
          className="collection-switch"
          role="group"
          aria-label="Course collection"
        >
          {["Top 20", "Clubhouse courses", "All courses"].map((option) => (
            <button
              key={option}
              className={collection === option ? "active" : ""}
              aria-pressed={collection === option}
              onClick={() => {
                setCollection(option);
                reset();
              }}
            >
              {option}
            </button>
          ))}
        </div>
        <label className="collection-search">
          <Search size={16} />
          <input
            aria-label="Search courses"
            placeholder="Course, place or designer"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <div className="collection-filters">
        <SlidersHorizontal size={15} />
        <select
          aria-label="Filter by landscape"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
        >
          {[
            "All landscapes",
            "Coastal",
            "Mountain",
            "Desert",
            "Parkland",
            "Links",
            "Tropical",
            "Woodland",
          ].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          aria-label="Filter by course access"
          value={access}
          onChange={(e) => setAccess(e.target.value)}
        >
          {["All access", "Library listing", "Creator-supported"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <span role="status">
          {visible.length} {visible.length === 1 ? "course" : "courses"}
        </span>
      </div>
      <p className="collection-note">
        Our editorial shortlist combines player recommendations and designer
        showcases. Choose the listed build for the intended visuals;
        creator-supported editions may require membership.{" "}
        <a
          href="https://www.reddit.com/r/Golfsimulator/comments/1su2wb8/gs_pro_courses_with_the_best_graphics/"
          target="_blank"
          rel="noreferrer"
        >
          Player recommendations <ArrowUpRight size={11} />
        </a>
      </p>
      <div className="curated-course-grid">
        {visible.map((c) => (
          <CourseCard key={c.id} course={c} />
        ))}
      </div>
      {!visible.length && (
        <div className="empty-state">
          <Search size={25} />
          <h3>No fairways found.</h3>
          <p>Try another course name, landscape or access filter.</p>
          <button className="button outline" onClick={reset}>
            Clear filters
          </button>
        </div>
      )}
      <p className="collection-footnote">
        Selections checked 21 October 2026. Preview credits and listings are
        linked on each card. Currahee uses an official club photograph; other
        original clubhouse images are illustrative. Library listings link to
        access details and do not imply a free download.
      </p>
    </section>
  );
}

function CourseCard({ course: c }: { course: Course }) {
  return (
    <article className="curated-course-card">
      <div className="curated-course-photo">
        <Image
          src={c.image}
          alt={`${c.name} — ${c.imageKind ?? (c.id === "currahee" ? "course photograph" : "illustrative landscape")}`}
          fill
          sizes="(max-width: 700px) 92vw, (max-width: 1100px) 44vw, 30vw"
        />
        {c.pick && (
          <span className="course-pick">
            BUNKER PICK {String(c.pick).padStart(2, "0")}
          </span>
        )}
        <span className="course-image-kind">
          {c.imageKind ??
            (c.id === "currahee" ? "Club photograph" : "Illustrative photo")}
        </span>
      </div>
      <div className="curated-course-body">
        <div className="course-card-eyebrow">
          <span>{c.style ?? c.country}</span>
          <span>{c.par ? `PAR ${c.par}` : "18 HOLES"}</span>
        </div>
        <h3>{c.name}</h3>
        <p className="course-place">
          <MapPin size={12} />
          {c.location}
        </p>
        {c.description && <p className="course-reason">{c.description}</p>}
        {c.designer && (
          <div className="course-build">
            <span title={c.designer}>
              Built by <b>{c.designer}</b>
            </span>
            {c.version && <span>Listed v{c.version}</span>}
          </div>
        )}
        <div className="course-card-actions">
          <a
            className="text-link"
            href={c.gsproSource ?? c.source}
            target="_blank"
            rel="noreferrer"
          >
            Course & access <ArrowUpRight size={14} />
          </a>
          {c.access && (
            <span
              className={`course-access ${c.access === "Creator-supported" ? "premium" : ""}`}
            >
              {c.access}
            </span>
          )}
        </div>
        {c.flyover && (
          <a
            className="course-flyover"
            href={c.flyover}
            target="_blank"
            rel="noreferrer"
          >
            <Play size={12} /> Watch GSPro flyover <ArrowUpRight size={12} />
          </a>
        )}
        <div className="course-provenance">
          <a
            href={c.imageKind === "Flyover preview" ? c.flyover : c.source}
            target="_blank"
            rel="noreferrer"
          >
            Preview: {c.imageCredit ?? "Illustrative landscape"}
          </a>
          {c.selectionSource && (
            <a href={c.selectionSource} target="_blank" rel="noreferrer">
              Why this pick <ArrowUpRight size={11} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
