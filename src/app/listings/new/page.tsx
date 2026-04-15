import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { defaultLocalRadiusKm, maxLocalRadiusKm, minLocalRadiusKm } from "@/lib/constants/radius";
import { createListingAction } from "@/lib/listings/actions";
import { listCategories } from "@/lib/listings/queries";
import { ImageUploadField } from "@/components/listings/ImageUploadField";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function NewListingPage() {
  await requireUser();
  const categories = await listCategories();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Create listing</p>
          <h1>Post a barter, digital exchange, or gift.</h1>
        </div>
        <Link href="/browse">Back to browse</Link>
      </header>

      <form action={createListingAction} className={styles.form}>
        <label>
          Mode
          <select name="exchangeMode" required>
            <option value="barter">Barter</option>
            <option value="digital">Digital exchange</option>
            <option value="gift">Gift</option>
          </select>
        </label>
        <label>
          Title
          <input name="title" required minLength={3} maxLength={90} />
        </label>
        <label>
          Description
          <textarea name="description" required minLength={10} rows={5} />
        </label>
        <label>
          Primary category
          <select name="categoryId" required>
            <option value="">Choose a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.group_name}: {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Optional tags
          <input name="tags" placeholder="bike, repair, tutoring" />
        </label>
        <ImageUploadField />
        <label>
          What you want
          <textarea name="wanted" rows={3} placeholder="For gift listings, leave this blank or say free to a good home." />
        </label>
        <div className={styles.twoCol}>
          <label>
            City for local barter/gifts
            <input name="city" placeholder="Simcoe" />
          </label>
          <label>
            Local radius km
            <input
              name="localRadiusKm"
              type="number"
              min={minLocalRadiusKm}
              max={maxLocalRadiusKm}
              defaultValue={defaultLocalRadiusKm}
            />
          </label>
        </div>
        <p className={styles.note}>
          Digital exchanges are automatically treated as remote. Local city and
          radius fields are required for barter and gift listings. Local radius
          can be {minLocalRadiusKm} to {maxLocalRadiusKm} km.
        </p>
        <button type="submit">Publish listing</button>
      </form>
    </main>
  );
}
