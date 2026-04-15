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

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [interests, setInterests] = useState(profile?.interests?.join(", ") ?? "");
  const [skills, setSkills] = useState(profile?.skills?.join(", ") ?? "");
  const [currentWants, setCurrentWants] = useState(profile?.current_wants?.join(", ") ?? "");
  const [currentNeeds, setCurrentNeeds] = useState(profile?.current_needs?.join(", ") ?? "");
  const [allowedRadiusKm, setAllowedRadiusKm] = useState(String(profile?.allowed_radius_km ?? 20));
  const [profession, setProfession] = useState(profile?.profession ?? "");
  const [hobbies, setHobbies] = useState(profile?.hobbies?.join(", ") ?? "");
  const [preferredCategoryIds, setPreferredCategoryIds] = useState<string[]>(
    profile?.preferred_category_ids ?? [],
  );

  function goNext() {
    setStep((value) => Math.min(value + 1, steps.length - 1));
  }

  function goBack() {
    setStep((value) => Math.max(value - 1, 0));
  }

  return (
    <form
      action={updateProfileAction}
      className={styles.form}
      onKeyDown={(event) => {
        if (event.key === "Enter" && step < steps.length - 1) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="existingAvatarUrl" value={profile?.avatar_url ?? ""} />
          <ProfilePhotoField existingAvatarUrl={profile?.avatar_url} />
      <input type="hidden" name="displayName" value={displayName} />
      <input type="hidden" name="username" value={username} />
      <input type="hidden" name="city" value={city} />
      <input type="hidden" name="bio" value={bio} />
      <input type="hidden" name="interests" value={interests} />
      <input type="hidden" name="skills" value={skills} />
      <input type="hidden" name="currentWants" value={currentWants} />
      <input type="hidden" name="currentNeeds" value={currentNeeds} />
      <input type="hidden" name="allowedRadiusKm" value={allowedRadiusKm} />
      <input type="hidden" name="profession" value={profession} />
      <input type="hidden" name="hobbies" value={hobbies} />
      {preferredCategoryIds.map((id) => (
        <input key={id} type="hidden" name="preferredCategoryIds" value={id} />
      ))}

      <ol className={styles.steps} aria-label="Profile setup steps">
        {steps.map((label, index) => (
          <li key={label} className={index === step ? styles.activeStep : ""}>
            <button type="button" onClick={() => setStep(index)}>
              {index + 1}. {label}
            </button>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <fieldset className={styles.panel}>
          <legend>Basic Identity</legend>
          <label>
            Display name
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              minLength={2}
              required
            />
          </label>
          <label>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={3}
            />
          </label>
          <label>
            City/town
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              minLength={2}
              required
            />
          </label>
          <label>
            Short bio
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A quick 1-3 sentence intro for nearby traders."
            />
          </label>
        </fieldset>
      )}

      {step === 1 && (
        <fieldset className={styles.panel}>
          <legend>Interests & Skills</legend>
          <p>Separate tags with commas. Tags are saved lowercase and deduplicated.</p>
          <label>
            Interests
            <input
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="gardening, books"
            />
          </label>
          <label>
            Skills
            <input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="repairs, design"
            />
          </label>
        </fieldset>
      )}

      {step === 2 && (
        <fieldset className={styles.panel}>
          <legend>What I&apos;m Looking For</legend>
          <p>Add what would make barter useful right now.</p>
          <label>
            Current wants
            <input
              value={currentWants}
              onChange={(e) => setCurrentWants(e.target.value)}
              placeholder="kids clothes, craft supplies"
            />
          </label>
          <label>
            Current needs
            <input
              value={currentNeeds}
              onChange={(e) => setCurrentNeeds(e.target.value)}
              placeholder="bike tune-up, tutoring"
            />
          </label>
        </fieldset>
      )}

      {step === 3 && (
        <fieldset className={styles.panel}>
          <legend>Trade Preferences</legend>
          <label>
            Trade radius: 1-50 km
            <input
              type="range"
              min={1}
              max={50}
              value={allowedRadiusKm}
              onChange={(e) => setAllowedRadiusKm(e.target.value)}
            />
          </label>
          <p>{allowedRadiusKm} km</p>

          <label>
            Optional preferred categories
            <select
              multiple
              value={preferredCategoryIds}
              onChange={(e) =>
                setPreferredCategoryIds(
                  Array.from(e.target.selectedOptions, (option) => option.value),
                )
              }
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.group_name}: {category.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Work/profession
            <input
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
            />
          </label>

          <label>
            Hobbies
            <input
              value={hobbies}
              onChange={(e) => setHobbies(e.target.value)}
            />
          </label>
        </fieldset>
      )}

      <div className={styles.actions}>
        <button type="button" onClick={goBack} disabled={step === 0}>
          Back
        </button>

        {step < steps.length - 1 ? (
          <button key={`next-${step}`} type="button" onClick={goNext}>
            Next
          </button>
        ) : (
          <button key="save-profile" type="submit">
            Save profile
          </button>
        )}
      </div>
    </form>
  );
}