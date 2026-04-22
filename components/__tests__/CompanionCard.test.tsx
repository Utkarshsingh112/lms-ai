import { render, screen } from "@testing-library/react";

import CompanionCard from "@/components/CompanionCard";

describe("CompanionCard", () => {
  it("renders the companion details and launch link", () => {
    render(
      <CompanionCard
        id="comp_123"
        name="Orbit"
        topic="Solar systems"
        subject="science"
        duration={25}
        color="#ffffff"
      />
    );

    expect(screen.getByText("Orbit")).toBeInTheDocument();
    expect(screen.getByText("Solar systems")).toBeInTheDocument();
    expect(screen.getByText("25 minutes")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Launch Session" })).toHaveAttribute(
      "href",
      "/companions/comp_123"
    );
  });
});
