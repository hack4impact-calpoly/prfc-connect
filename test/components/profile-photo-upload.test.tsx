import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), info: vi.fn() },
}));

import { toast } from "sonner";
import { ProfilePhotoUpload } from "@/components/profile/profile-photo-upload";

describe("ProfilePhotoUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders initials fallback when photoUrl is null", () => {
    render(<ProfilePhotoUpload name="Kevin Rutledge" photoUrl={null} onUpload={vi.fn()} />);
    expect(screen.getByText("KR")).toBeInTheDocument();
    expect(screen.getByText("Profile Photo")).toBeInTheDocument();
    expect(screen.getByText("JPG or PNG. Max size of 2MB")).toBeInTheDocument();
  });

  it("rejects files larger than 2MB and does not call onUpload", () => {
    const onUpload = vi.fn();
    render(<ProfilePhotoUpload name="Kevin" photoUrl={null} onUpload={onUpload} />);
    const file = new File([new Uint8Array(2 * 1024 * 1024 + 1)], "big.jpg", { type: "image/jpeg" });
    const input = screen.getByLabelText("Upload profile photo") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    expect(onUpload).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Profile photo must be 2MB or smaller");
  });

  it("rejects non-JPG/PNG file types", () => {
    const onUpload = vi.fn();
    render(<ProfilePhotoUpload name="Kevin" photoUrl={null} onUpload={onUpload} />);
    const file = new File([new Uint8Array(1024)], "photo.gif", { type: "image/gif" });
    const input = screen.getByLabelText("Upload profile photo") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    expect(onUpload).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Profile photo must be JPG or PNG");
  });

  it("calls onUpload with valid JPG under 2MB", () => {
    const onUpload = vi.fn();
    render(<ProfilePhotoUpload name="Kevin" photoUrl={null} onUpload={onUpload} />);
    const file = new File([new Uint8Array(1024)], "photo.jpg", { type: "image/jpeg" });
    const input = screen.getByLabelText("Upload profile photo") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    expect(onUpload).toHaveBeenCalledWith(file);
  });
});
