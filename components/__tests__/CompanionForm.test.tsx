import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CompanionForm from "@/components/CompanionForm";

const pushMock = jest.fn();
const createCompanionMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

jest.mock("@/lib/actions/companions.action", () => ({
  createCompanion: (...args: unknown[]) => createCompanionMock(...args),
}));

jest.mock("@/components/ui/select", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  const SelectContext = React.createContext({
    onValueChange: (() => undefined) as (value: string) => void,
    value: "",
  });

  return {
    Select: ({
      children,
      onValueChange,
      value,
    }: {
      children: React.ReactNode;
      onValueChange: (value: string) => void;
      value: string;
    }) => (
      <SelectContext.Provider value={{ onValueChange, value }}>
        {children}
      </SelectContext.Provider>
    ),
    SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SelectValue: ({ placeholder }: { placeholder?: string }) => (
      <span>{placeholder ?? null}</span>
    ),
    SelectContent: ({ children }: { children: React.ReactNode }) => {
      const { onValueChange, value } = React.useContext(SelectContext);

      return (
        <select
          data-testid="mock-select"
          onChange={(event) => onValueChange(event.target.value)}
          value={value}
        >
          <option value="">Select</option>
          {children}
        </select>
      );
    },
    SelectItem: ({
      children,
      value,
    }: {
      children: React.ReactNode;
      value: string;
    }) => <option value={value}>{children}</option>,
  };
});

const selectOption = async (index: number, option: string) => {
  await userEvent.selectOptions(screen.getAllByTestId("mock-select")[index], option);
};

describe("CompanionForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows an error message when creation fails", async () => {
    createCompanionMock.mockRejectedValueOnce(
      new Error("We could not create your companion right now.")
    );

    render(<CompanionForm />);

    await userEvent.type(
      screen.getByLabelText("Companion name"),
      "Orbit"
    );
    await selectOption(0, "science");
    await userEvent.type(
      screen.getByLabelText("What should companion help with"),
      "Solar systems"
    );
    await selectOption(1, "Female");
    await selectOption(2, "Formal");

    const durationInput = screen.getByLabelText(
      "Estimated session duration in minutes"
    );
    await userEvent.clear(durationInput);
    await userEvent.type(durationInput, "25");
    await userEvent.click(
      screen.getByRole("button", { name: "Build Your Companion" })
    );

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent("We could not create your companion right now.");
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("redirects to the new companion on success", async () => {
    createCompanionMock.mockResolvedValueOnce({ id: "comp_999" });

    render(<CompanionForm />);

    await userEvent.type(
      screen.getByLabelText("Companion name"),
      "Orbit"
    );
    await selectOption(0, "science");
    await userEvent.type(
      screen.getByLabelText("What should companion help with"),
      "Solar systems"
    );
    await selectOption(1, "Female");
    await selectOption(2, "Formal");

    const durationInput = screen.getByLabelText(
      "Estimated session duration in minutes"
    );
    await userEvent.clear(durationInput);
    await userEvent.type(durationInput, "25");
    await userEvent.click(
      screen.getByRole("button", { name: "Build Your Companion" })
    );

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/companions/comp_999");
    });
  });
});
