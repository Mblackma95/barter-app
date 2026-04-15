export const fixedCategories = [
  { group: "Goods", name: "Clothing & Accessories", slug: "clothing-accessories" },
  { group: "Goods", name: "Home & Furniture", slug: "home-furniture" },
  { group: "Goods", name: "Electronics & Tech", slug: "electronics-tech" },
  { group: "Goods", name: "Books & Media", slug: "books-media" },
  { group: "Goods", name: "Baby & Kids", slug: "baby-kids" },
  { group: "Goods", name: "Sports & Outdoor Gear", slug: "sports-outdoor-gear" },
  { group: "Goods", name: "Beauty & Personal Care", slug: "beauty-personal-care" },
  { group: "Goods", name: "Art & Handmade Goods", slug: "art-handmade-goods" },
  { group: "Goods", name: "Food & Homemade Items", slug: "food-homemade-items" },
  { group: "Services", name: "Creative & Design", slug: "creative-design" },
  { group: "Services", name: "Writing & Editing", slug: "writing-editing" },
  { group: "Services", name: "Marketing & Business Support", slug: "marketing-business-support" },
  { group: "Services", name: "Tech & IT Support", slug: "tech-it-support" },
  { group: "Services", name: "Education & Tutoring", slug: "education-tutoring" },
  { group: "Services", name: "Health & Wellness", slug: "health-wellness" },
  { group: "Services", name: "Spiritual & Energy Work", slug: "spiritual-energy-work" },
  { group: "Services", name: "Home Services & Repairs", slug: "home-services-repairs" },
  { group: "Services", name: "Personal Services", slug: "personal-services" },
  { group: "Community", name: "Events & Workshops", slug: "events-workshops" },
  { group: "Community", name: "Volunteering & Community Help", slug: "volunteering-community-help" },
  { group: "Community", name: "Skill Sharing", slug: "skill-sharing" },
  { group: "Community", name: "Miscellaneous", slug: "miscellaneous" },
] as const;

export type FixedCategoryGroup = (typeof fixedCategories)[number]["group"];
export type FixedCategorySlug = (typeof fixedCategories)[number]["slug"];
