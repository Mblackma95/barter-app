"use client";

import { useState } from "react";
import { ProfilePhotoField } from "@/components/profiles/ProfilePhotoField";
import { updateProfileAction } from "@/lib/profiles/actions";
import type { ProfileRow } from "@/lib/profiles/queries";
import type { CategoryRow } from "@/lib/listings/queries";
import styles from "./ProfileSetupForm.module.css";

const steps = ["Identity", "Interests", "Looking For", "Preferences"];

export function ProfileSetupForm({
  profile,
  categories,
}: {
  profile: ProfileRow | null;
  categories: CategoryRow[];
}) {
  const [step, setStep] = useState(0);

  return (
    <form action={updateProfileAction} className={styles.form}>
      <input type="hidden" name="existingAvatarUrl" value={profile?.avatar_url ?? ""} />

      <ol className={styles.steps} aria-label="Profile setup steps">
        {steps.map((label, index) => (
          <li key={label} className={index === step ? styles.activeStep : ""}>
            <button type="button" onClick={() => setStep(index)}>
              {index + 1}. {label}
            </button>
          </li>
        ))}
      </ol>

      <fieldset className={styles.panel} hidden={step !== 0}>
        <legend>Basic Identity</legend>
        <ProfilePhotoField existingAvatarUrl={profile?.avatar_url} />
        <label>
          Display name
          <input name="displayName" defaultValue={profile?.display_name ?? ""} required />
        </label>
        <label>
          Username
          <input name="username" defaultValue={profile?.username ?? ""} minLength={3} />
        </label>
        <label>
          City/town
          <input name="city" defaultValue={profile?.city ?? ""} required />
        </label>
        <label>
          Short bio
          <textarea
            name="bio"
            rows={4}
            defaultValue={profile?.bio ?? ""}
            placeholder="A quick 1-3 sentence intro for nearby traders."
          />
        </label>
      </fieldset>

      <fieldset className={styles.panel} hidden={step !== 1}>
        <legend>Interests & Skills</legend>
        <p>Separate tags with commas. Tags are saved lowercase and deduplicated.</p>
        <label>
          Interests
          <input name="interests" defaultValue={profile?.interests.join(", ") ?? ""} placeholder="gardening, books" />
        </label>
        <label>
          Skills
          <input name="skills" defaultValue={profile?.skills.join(", ") ?? ""} placeholder="repairs, design" />
        </label>
      </fieldset>

      <fieldset className={styles.panel} hidden={step !== 2}>
        <legend>What I&apos;m Looking For</legend>
        <p>Add what would make barter useful right now.</p>
        <label>
          Current wants
          <input
            name="currentWants"
            defaultValue={profile?.current_wants.join(", ") ?? ""}
            placeholder="kids clothes, craft supplies"
          />
        </label>
        <label>
          Current needs
          <input
            name="currentNeeds"
            defaultValue={profile?.current_needs.join(", ") ?? ""}
            placeholder="bike tune-up, tutoring"
          />
        </label>
      </fieldset>

      <fieldset className={styles.panel} hidden={step !== 3}>
        <legend>Trade Preferences</legend>
        <label>
          Trade radius: 1-50 km
          <input
            name="allowedRadiusKm"
            type="range"
            min={1}
            max={50}
            defaultValue={profile?.allowed_radius_km ?? 20}
          />
        </label>
        <label>
          Optional preferred categories
          <select name="preferredCategoryIds" multiple defaultValue={profile?.preferred_category_ids ?? []}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.group_name}: {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Work/profession
          <input name="profession" defaultValue={profile?.profession ?? ""} />
        </label>
        <label>
          Hobbies
          <input name="hobbies" defaultValue={profile?.hobbies.join(", ") ?? ""} />
        </label>
      </fieldset>

      <div className={styles.actions}>
        <button type="button" onClick={() => setStep((value) => Math.max(value - 1, 0))} disabled={step === 0}>
          Back
        </button>
        {step < steps.length - 1 ? (
          <button type="button" onClick={() => setStep((value) => Math.min(value + 1, steps.length - 1))}>
            Next
          </button>
        ) : (
          <button type="submit">Save profile</button>
        )}
      </div>
    </form>
  );
}
