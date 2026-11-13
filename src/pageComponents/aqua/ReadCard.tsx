"use client";

import { ArrowRight, BookOpen } from "lucide-react";
import type { BlogRead } from "./blogReads";

// A blog post as a tappable card: thumbnail, title and read time. `rail` is
// the compact size used in the side rail of the blog reader and Aqua's picks.
export default function ReadCard({
  read,
  rail = false,
  onOpen,
}: {
  read: BlogRead;
  rail?: boolean;
  onOpen: (read: BlogRead) => void;
}) {
  return (
    <button
      type="button"
      className={
        rail ? "aq-blogart-read aq-blogart-read--rail" : "aq-blogart-read"
      }
      onClick={() => onOpen(read)}
    >
      <span className="aq-blogart-read-img" aria-hidden="true">
        {read.image ? (
          <img src={read.image} alt="" loading="lazy" />
        ) : (
          <BookOpen size={rail ? 16 : 20} />
        )}
      </span>
      <span className="aq-blogart-read-text">
        <b>{read.title}</b>
        <span>
          {read.minutes} min read
          <ArrowRight size={12} aria-hidden="true" />
        </span>
      </span>
    </button>
  );
}
