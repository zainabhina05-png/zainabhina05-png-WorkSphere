/**
 * Unit tests for ToastItem pause-on-hover behaviour (issue #1664).
 *
 * Verifies that:
 *  - The auto-dismiss timer is cleared when the mouse enters the toast.
 *  - The timer restarts (with the full 4-second window) after the mouse leaves.
 *  - The timer is cleared when the toast receives keyboard focus.
 *  - The timer restarts when the toast loses focus (blur).
 *  - The manual dismiss button works regardless of hover state.
 */

import React from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mock lucide-react icons used by Toast.tsx
// ---------------------------------------------------------------------------
jest.mock("lucide-react", () => ({
  X: () => <svg data-testid="icon-x" />,
  CheckCircle2: () => <svg data-testid="icon-check" />,
  AlertCircle: () => <svg data-testid="icon-alert-circle" />,
  AlertTriangle: () => <svg data-testid="icon-alert-triangle" />,
}));

// ---------------------------------------------------------------------------
// Mock @/lib/utils cn helper
// ---------------------------------------------------------------------------
jest.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

// ---------------------------------------------------------------------------
// We test ToastProvider end-to-end via the public useToast hook so we exercise
// the full stack without importing the internal ToastItem directly.
// ---------------------------------------------------------------------------
import { ToastProvider, useToast } from "@/components/ui/Toast";

/** Helper: renders the ToastProvider and a button that triggers a toast. */
function renderToast(opts: {
  type?: "success" | "error" | "warning";
  action?: { label: string; onClick: () => void };
}) {
  const Wrapper = () => {
    const { toast } = useToast();
    return (
      <button
        data-testid="trigger"
        onClick={() =>
          toast("Test message", opts.type ?? "success", opts.action)
        }
      >
        Show toast
      </button>
    );
  };

  return render(
    <ToastProvider>
      <Wrapper />
    </ToastProvider>,
  );
}

describe("ToastItem — pause-on-hover", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("auto-dismisses after 4 seconds when not hovered", () => {
    renderToast({});

    act(() => {
      fireEvent.click(screen.getByTestId("trigger"));
    });

    expect(screen.getByRole("status")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(4000);
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("pauses the timer while the mouse is over the toast", () => {
    renderToast({});

    act(() => {
      fireEvent.click(screen.getByTestId("trigger"));
    });

    const toastEl = screen.getByRole("status");

    // Hover over the toast at t=1s
    act(() => {
      jest.advanceTimersByTime(1000);
      fireEvent.mouseEnter(toastEl);
    });

    // Advance past the original 4-second threshold — toast must still be visible
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("restarts the full 4-second timer after mouseLeave", () => {
    renderToast({});

    act(() => {
      fireEvent.click(screen.getByTestId("trigger"));
    });

    const toastEl = screen.getByRole("status");

    // Hover and then leave
    act(() => {
      jest.advanceTimersByTime(1000);
      fireEvent.mouseEnter(toastEl);
    });

    act(() => {
      jest.advanceTimersByTime(3000);
      fireEvent.mouseLeave(toastEl);
    });

    // Only 1 second elapsed after leave — toast must still be visible
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByRole("status")).toBeInTheDocument();

    // Full 4 seconds elapsed after leave — now it should be gone
    act(() => {
      jest.advanceTimersByTime(3001);
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("pauses the timer on focus and restarts on blur", () => {
    renderToast({});

    act(() => {
      fireEvent.click(screen.getByTestId("trigger"));
    });

    const toastEl = screen.getByRole("status");

    act(() => {
      jest.advanceTimersByTime(500);
      fireEvent.focus(toastEl);
    });

    // Advance past 4-second mark — toast must be held by focus
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(screen.getByRole("status")).toBeInTheDocument();

    // Blur restarts the timer
    act(() => {
      fireEvent.blur(toastEl);
    });

    act(() => {
      jest.advanceTimersByTime(4001);
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("manual dismiss removes the toast immediately regardless of hover state", () => {
    renderToast({});

    act(() => {
      fireEvent.click(screen.getByTestId("trigger"));
    });

    const toastEl = screen.getByRole("status");

    // Hover so the auto-timer is paused
    act(() => {
      fireEvent.mouseEnter(toastEl);
    });

    // Click the ✕ dismiss button
    act(() => {
      fireEvent.click(screen.getByLabelText("Dismiss notification"));
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("action button fires callback and dismisses the toast", () => {
    const onAction = jest.fn();
    renderToast({ action: { label: "Undo", onClick: onAction } });

    act(() => {
      fireEvent.click(screen.getByTestId("trigger"));
    });

    act(() => {
      fireEvent.click(screen.getByText("Undo"));
    });

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
