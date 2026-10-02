import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { FormActions, FormDialog } from "@/components/shared/FormDialog";

import common from "@/messages/en/common.json";

const messages = { common };

function wrap(ui: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe("FormDialog", () => {
  it("renders title, description and children when open", () => {
    render(
      wrap(
        <FormDialog open onOpenChange={() => {}} title="New" description="Fill in">
          <p>body</p>
        </FormDialog>
      )
    );
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByText("Fill in")).toBeInTheDocument();
    expect(screen.getByText("body")).toBeInTheDocument();
  });

  it("does not mount children when closed", () => {
    render(
      wrap(
        <FormDialog open={false} onOpenChange={() => {}} title="New" description="d">
          <p>body</p>
        </FormDialog>
      )
    );
    expect(screen.queryByText("body")).not.toBeInTheDocument();
  });
});

describe("FormActions", () => {
  it("shows cancel only when a handler is given", async () => {
    const onCancel = vi.fn();
    const { rerender } = render(wrap(<FormActions submitLabel="Save" loading={false} />));
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();

    rerender(wrap(<FormActions submitLabel="Save" loading={false} onCancel={onCancel} />));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("renders a submit button with the label", () => {
    render(wrap(<FormActions submitLabel="Save" loading={false} />));
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("type", "submit");
  });
});
