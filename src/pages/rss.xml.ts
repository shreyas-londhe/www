import rss from "@astrojs/rss";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const postModules = import.meta.glob<{
    frontmatter: { title: string; description: string; pubDate: string };
  }>("./writing/*.mdx", { eager: true });

  const posts = Object.entries(postModules).map(([path, post]) => ({
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    pubDate: new Date(post.frontmatter.pubDate),
    link: path.replace(".mdx", "").replace("./", "/"),
  }));

  return rss({
    title: "Shreyas Londhe",
    description:
      "Applied cryptography engineer specializing in zero-knowledge proof systems.",
    site: context.site!.toString(),
    items: posts,
  });
}
