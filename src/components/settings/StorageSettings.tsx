"use client";

import { useState } from "react";
import { HardDrive, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { IconAction, LoadingText, RetryButton } from "@/components/ui/table";
import { errorMessage } from "@/lib/api-client";
import { useDeleteFile, useSchoolFiles, useStorageQuota } from "@/lib/queries/school";
import { cn, formatDate } from "@/lib/utils";
import type { StoredFile } from "@/types/school";

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

const PURPOSE_LABELS = { STUDENT_PHOTO: "Student photo", SCHOOL_LOGO: "School logo" } as const;

/**
 * Storage: how much of the school's file allowance is used (the ceiling is set by EduGear),
 * plus a clean-up list of uploads nothing uses: photos or logos that were uploaded and then
 * replaced or never attached. Files in use, and payment evidence, are never offered for deletion.
 */
export function StorageSettings({ canUpdate }: { canUpdate: boolean }) {
  const quota = useStorageQuota();
  const photos = useSchoolFiles("STUDENT_PHOTO");
  const logos = useSchoolFiles("SCHOOL_LOGO");
  const remove = useDeleteFile();
  const [deleting, setDeleting] = useState<StoredFile | null>(null);

  const unused = [...(photos.data?.data ?? []), ...(logos.data?.data ?? [])].filter((f) => !f.linkedId);
  const listLoading = photos.isPending || logos.isPending;
  const listError = photos.error ?? logos.error;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-gray/10 bg-white p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-primary-navy">
          <HardDrive className="h-4 w-4 text-bright-blue" />
          File Storage
        </h2>
        {quota.isPending ? (
          <p className="mt-4 text-sm text-slate-gray">
            <LoadingText label="Loading..." />
          </p>
        ) : quota.isError ? (
          <p className="mt-4 text-sm text-slate-gray">
            {errorMessage(quota.error)}
            <RetryButton onRetry={() => quota.refetch()} />
          </p>
        ) : (
          <>
            <p className="mt-4 text-2xl font-bold text-primary-navy">
              {formatBytes(quota.data.usedBytes)}
              <span className="text-sm font-medium text-slate-gray"> of {formatBytes(quota.data.limitBytes)} used</span>
            </p>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-gray/10">
              <div
                className={cn(
                  "h-full animate-grow-x rounded-full",
                  quota.data.percentUsed >= 90 ? "bg-red-500" : quota.data.percentUsed >= 75 ? "bg-amber-500" : "bg-bright-blue",
                )}
                style={{ width: `${Math.max(quota.data.percentUsed, 1)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-gray">
              {quota.data.percentUsed}% used · {formatBytes(quota.data.remainingBytes)} left. Student photos, the school logo and
              parents&apos; proof of payment count towards this. Contact EduGear support if you need more.
            </p>
          </>
        )}
      </div>

      <div className="rounded-xl border border-slate-gray/10 bg-white p-5">
        <h2 className="text-sm font-bold text-primary-navy">Unused Uploads</h2>
        <p className="mt-1 text-xs text-slate-gray">
          Photos and logos that were uploaded but aren&apos;t attached to anything. Deleting them frees up space.
        </p>
        {listLoading ? (
          <p className="mt-4 text-sm text-slate-gray">
            <LoadingText label="Loading..." />
          </p>
        ) : listError ? (
          <p className="mt-4 text-sm text-slate-gray">{errorMessage(listError)}</p>
        ) : unused.length === 0 ? (
          <p className="mt-4 text-sm text-slate-gray">Nothing to clean up.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-gray/10">
            {unused.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-primary-navy">{f.displayName}</p>
                  <p className="text-xs text-slate-gray">
                    {PURPOSE_LABELS[f.purpose as keyof typeof PURPOSE_LABELS]} · {formatBytes(f.sizeBytes)} · {formatDate(f.createdAt)}
                  </p>
                </div>
                {canUpdate && <IconAction icon={Trash2} label="Delete file" tone="danger" onClick={() => setDeleting(f)} />}
              </li>
            ))}
          </ul>
        )}
      </div>

      {deleting && (
        <ConfirmDialog
          title="Delete File"
          description={`Delete ${deleting.displayName}? This can't be undone.`}
          onClose={() => setDeleting(null)}
          onConfirm={() => remove.mutateAsync(deleting.id)}
        />
      )}
    </div>
  );
}
