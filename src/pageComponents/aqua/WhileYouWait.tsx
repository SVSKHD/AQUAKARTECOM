"use client";

import { useEffect, useId, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ExternalLink,
  Headphones,
  Square,
  X,
} from "lucide-react";
import BlogServiceOperations from "@/services/blog";
import ArrowScroller from "./ArrowScroller";
import {
  canSpeak,
  speak,
  speakingNow,
  stopSpeaking,
  useSpeaking,
} from "./ReplyActions";
import {
  BLOG_URL,
  podcastScript,
  toBlogReads,
  type BlogRead,
} from "./blogReads";

// Only offer reads when the answer is genuinely slow, not on every reply.
const SHOW_AFTER_MS = 3500;
const PARAGRAPHS_INLINE = 4;

const isPlaying = (id: string) => speakingNow() === `blog:${id}`;

// One request per page visit; every slow answer reuses it.
let reads: Promise<BlogRead[]> | null = null;
const loadReads = () =>
  (reads ??= BlogServiceOperations.AllBlogs()
    .then((res: { data: unknown }) => toBlogReads(res.data))
    .catch(() => {
      reads = null; // try again on the next slow answer
      return [];
    }));

// Only the newest reads are in the chat; this leads to the rest. New tab, so
// the conversation stays where it is.
export function MoreReads() {
  return (
    <a
      className="aq-hard-link aq-more-reads"
      href={BLOG_URL}
      target="_blank"
      rel="noopener noreferrer"
    >
      More water reads on the Aquakart blog
      <ExternalLink size={12} aria-hidden="true" />
    </a>
  );
}

// One read as an accordion row. `full` shows the whole article in place (the
// sidebar); otherwise the opening paragraphs and a link to the article.
export function Read({
  read,
  open,
  onToggle,
  onListen,
  full = false,
}: {
  read: BlogRead;
  open: boolean;
  onToggle: () => void;
  onListen?: () => void;
  full?: boolean;
}) {
  const bodyId = useId();
  const podcastId = `blog:${read.id}`;
  const playing = useSpeaking(podcastId);
  const speakable = canSpeak();
  return (
    <div className="aq-read" data-open={open}>
      <button
        type="button"
        className="aq-read-head"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={onToggle}
      >
        {read.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- CMS images on Cloudinary
          <img src={read.image} alt="" className="aq-read-img" loading="lazy" />
        ) : (
          <span className="aq-read-img" aria-hidden="true">
            <BookOpen size={16} />
          </span>
        )}
        <span className="aq-read-title">
          <b>{read.title}</b>
          <span>
            {read.minutes} min read
            {playing ? " · Playing" : ""}
          </span>
        </span>
        <ChevronDown
          size={15}
          aria-hidden="true"
          style={{
            flexShrink: 0,
            transition: "transform .25s",
            transform: open ? "rotate(180deg)" : "none",
          }}
        />
      </button>
      <div id={bodyId} className="aq-read-body" hidden={!open}>
        <p className="aq-read-summary">{read.summary}</p>
        {read.highlights.length > 0 && (
          <ul className="aq-read-points">
            {read.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        )}
        {(full
          ? read.paragraphs
          : read.paragraphs.slice(0, PARAGRAPHS_INLINE)
        ).map((t, i) => (
          <p key={i}>{t}</p>
        ))}
        <div className="aq-read-actions">
          {speakable && (
            <button
              type="button"
              className="aq-btn aq-read-listen"
              aria-pressed={playing}
              onClick={() => {
                if (playing) return stopSpeaking();
                onListen?.();
                speak(podcastId, podcastScript(read));
              }}
            >
              {playing ? (
                <>
                  <Square size={12} fill="currentColor" aria-hidden="true" />
                  Stop podcast
                  <span className="aq-read-eq" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                </>
              ) : (
                <>
                  <Headphones size={15} aria-hidden="true" />
                  Listen as podcast
                </>
              )}
            </button>
          )}
          {/* New tab: the chat and its pending answer stay where they are. */}
          {!full && (
            <a
              className="aq-hard-link aq-read-more"
              href={read.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              Read full article <ExternalLink size={12} aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// Shown under a slow answer: a vertical list of blog posts, each opening to
// read in place or listen to as a podcast. Once the visitor opens or plays one
// it stays after the answer lands, until they close it.
export default function WhileYouWait({ waiting }: { waiting: boolean }) {
  const [due, setDue] = useState(false);
  const [list, setList] = useState<BlogRead[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [engaged, setEngaged] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (!waiting) return;
    const t = setTimeout(() => setDue(true), SHOW_AFTER_MS);
    return () => clearTimeout(t);
  }, [waiting]);

  useEffect(() => {
    if (!due) return;
    let live = true;
    loadReads().then((r) => live && setList(r));
    return () => {
      live = false;
    };
  }, [due]);

  // A podcast from this panel stops when the panel goes (closed, new chat).
  useEffect(
    () => () => {
      if (list.some((r) => isPlaying(r.id))) stopSpeaking();
    },
    [list],
  );

  const visible = !closed && list.length > 0 && ((waiting && due) || engaged);
  if (!visible) return null;

  const close = () => {
    if (list.some((r) => isPlaying(r.id))) stopSpeaking();
    setClosed(true);
  };

  return (
    <section className="aq-card aq-reads" aria-label="Quick reads">
      <div className="aq-reads-head">
        <span className="aq-reads-icon" aria-hidden="true">
          <BookOpen size={15} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <b>{waiting ? "While Aqua thinks" : "Keep reading"}</b>
          <span>Quick reads from the Aquakart blog. Read or listen.</span>
        </span>
        <button
          type="button"
          className="aq-icon-btn"
          aria-label="Close quick reads"
          onClick={close}
        >
          <X size={15} />
        </button>
      </div>
      <ArrowScroller className="aq-reads-list" label="quick reads">
        {list.map((r) => (
          <Read
            key={r.id}
            read={r}
            open={openId === r.id}
            onToggle={() => {
              setEngaged(true);
              setOpenId((o) => (o === r.id ? null : r.id));
            }}
            onListen={() => {
              setEngaged(true);
              setOpenId(r.id);
            }}
          />
        ))}
        <MoreReads />
      </ArrowScroller>
    </section>
  );
}
