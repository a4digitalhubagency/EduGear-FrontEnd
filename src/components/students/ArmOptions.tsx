"use client";

import { useClassArms, useClasses } from "@/lib/queries/academics";

/**
 * <option>s for picking a class arm, grouped by class ("JSS 1" → "JSS 1 A", "JSS 1 B"),
 * with a leading "not placed yet" choice whose value is "".
 */
export function ArmOptions({ emptyLabel = "Not placed yet" }: { emptyLabel?: string }) {
  const classes = useClasses();
  const arms = useClassArms();
  const armList = arms.data?.data ?? [];

  return (
    <>
      <option value="">{arms.isPending ? "Loading classes..." : emptyLabel}</option>
      {(classes.data?.data ?? []).map((c) => (
        <optgroup key={c.id} label={c.name}>
          {armList
            .filter((arm) => arm.classId === c.id)
            .map((arm) => (
              <option key={arm.id} value={arm.id}>
                {arm.fullName}
                {arm.capacity ? ` (${arm.studentCount}/${arm.capacity})` : ""}
              </option>
            ))}
        </optgroup>
      ))}
    </>
  );
}
