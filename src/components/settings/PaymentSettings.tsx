"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Landmark, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/Select";
import { LoadingText, RetryButton } from "@/components/ui/table";
import { errorMessage } from "@/lib/api-client";
import { useResolveAccount, useSetSettlementAccount, useSettlementAccount, useSettlementBanks } from "@/lib/queries/school";
import type { ResolvedAccount, SettlementAccount } from "@/types/school";

/** What a person types, read off a statement: spaces and hyphens are dropped, as the backend does. */
const digitsOf = (value: string) => value.replace(/[\s-]/g, "");
/** Every Nigerian (NUBAN) account number is exactly ten digits. */
const isAccountNumber = (value: string) => /^\d{10}$/.test(value);

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-slate-gray/10 bg-white p-5">{children}</div>;
}

/**
 * Payments: the bank account parents' online fee payments are paid into. The money goes straight
 * to the school's own account through Paystack; EduGear never holds it. Until an account is set,
 * parents can't pay by card (proof-of-payment uploads still work).
 *
 * Only school.update can see or change this (the backend refuses anyone else), which in practice
 * means the proprietor: choosing where the school's money lands isn't a bookkeeping act.
 */
export function PaymentSettings({ canUpdate }: { canUpdate: boolean }) {
  const account = useSettlementAccount(canUpdate);
  const [editing, setEditing] = useState(false);

  if (!canUpdate) {
    return (
      <Card>
        <p className="text-sm text-slate-gray">
          Only someone who can change school settings (usually the proprietor) can view or change the bank account fees
          are paid into.
        </p>
      </Card>
    );
  }

  if (account.isPending) {
    return (
      <Card>
        <p className="text-sm text-slate-gray">
          <LoadingText label="Loading..." />
        </p>
      </Card>
    );
  }

  if (account.isError) {
    return (
      <Card>
        <p className="text-sm text-slate-gray">
          {errorMessage(account.error)}
          <RetryButton onRetry={() => account.refetch()} />
        </p>
      </Card>
    );
  }

  const showForm = editing || !account.data.configured;

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="flex items-center gap-2 text-sm font-bold text-primary-navy">
          <Landmark className="h-4 w-4 text-bright-blue" />
          Fee Payout Account
        </h2>
        <p className="mt-1 text-xs text-slate-gray">
          When parents pay fees online, the money goes straight into this account. EduGear never holds it. Paystack&apos;s
          card charge is taken from each payment before it reaches you.
        </p>

        {account.data.configured ? (
          <CurrentAccount account={account.data} onChange={editing ? undefined : () => setEditing(true)} />
        ) : (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
            No account set up yet, so parents can&apos;t pay online. They can still upload proof of a bank transfer.
          </p>
        )}
      </Card>

      {showForm && (
        <AccountForm
          replacing={account.data.configured}
          onCancel={account.data.configured ? () => setEditing(false) : undefined}
          onSaved={() => setEditing(false)}
        />
      )}
    </div>
  );
}

function CurrentAccount({ account, onChange }: { account: SettlementAccount; onChange?: () => void }) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-gray/10 bg-cloud-sky/40 px-4 py-3">
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-sm font-bold text-primary-navy">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="truncate">{account.accountName}</span>
        </p>
        <p className="mt-0.5 text-xs text-slate-gray">
          {account.bankName} · {account.accountNumberMasked}
        </p>
      </div>
      {onChange && (
        <Button type="button" variant="secondary" className="w-auto px-3 py-2" onClick={onChange}>
          Change Account
        </Button>
      )}
    </div>
  );
}

/**
 * Two steps, so a mistyped digit is caught here and not by whoever would receive a term's fees:
 * check the account (the bank returns the holder's name), confirm that name, then save. Changing
 * the bank or number after checking clears the result, so what's saved is always what was confirmed.
 */
function AccountForm({ replacing, onCancel, onSaved }: { replacing: boolean; onCancel?: () => void; onSaved: () => void }) {
  const banks = useSettlementBanks();
  const resolve = useResolveAccount();
  const save = useSetSettlementAccount();

  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [checked, setChecked] = useState<ResolvedAccount | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bankList = useMemo(() => [...(banks.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)), [banks.data]);
  const bankName = bankList.find((b) => b.code === bankCode)?.name;
  const digits = digitsOf(accountNumber);

  function edited() {
    setChecked(null);
    setError(null);
    setFieldError(null);
  }

  async function check(e: React.FormEvent) {
    e.preventDefault();
    if (!bankCode) return setError("Choose your bank.");
    if (!isAccountNumber(digits)) return setFieldError("An account number is ten digits.");
    setError(null);
    setFieldError(null);
    try {
      setChecked(await resolve.mutateAsync({ bankCode, accountNumber: digits }));
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function confirm() {
    setError(null);
    try {
      await save.mutateAsync({ bankCode, accountNumber: digits });
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  if (banks.isPending) {
    return (
      <Card>
        <p className="text-sm text-slate-gray">
          <LoadingText label="Loading banks..." />
        </p>
      </Card>
    );
  }

  if (banks.isError) {
    return (
      <Card>
        <p className="text-sm text-slate-gray">
          {errorMessage(banks.error)}
          <RetryButton onRetry={() => banks.refetch()} />
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-sm font-bold text-primary-navy">{replacing ? "Change Payout Account" : "Add Payout Account"}</h2>
      <p className="mt-1 text-xs text-slate-gray">
        Use an account in the school&apos;s name. We&apos;ll ask your bank who owns it so you can confirm before anything
        is saved.
      </p>

      <form onSubmit={check} noValidate className="mt-4 space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField
            label="Bank *"
            name="bankCode"
            value={bankCode}
            onChange={(e) => {
              setBankCode(e.target.value);
              edited();
            }}
          >
            <option value="">Choose a bank</option>
            {bankList.map((bank) => (
              <option key={bank.code} value={bank.code}>
                {bank.name}
              </option>
            ))}
          </SelectField>
          <Input
            label="Account Number *"
            name="accountNumber"
            inputMode="numeric"
            autoComplete="off"
            maxLength={14}
            placeholder="0123456789"
            value={accountNumber}
            error={fieldError ?? undefined}
            onChange={(e) => {
              setAccountNumber(e.target.value);
              edited();
            }}
          />
        </div>

        {checked ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Your bank says this account belongs to</p>
            <p className="mt-1 text-base font-bold text-primary-navy">{checked.accountName}</p>
            <p className="mt-0.5 text-xs text-slate-gray">
              {bankName} · {checked.accountNumberMasked}
            </p>
            <p className="mt-2 text-xs text-slate-gray">
              If that isn&apos;t the school&apos;s account, don&apos;t save it. Check the number and try again.
            </p>
          </div>
        ) : null}

        <FormError message={error} />

        <div className="flex flex-wrap justify-end gap-3 pt-1">
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              className="w-auto px-4"
              onClick={onCancel}
              disabled={resolve.isPending || save.isPending}
            >
              Cancel
            </Button>
          )}
          {checked ? (
            <Button type="button" className="w-auto px-4" isLoading={save.isPending} onClick={confirm}>
              <ShieldCheck className="h-4 w-4" />
              Yes, Pay Fees Into This Account
            </Button>
          ) : (
            <Button type="submit" className="w-auto px-4" isLoading={resolve.isPending}>
              Check Account
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
