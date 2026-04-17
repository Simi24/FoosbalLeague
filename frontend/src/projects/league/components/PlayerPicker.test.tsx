import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlayerPicker, type PickerPlayer } from "./PlayerPicker";

const alice: PickerPlayer = {
  player_id: "a",
  display_name: "Alice",
  current_elo: 1100,
};
const bob: PickerPlayer = {
  player_id: "b",
  display_name: "Bob",
  current_elo: 1400,
};
const charlie: PickerPlayer = {
  player_id: "c",
  display_name: "Charlie",
  current_elo: 1250,
};

const renderPicker = (
  overrides: Partial<React.ComponentProps<typeof PlayerPicker>> = {},
) => {
  const onSelect = vi.fn();
  const onDismiss = vi.fn();
  const utils = render(
    <PlayerPicker
      open
      players={[alice, bob, charlie]}
      onSelect={onSelect}
      onDismiss={onDismiss}
      {...overrides}
    />,
  );
  return { ...utils, onSelect, onDismiss };
};

const listNames = () =>
  screen
    .getAllByRole("option")
    .map((el) => within(el).getByText(/^(Alice|Bob|Charlie)$/i).textContent);

describe("PlayerPicker", () => {
  it("renders nothing when not open", () => {
    render(
      <PlayerPicker
        open={false}
        players={[alice]}
        onSelect={() => {}}
        onDismiss={() => {}}
      />,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders all players sorted alphabetically by default", () => {
    renderPicker();
    expect(listNames()).toEqual(["Alice", "Bob", "Charlie"]);
  });

  it("sorts by ELO descending when sort toggle is flipped", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(screen.getByRole("button", { name: "ELO" }));
    expect(listNames()).toEqual(["Bob", "Charlie", "Alice"]);
  });

  it("filters case-insensitively by substring", async () => {
    const user = userEvent.setup();
    renderPicker();
    const search = screen.getByPlaceholderText(/search players/i);
    await user.type(search, "LI");
    expect(listNames()).toEqual(["Alice", "Charlie"]);
  });

  it("shows empty-state when search returns no matches", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.type(screen.getByPlaceholderText(/search players/i), "zzzz");
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByText(/no players match your search/i)).toBeInTheDocument();
  });

  it("calls onSelect with player_id when a row is clicked", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();
    await user.click(screen.getByRole("option", { name: "Bob" }));
    expect(onSelect).toHaveBeenCalledWith("b");
  });

  it("disables already-picked rows and surfaces team label in name", () => {
    renderPicker({
      players: [
        alice,
        { ...bob, disabledReason: "Team 1" },
        { ...charlie, disabledReason: "Team 2" },
      ],
    });
    const bobRow = screen.getByRole("option", { name: /bob, team 1/i });
    expect(bobRow).toBeDisabled();
    expect(bobRow.getAttribute("aria-disabled")).toBe("true");
    const charlieRow = screen.getByRole("option", { name: /charlie, team 2/i });
    expect(charlieRow).toBeDisabled();
  });

  it("clicking a disabled row does not fire onSelect", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker({
      players: [{ ...bob, disabledReason: "Team 1" }],
    });
    await user.click(screen.getByRole("option", { name: /bob, team 1/i }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("fires onDismiss on Escape key", async () => {
    const user = userEvent.setup();
    const { onDismiss } = renderPicker();
    await user.keyboard("{Escape}");
    expect(onDismiss).toHaveBeenCalled();
  });

  it("fires onDismiss on backdrop click", async () => {
    const user = userEvent.setup();
    const { onDismiss, container } = renderPicker();
    const backdrop = container.ownerDocument.querySelector(
      '[aria-hidden="true"].bg-black\\/50',
    ) as HTMLElement;
    await user.click(backdrop);
    expect(onDismiss).toHaveBeenCalled();
  });

  it("fires onDismiss when close button is clicked", async () => {
    const user = userEvent.setup();
    const { onDismiss } = renderPicker();
    await user.click(screen.getByRole("button", { name: /close picker/i }));
    expect(onDismiss).toHaveBeenCalled();
  });

  it("resets search query when reopened", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <PlayerPicker
        open
        players={[alice, bob]}
        onSelect={() => {}}
        onDismiss={() => {}}
      />,
    );
    await user.type(screen.getByPlaceholderText(/search players/i), "alic");
    expect(screen.queryAllByRole("option")).toHaveLength(1);
    rerender(
      <PlayerPicker
        open={false}
        players={[alice, bob]}
        onSelect={() => {}}
        onDismiss={() => {}}
      />,
    );
    rerender(
      <PlayerPicker
        open
        players={[alice, bob]}
        onSelect={() => {}}
        onDismiss={() => {}}
      />,
    );
    expect(screen.queryAllByRole("option")).toHaveLength(2);
  });
});
