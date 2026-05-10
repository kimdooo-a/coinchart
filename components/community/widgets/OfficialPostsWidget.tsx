import Link from "next/link";
import SidebarWidget from "../SidebarWidget";

export interface OfficialPost {
  slug: string;
  title: string;
  date: string; // "2026-05-08"
}

export default function OfficialPostsWidget({ posts }: { posts: OfficialPost[] }) {
  return (
    <SidebarWidget title="공식글" moreHref="/blog">
      <ul className="space-y-2">
        {posts.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/blog/${p.slug}`}
              className="block group"
            >
              <div className="text-body-sm group-hover:text-primary line-clamp-2 transition-colors">
                · {p.title}
              </div>
              <div className="text-meta text-on-surface-variant mt-0.5">{p.date}</div>
            </Link>
          </li>
        ))}
      </ul>
    </SidebarWidget>
  );
}
