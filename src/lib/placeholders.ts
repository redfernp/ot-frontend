import type { WpCategory, WpPost } from "@/lib/graphql";

export const placeholderCategory: WpCategory = {
  id: "placeholder-category",
  slug: "example",
  uri: "/category/example/",
  name: "Example Category",
  description: "This placeholder will be replaced by staging WordPress category data once WPGraphQL is configured.",
};

export const placeholderPost: WpPost = {
  id: "placeholder-post",
  slug: "example-tip",
  uri: "/tips/example-tip/",
  title: "Example Betting Tip",
  excerpt: "This placeholder will be replaced by a real Paul365 tip post from staging WordPress.",
  date: new Date().toISOString(),
};
