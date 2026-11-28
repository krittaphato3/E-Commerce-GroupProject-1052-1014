import { useState } from "react";
import type { FormEvent } from "react";

const MIN_LENGTH = 5;
const MAX_LENGTH = 200;
const LENGTH_MESSAGE = `Reason must be ${MIN_LENGTH} to ${MAX_LENGTH} characters.`;

interface RejectOrderDialogProps {
  orderNumber: string;
  pending: boolean;
  /** A message from a failed request; the typed text is kept. */
  error: string | null;
  onSubmit: (reason: string) => void;
  onClose: () => void;
}

/**
 * Collects the rejection reason (FR-14, DEC-44). The length check here is for
 * convenience only; the API enforces BR-12.
 */
export function RejectOrderDialog({
  orderNumber,
  pending,
  error,
  onSubmit,
  onClose,
}: RejectOrderDialogProps) {
  const [reason, setReason] = useState("");
  const [invalid, setInvalid] = useState(false);
  const length = reason.trim().length;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (length < MIN_LENGTH || length > MAX_LENGTH) {
      setInvalid(true);
      return;
    }

    onSubmit(reason.trim());
  }

  return (
    <>
      <div
        className="modal d-block"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-dialog-title"
      >
        <div className="modal-dialog modal-dialog-centered">
          <form className="modal-content" onSubmit={handleSubmit} noValidate>
            <div className="modal-header">
              <h2 className="modal-title h5" id="reject-dialog-title">
                Reject order {orderNumber}
              </h2>
            </div>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger text-break" role="alert">
                  {error}
                </div>
              )}
              <label className="form-label" htmlFor="reject-reason">
                Reason
              </label>
              <textarea
                id="reject-reason"
                className={`form-control ${invalid ? "is-invalid" : ""}`}
                rows={3}
                value={reason}
                disabled={pending}
                autoFocus
                aria-describedby="reject-reason-help"
                onChange={(event) => {
                  setReason(event.target.value);
                  setInvalid(false);
                }}
              />
              <div id="reject-reason-help">
                {invalid && <div className="invalid-feedback d-block">{LENGTH_MESSAGE}</div>}
                <div
                  className={`small text-end ${length > MAX_LENGTH ? "text-danger" : "text-muted"}`}
                >
                  {`${length}/${MAX_LENGTH}`}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={pending}
                onClick={onClose}
              >
                Back
              </button>
              <button type="submit" className="btn btn-danger" disabled={pending}>
                {pending ? "Rejecting…" : "Reject order"}
              </button>
            </div>
          </form>
        </div>
      </div>
      <div className="modal-backdrop show" />
    </>
  );
}
