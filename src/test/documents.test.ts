import { describe, it, expect, vi, beforeEach } from "vitest";
vi.mock("@/lib/supabase/server", () => ({ createServerClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("uuid", () => ({ v4: () => "test-uuid" }));

import { createServerClient } from "@/lib/supabase/server";
import { uploadDocument, deleteDocument } from "@/app/actions/documents";

const mockStorage = { upload: vi.fn(), remove: vi.fn() };
const mockFrom = vi.fn();
const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: mockFrom,
  storage: { from: vi.fn(() => mockStorage) },
};

beforeEach(() => {
  vi.clearAllMocks();
  (createServerClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);
  mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "owner-1" } } });
});

describe("uploadDocument", () => {
  it("returns error for missing file", async () => {
    const result = await uploadDocument({
      entityType: "property",
      entityId: "e1",
      docType: "other",
      file: new File([], ""),
    });
    expect(result?.error).toBe("No file provided");
  });

  it("uses correct storage path format", async () => {
    mockStorage.upload.mockResolvedValue({ error: null });
    const chain = { insert: vi.fn().mockResolvedValue({ error: null }) };
    mockFrom.mockReturnValue(chain);
    const file = new File(["content"], "contract.pdf", { type: "application/pdf" });
    await uploadDocument({ entityType: "property", entityId: "e1", docType: "rental_contract", file });
    expect(mockStorage.upload).toHaveBeenCalledWith("owner-1/property/e1/test-uuid.pdf", file);
  });

  it("removes file from storage if DB insert fails", async () => {
    mockStorage.upload.mockResolvedValue({ error: null });
    const chain = { insert: vi.fn().mockResolvedValue({ error: { message: "DB error" } }) };
    mockFrom.mockReturnValue(chain);
    const file = new File(["x"], "doc.pdf", { type: "application/pdf" });
    const result = await uploadDocument({
      entityType: "property",
      entityId: "e1",
      docType: "other",
      file,
    });
    expect(mockStorage.remove).toHaveBeenCalled();
    expect(result?.error).toBe("DB error");
  });
});

describe("deleteDocument", () => {
  it("returns error if not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
    const result = await deleteDocument("doc-1", "owner-1/property/e1/file.pdf");
    expect(result?.error).toBe("Not authenticated");
  });

  it("deletes DB record first then removes from storage on success", async () => {
    mockStorage.remove.mockResolvedValue({ error: null });
    const eqInner = vi.fn().mockResolvedValue({ error: null });
    const chain = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({ eq: eqInner }),
    };
    mockFrom.mockReturnValue(chain);
    const result = await deleteDocument("doc-1", "owner-1/property/e1/file.pdf");
    expect(chain.delete).toHaveBeenCalled();
    expect(mockStorage.remove).toHaveBeenCalledWith(["owner-1/property/e1/file.pdf"]);
    expect(result).toBeNull();
  });

  it("does not remove from storage if DB delete fails", async () => {
    const eqInner = vi.fn().mockResolvedValue({ error: { message: "DB error" } });
    const chain = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({ eq: eqInner }),
    };
    mockFrom.mockReturnValue(chain);
    const result = await deleteDocument("doc-1", "owner-1/property/e1/file.pdf");
    expect(mockStorage.remove).not.toHaveBeenCalled();
    expect(result?.error).toBe("DB error");
  });
});
